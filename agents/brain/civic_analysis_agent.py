import os
import requests
import json
from typing import TypedDict, Optional, List
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv
from tavily import TavilyClient

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")

# --- Structured Output Schemas ---

class TriageResult(BaseModel):
    sentiment: str = Field(description="Must be one of: POSITIVE, NEUTRAL, NEGATIVE, ALARMING")
    sentiment_score: float = Field(description="Float 0.0 to 1.0. 0=Very Negative, 1=Very Positive")
    urgency: str = Field(description="Must be one of: LOW, MEDIUM, HIGH, CRITICAL")
    post_type: str = Field(description="Must be one of: CIVIC_REPORT, POLICY_RUMOR, GENERAL")

class FactCheckResult(BaseModel):
    is_misinformation: bool = Field(description="TRUE if the claim contradicts official announcements")
    context_note: str = Field(description="A correction note citing the official source, or 'No contradictions found'")

# --- Graph State ---

class CivicAnalysisState(TypedDict, total=False):
    # Inputs
    post_id: str
    title: str
    description: str
    image_urls: List[str]
    city: str

    # Node 1 outputs
    sentiment: str
    sentiment_score: float
    urgency: str
    post_type: str

    # Node 2 outputs
    embedding: List[float]
    cluster_id: Optional[str]

    # Node 3 outputs (only for POLICY_RUMOR)
    is_misinformation: Optional[bool]
    context_note: Optional[str]

# --- LLM Setup ---

llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0, max_retries=2)
triage_engine = llm.with_structured_output(TriageResult)
factcheck_engine = llm.with_structured_output(FactCheckResult)

# --- Node 1: Triage & Sentiment ---

async def triage_and_sentiment(state: CivicAnalysisState):
    """Classifies sentiment, urgency, and post type (Civic Report vs Policy Rumor)."""
    print(f"--- NODE 1: TRIAGE & SENTIMENT for Post {state.get('post_id')} ---")

    title = state.get("title", "")
    description = state.get("description", "")
    image_urls = state.get("image_urls", [])

    content_parts = [
        {
            "type": "text",
            "text": f"""Analyze this UrbanConnect civic forum post.

POST TITLE: {title}
POST DESCRIPTION: {description}

CLASSIFICATION RULES:
1. SENTIMENT: Rate the emotional tone.
   - POSITIVE: Constructive suggestions, appreciation, community support
   - NEUTRAL: Questions, informational posts, neutral observations
   - NEGATIVE: Complaints, frustration, anger about local issues
   - ALARMING: Panic-inducing, fear-mongering, inflammatory language

2. URGENCY: How time-sensitive is this?
   - LOW: General discussion, suggestions, non-urgent observations
   - MEDIUM: Ongoing local issues needing attention
   - HIGH: Active safety hazards, flooding, outages affecting many people
   - CRITICAL: Immediate life-threatening situations

3. POST TYPE (Critical for routing):
   - CIVIC_REPORT: First-hand accounts of LOCAL, PHYSICAL problems the user is witnessing.
     (e.g., "Huge pothole on MG Road", "Water leaking from pipe near my house", "Garbage piled up in Sector 5")
     These are raw ground-truth data. They should BYPASS fact-checking.
   - POLICY_RUMOR: Wide-scale statements, rumors, or questions about city POLICY, GOVERNMENT RULES, or ANNOUNCEMENTS.
     (e.g., "City hall is shutting off the water grid today!", "Is it true they cancelled the property tax deadline?", "I heard heritage walks cost 500 Rs now.")
     If the user is making a claim OR asking a question about a government action, route it here so it can be FACT-CHECKED.
   - GENERAL: Strictly casual/social discussion, opinions, or non-governmental questions.
     (e.g., "Which is the best park in Delhi?", "I love this city", "Where can I buy good food?")
"""
        }
    ]

    # Add images if available (multimodal)
    for url in image_urls[:3]:  # Max 3 images
        if url:
            content_parts.append({"type": "image_url", "image_url": url})

    message = HumanMessage(content=content_parts)
    
    try:
        result = await triage_engine.ainvoke([message])
        print(f"  └─> [SUCCESS] Sentiment: {result.sentiment} ({result.sentiment_score}) | Urgency: {result.urgency} | Type: {result.post_type}")
        return {
            "sentiment": result.sentiment,
            "sentiment_score": result.sentiment_score,
            "urgency": result.urgency,
            "post_type": result.post_type
        }
    except Exception as e:
        print(f"Triage failed: {e}")
        return {
            "sentiment": "NEUTRAL",
            "sentiment_score": 0.5,
            "urgency": "LOW",
            "post_type": "GENERAL"
        }


