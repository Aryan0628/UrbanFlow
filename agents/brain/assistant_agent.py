import os
import json
from dotenv import load_dotenv

from langgraph.graph import StateGraph, END, START
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from brain.assistant_state import AssistantState
from brain.assistant_tools import TOOL_SCHEMAS, execute_tool

load_dotenv()

# ─── LLM Setup ──────────────────────────────────────────────────────

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-pro",
    temperature=0.1,
    max_retries=2,
    google_api_key=os.getenv("GOOGLE_API_KEY"),
)


# ─── System Prompts ─────────────────────────────────────────────────

ROUTER_PROMPT = """You are the UrbanFlow AI Assistant router. Your job is to understand the user's message and decide which tools to call.

AVAILABLE TOOLS:
{tool_descriptions}

RULES:
1. Analyze the user's message and conversation history carefully.
2. If the message is "__session_start__", call "check_updates" to proactively inform the user of any changes.
3. For general chat/greetings, respond with NO tool calls — just set "direct_response" to true.
4. For navigation requests (open StreetGig, go to CivicConnect, etc.), call "navigate".
5. For job posting requests ("post a job", "I need a plumber", "hire someone"), call "post_job" with whatever details you can extract from the message. This is a multi-turn flow — the server will ask for missing fields.
6. For donation/KindShare queries ("I want to donate", "any donation requests?", "who needs help?"), call "search_kindshare". Optionally extract a category (food, clothes, medicine, books).
7. You can call multiple tools if needed.
8. Be lenient with language — understand Hindi, Hinglish, and casual phrasing.

Respond ONLY with valid JSON (no markdown):
{{
    "direct_response": false,
    "tool_calls": [
        {{"name": "tool_name", "arguments": {{...}}}}
    ]
}}

Or for simple responses:
{{
    "direct_response": true,
    "message": "Your direct response here",
    "tool_calls": []
}}
"""

RESPONDER_PROMPT = """You are the UrbanFlow AI Voice Assistant. You are speaking to a user through a voice interface on a smart city app.

CRITICAL VOICE RULES:
- Keep responses SHORT (2-4 sentences max). This will be spoken aloud.
- Do NOT use markdown, emojis, bullet points, or formatting.
- Use natural, conversational language as if talking to a friend.
- Be warm, helpful, and concise.
- Do NOT say "asterisk" or read out formatting characters.
- Numbers should be spoken naturally (e.g., "three reports" not "3 reports").

CONTEXT:
User ID: {user_id}
Conversation so far:
{history}

Tool results:
{tool_results}

{proactive_context}

Based on the above context, generate a natural spoken response. If there are navigation actions, mention them briefly.
"""


# ─── Node 1: Router ─────────────────────────────────────────────────

def _format_tool_descriptions() -> str:
    lines = []
    for t in TOOL_SCHEMAS:
        params = t["parameters"]["properties"]
        param_str = ", ".join(f'{k}: {v.get("type", "any")}' for k, v in params.items()) if params else "none"
        lines.append(f'- {t["name"]}({param_str}): {t["description"]}')
    return "\n".join(lines)


async def router_node(state: AssistantState):
    """Classifies intent and selects tools to call."""
    history_text = "\n".join(
        f'{m["role"]}: {m["text"]}' for m in (state.get("messages") or [])[-10:]
    )

    prompt = ROUTER_PROMPT.format(tool_descriptions=_format_tool_descriptions())

    user_msg = f"""Conversation history:
{history_text}

Current user message: "{state['current_message']}"

Decide which tools to call (if any)."""

    try:
        response = await llm.ainvoke([
            SystemMessage(content=prompt),
            HumanMessage(content=user_msg),
        ])

        raw = response.content.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(raw)

        if parsed.get("direct_response"):
            return {
                "tool_calls": [],
                "tool_results": [],
                "response": parsed.get("message", ""),
            }

        return {
            "tool_calls": parsed.get("tool_calls", []),
            "tool_results": [],
        }
    except Exception as e:
        print(f"[Router] Error: {e}")
        return {
            "tool_calls": [],
            "tool_results": [],
            "response": "Sorry, I had trouble understanding that. Could you try again?",
        }


# ─── Node 2: Tool Executor ──────────────────────────────────────────

async def tool_executor(state: AssistantState):
    """Execute all selected tools and collect results."""
    tool_calls = state.get("tool_calls") or []
    if not tool_calls:
        return {"tool_results": []}

    user_id = state.get("user_id", "")
    token = state.get("_token", "")  # injected by the endpoint
    results = []
    action = None

    for tc in tool_calls:
        name = tc.get("name", "")
        args = tc.get("arguments", {})
        result = await execute_tool(name, args, user_id, token)
        results.append(result)

        # Capture navigation action if present
        if result.get("action"):
            action = result["action"]

    return {
        "tool_results": results,
        "action": action,
    }


# ─── Node 3: Context Enricher ───────────────────────────────────────

async def context_enricher(state: AssistantState):
    """Merge tool results with proactive update context."""
    tool_results = state.get("tool_results") or []
    proactive = ""

    for result in tool_results:
        if result.get("tool") == "check_updates" and result.get("has_updates"):
            updates = result.get("updates", [])
            proactive = "Proactive updates for the user:\n" + "\n".join(updates)

    return {"proactive_updates": proactive}


# ─── Node 4: Responder ──────────────────────────────────────────────

async def responder_node(state: AssistantState):
    """Generate a natural language response using tool results and context."""
    # If router already generated a direct response, pass it through
    if state.get("response") and not state.get("tool_results"):
        return {}

    history_text = "\n".join(
        f'{m["role"]}: {m["text"]}' for m in (state.get("messages") or [])[-10:]
    )

    tool_results_text = json.dumps(state.get("tool_results") or [], indent=2, default=str)
    proactive = state.get("proactive_updates") or ""
    proactive_context = f"PROACTIVE UPDATES TO MENTION:\n{proactive}" if proactive else "No proactive updates."

    prompt = RESPONDER_PROMPT.format(
        user_id=state.get("user_id", "unknown"),
        history=history_text or "No prior conversation.",
        tool_results=tool_results_text,
        proactive_context=proactive_context,
    )

    try:
        response = await llm.ainvoke([
            HumanMessage(content=prompt),
        ])
        return {"response": response.content.strip()}
    except Exception as e:
        print(f"[Responder] Error: {e}")
        return {"response": "Sorry, I couldn't process that right now. Please try again."}


# ─── Graph Assembly ──────────────────────────────────────────────────

def should_use_tools(state: AssistantState) -> str:
    """Conditional edge: skip tools if router gave a direct response."""
    if state.get("response") and not state.get("tool_calls"):
        return "responder"
    return "tool_executor"


graph = StateGraph(AssistantState)

graph.add_node("router", router_node)
graph.add_node("tool_executor", tool_executor)
graph.add_node("context_enricher", context_enricher)
graph.add_node("responder", responder_node)

graph.add_edge(START, "router")
graph.add_conditional_edges("router", should_use_tools, {
    "tool_executor": "tool_executor",
    "responder": "responder",
})
graph.add_edge("tool_executor", "context_enricher")
graph.add_edge("context_enricher", "responder")
graph.add_edge("responder", END)

assistant_app = graph.compile()
