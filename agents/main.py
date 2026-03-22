import os
from jose import jwt
import requests
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- LANGGRAPH IMPORTS ---
from brain.resolveWasteAgent import workflow
from brain.safety_agent import safety_app
from brain.assistant_agent import assistant_app

# [CHANGE 1: Renamed 'app' to 'report_agent' to avoid conflict with FastAPI app]
from brain.orchestrator import app as report_agent 
from brain.job_agent import app as job_agent_workflow

app = FastAPI()
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")  # e.g. dev-xyz.us.auth0.com
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
ALGORITHMS = ["RS256"]
# --- CORS MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REQUEST SCHEMAS ---
class RouteBatchRequest(BaseModel):
    payload: Dict[str, List[float]]

class JobProcessRequest(BaseModel):
    jobId: str
    description: Optional[str] = ""
    category: str
    location: str
    amount: float
    time: str

class LocationModel(BaseModel):
    lat: float
    lng: float

class EmbedRequest(BaseModel):
    text: str

class ReportRequest(BaseModel):
    imageUrl: str
    description: Optional[str] = ""
    location: LocationModel
    address: str
    status: str
    geohash: str
class WasteReportRequest(BaseModel):
    imageUrl:str
    staffimageUrl:str

class SafetyAnalysisRequest(BaseModel):
    reportId: str
    description: str
    chatLogs: List[str]

def fetch_user_profile(access_token: str):
    url = f"https://{AUTH0_DOMAIN}/userinfo"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Failed to fetch user profile")

    return response.json()
def get_user_from_token(authorization: str = Header(...)):
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid auth header")

        token = authorization.split(" ")[1]

        # Fetch Auth0 public keys
        jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
        jwks = requests.get(jwks_url).json()

        unverified_header = jwt.get_unverified_header(token)

        rsa_key = None
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"],
                }

        if rsa_key is None:
            raise HTTPException(status_code=401, detail="Invalid token key")

        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=ALGORITHMS,
            audience=AUTH0_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/"
        )
        profile = fetch_user_profile(token)
        return {
            "userId": payload["sub"],      # auth0|xxxxx
            "email": profile.get("email"),
        }

    except Exception as e:
        print("Auth error:", e)
        raise HTTPException(status_code=401, detail="Unauthorized")

# --- ENDPOINTS ---
@app.post("/process-job")
async def process_job(req: JobProcessRequest):
    try:
        initial_state = {
            "job_id": req.jobId,
            "description": req.description,
            "category": req.category,
            "location": req.location,
            "amount": req.amount,
            "time": req.time
        }
        
        final_state = await job_agent_workflow.ainvoke(initial_state)
        
        return {
            "status": "success",
            "enriched_description": final_state.get("enriched_description"),
            "job_embedding": final_state.get("job_embedding"),
            "feedback_form": [q for q in final_state.get("feedback_form", [])]
        }
    except Exception as e:
        print(f"Error in Process Job Endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/embed")
async def generate_embedding_endpoint(req: EmbedRequest):
    try:
        print("request hitted in main.py")
        from brain.embedding_agent import generate_embedding
        vector = await generate_embedding(req.text)
        return {
            "status": "success",
            "embedding": vector
        }
    except Exception as e:
        print(f"Error in embed endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/resolveWasteReports")
async def resolve_waste_report(req: WasteReportRequest):
    try:
        initial_report_state = {
            "imageUrl": req.imageUrl,
            "staffimageUrl": req.staffimageUrl,
        }
        print(f"Initial State: {initial_report_state}")
        final_state = await workflow.ainvoke(initial_report_state)
        confidence_data = final_state.get("confidence_result")

        if not confidence_data:
            raise HTTPException(status_code=500, detail="Analysis completed but no result returned.")
        return {
            "success": True,
            "confidence_result": confidence_data.model_dump()
        }
    except Exception as e:
        print(f"Error in Report Endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Orchestration Failed: {str(e)}")