# --- Node 2: Vectorize & Cluster ---

async def vectorize_and_cluster(state: CivicAnalysisState):
    """Generates embedding and checks for emerging issue clusters."""
    print(f"--- NODE 2: VECTORIZE & CLUSTER for Post {state.get('post_id')} ---")

    from brain.embedding_agent import generate_embedding

    # Build text to embed (combine title + description for richer semantic vector)
    text_to_embed = f"{state.get('title', '')} {state.get('description', '')}".strip()

    try:
        embedding = await generate_embedding(text_to_embed)
    except Exception as e:
        print(f"Embedding generation failed: {e}")
        return {"embedding": [], "cluster_id": None}

    # Call Node.js backend for cluster check
    cluster_id = None
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/urbanconnect/cluster-check",
            json={
                "postId": state.get("post_id"),
                "embedding": embedding,
                "city": state.get("city", "")
            },
            timeout=10
        )
        data = response.json()
        cluster_id = data.get("clusterId")
        print(f"  ├─> Backend Response: clusterId={cluster_id}, size={data.get('clusterSize')}")
        if cluster_id:
            print(f"  └─> [CLUSTER FORMED/JOINED] {cluster_id}")
        else:
            print("  └─> [NO CLUSTER] Not enough similarity")
    except Exception as e:
        print(f"  └─> [ERROR] Cluster check failed: {e}")

    return {"embedding": embedding, "cluster_id": cluster_id}


# --- Node 3: RAG Fact-Check (only for POLICY_RUMOR) ---

async def rag_fact_check(state: CivicAnalysisState):
    """Retrieves official announcements and verifies the user's policy-rumor against them."""
    print(f"--- NODE 3: RAG FACT-CHECK for Post {state.get('post_id')} ---")

    embedding = state.get("embedding", [])
    city = state.get("city", "")
    title = state.get("title", "")
    description = state.get("description", "")
    image_urls = state.get("image_urls", [])

    if not embedding:
        print("No embedding available for RAG search, skipping fact-check.")
        return {"is_misinformation": None, "context_note": None}

    # 1. Retrieve relevant official announcements via vector search
    official_context = "No official announcements found for this city."
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/announcements/search",
            json={"embedding": embedding, "city": city},
            timeout=10
        )
        data = response.json()
        announcements = data.get("results", [])

        if announcements:
            context_parts = []
            for i, ann in enumerate(announcements[:5], 1):
                context_parts.append(
                    f"[Official Announcement {i}] "
                    f"By: {ann.get('authorityName', 'Unknown Official')} ({ann.get('department', '')})\n"
                    f"Title: {ann.get('title', '')}\n"
                    f"Content: {ann.get('body', '')}\n"
                    f"Date: {ann.get('createdAt', '')}"
                )
            official_context = "\n\n".join(context_parts)

        # --- STEP 1.5: WEB SEARCH FALLBACK ---
        # If we have 0 or 1 local announcements, let's hit the live web to double check rumors.
        if len(announcements) < 2:
            print("  ├─> [WEB SEARCH] Local RAG insufficient. Hitting Tavily API...")
            try:
                tavily_api_key = os.getenv("TAVILY_API_KEY")
                if tavily_api_key:
                    tavily_client = TavilyClient(api_key=tavily_api_key)
                    # Always include a city — fallback to Prayagraj if city is missing from state
                    search_city = city.strip() if city and city.strip() else "Prayagraj"
                    query = f"{search_city} {title} news official statement"
                    print(f"  ├─> [WEB SEARCH] Query: \"{query}\"")
                    search_result = tavily_client.search(query=query, search_depth="basic", max_results=2)
                    
                    web_context_parts = []
                    for i, res in enumerate(search_result.get("results", []), 1):
                        web_context_parts.append(
                            f"[Live Web Source {i}] "
                            f"Title: {res.get('title', '')}\n"
                            f"Content Snippet: {res.get('content', '')}\n"
                            f"URL: {res.get('url', '')}"
                        )
                    
                    if web_context_parts:
                        web_context_str = "\n\n".join(web_context_parts)
                        if "No official announcements" in official_context:
                            official_context = web_context_str
                        else:
                            official_context += "\n\n" + web_context_str
                        print("  ├─> [WEB SEARCH] Found live web context.")
                else:
                    print("  ├─> [WEB SEARCH] Skipped. No TAVILY_API_KEY found.")
            except Exception as e:
                print(f"  ├─> [WEB SEARCH] Failed: {e}")

    except Exception as e:
        print(f"Announcement search failed: {e}")

    # 2. Ask LLM to verify claim against official context
    prompt = f"""You are a municipal fact-checker for the UrbanConnect civic platform.

USER'S CLAIM:
Title: {title}
Description: {description}

OFFICIAL ANNOUNCEMENTS (Ground Truth):
{official_context}

INSTRUCTIONS:
1. Compare the user's claim strictly against the provided official announcements.
2. If the user's claim (or the premise of their question) CONTRADICTS an official announcement, mark it as misinformation.
3. If images are provided, explicitly analyze them. If the image appears to be manipulated, a fake document, or visually contradicts the official facts, mark it as misinformation.
4. If there is NO relevant official announcement to compare against, DO NOT flag it — set is_misinformation to false.
5. If the claim is partially correct but misleading (e.g., saying something costs money when the announcement says it's free), mark it as misinformation and explain the nuance.
6. Generate a clear, concise context_note that cites the specific official source.
"""

    # Build multimodality content
    content_parts = [{"type": "text", "text": prompt}]
    for url in image_urls[:3]:
        if url:
            content_parts.append({"type": "image_url", "image_url": url})

    try:
        result = await factcheck_engine.ainvoke([HumanMessage(content=content_parts)])
        print(f"  ├─> Misinformation Flagged: {result.is_misinformation}")
        print(f"  └─> Context generated: {bool(result.context_note)}")
        return {
            "is_misinformation": result.is_misinformation,
            "context_note": result.context_note
        }
    except Exception as e:
        print(f"Fact-check failed: {e}")
        return {"is_misinformation": None, "context_note": None}


# --- Router ---

def route_after_triage(state: CivicAnalysisState):
    """Routes POLICY_RUMOR posts to fact-checking, others skip it."""
    if state.get("post_type") == "POLICY_RUMOR":
        return "fact_check"
    return "end"


# --- Graph Assembly ---

graph = StateGraph(CivicAnalysisState)

graph.add_node("triage_and_sentiment", triage_and_sentiment)
graph.add_node("vectorize_and_cluster", vectorize_and_cluster)
graph.add_node("rag_fact_check", rag_fact_check)

# Triage runs first
graph.set_entry_point("triage_and_sentiment")

# After triage, ALWAYS vectorize
graph.add_edge("triage_and_sentiment", "vectorize_and_cluster")

# After vectorizing, conditionally fact-check
graph.add_conditional_edges(
    "vectorize_and_cluster",
    route_after_triage,
    {
        "fact_check": "rag_fact_check",
        "end": END
    }
)

graph.add_edge("rag_fact_check", END)

civic_analysis_workflow = graph.compile()