@app.post("/reports")
async def create_report(
    req: ReportRequest, 
    user_info: dict = Depends(get_user_from_token) 
):
    try:
        secure_user_id = user_info["userId"]
        secure_email = user_info["email"]
        print(f"email ${secure_email} usr_Id ${secure_user_id}")

        print(f"--- Processing Report from: {secure_email} ---")

        initial_report_state = {
            "userId": secure_user_id,
            "email": secure_email,
            "imageUrl": req.imageUrl,
            "description": req.description,
            "location": {"lat": req.location.lat, "lng": req.location.lng},
            "geohash": req.geohash,
            "address": req.address,
            "status": req.status, 
            

            "locality_imageUrl": None,
            "locality_email": None,
            "locality_userId": None,
            "locality_reportId": None,

            "tool": "SAVE", 
            

            "water_analysis": None,
            "waste_analysis": None,
            "infra_analysis": None,
            "electric_analysis": None,
            "uncertain_analysis": None,
            "aiAnalysis": None,
            "severity": None,
            "assigned_category": None,
            "route": "",
            "updatedRoute": "",
            
 
            "reportId": None 
        }
        

        result = await report_agent.ainvoke(initial_report_state)
        

        category = result.get("assigned_category") 
        extracted_title = "Report Processed" 
        tool=result.get("tool")

        if category:
 
            analysis_key = f"{category.lower()}_analysis" 
            analysis_data = result.get(analysis_key)
            if analysis_data and hasattr(analysis_data, 'title'):
                extracted_title = analysis_data.title
            elif analysis_data and isinstance(analysis_data, dict):
                extracted_title = analysis_data.get('title', extracted_title)

        if result.get("reportId"):
             return {
                "status": "success",
                "message": "Report processed successfully",
                "reportId": result.get("reportId"),
                "category": category,
                "title": extracted_title, 
                "severity": result.get("severity"),
                "ai_analysis": result.get("aiAnalysis"),
                "tool":tool

            }
        else:
            return {
                "status": "partial_success",
                "message": "Analysis complete, but save might have failed.",
                "category": category,
                "ai_analysis": result.get("aiAnalysis")
            }

    except Exception as e:
        print(f"Error in Report Endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Orchestration Failed: {str(e)}")

@app.post("/analyze-safety")
async def analyze_chat_safety(req: SafetyAnalysisRequest):
    try:
        initial_state = {
            "reportId": req.reportId,
            "description": req.description,
            "chatLogs": req.chatLogs
        }
        
        final_state = await safety_app.ainvoke(initial_state)
        result = final_state.get("analysis_result")
        
        return {
            "status": "success",
            "severity": result.severity,
            "summary": result.summary
        }
    except Exception as e:
        print(f"Error in analyze-safety endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class SkillGapRequest(BaseModel):
    questions: List[str]
    ratings: List[int]
    pairedQuestions: Optional[List[Dict]] = None

@app.post("/process-skill-gap")
async def process_skill_gap(req: SkillGapRequest):
    try:
        from brain.skill_gap_agent import workflow as skill_gap_workflow
        
        initial_state = {
            "questions": req.questions,
            "ratings": req.ratings,
            "pairedQuestions": req.pairedQuestions or []
        }
        
        final_state = await skill_gap_workflow.ainvoke(initial_state)
        
        return {
            "status": "success",
            "skill_gap_string": final_state.get("skill_gap_string"),
            "skill_gap_embeddings": final_state.get("skill_gap_embeddings")
        }
    except Exception as e:
        print(f"Error in Process Skill Gap Endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─── Assistant v2 (LangGraph) ────────────────────────────

class AssistantChatRequest(BaseModel):
    text: str
    sessionId: Optional[str] = None
    messages: Optional[List[Dict]] = None


@app.post("/assistant-chat")
async def assistant_chat(
    req: AssistantChatRequest,
    user_info: dict = Depends(get_user_from_token),
    authorization: str = Header(...),
):
    try:
        user_id = user_info["userId"]
        token = authorization.split(" ")[1] if authorization.startswith("Bearer ") else ""

        # Build conversation history
        history = req.messages or []

        initial_state = {
            "user_id": user_id,
            "session_id": req.sessionId or user_id,
            "current_message": req.text,
            "messages": history,
            "tool_calls": None,
            "tool_results": None,
            "proactive_updates": None,
            "last_seen_context": None,
            "response": "",
            "action": None,
            "_token": token,
        }

        result = await assistant_app.ainvoke(initial_state)

        return {
            "reply": result.get("response", "Sorry, I couldn't process that."),
            "action": result.get("action"),
            "proactiveUpdates": bool(result.get("proactive_updates")),
        }
    except Exception as e:
        print(f"[AssistantV2] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)