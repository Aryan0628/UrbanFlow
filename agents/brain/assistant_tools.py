"""
assistant_tools.py — Tool functions for the LangGraph voice assistant.

Each tool fetches data from the Node.js backend via HTTP (same pattern as
voice_analysis_agent.py). These are called by the tool_executor node.
"""

import os
import httpx
from dotenv import load_dotenv

load_dotenv()
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")


async def _get(path: str, token: str = None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(f"{BACKEND_URL}{path}", headers=headers)
        res.raise_for_status()
        return res.json()


async def _post(path: str, body: dict, token: str = None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(f"{BACKEND_URL}{path}", json=body, headers=headers)
        res.raise_for_status()
        return res.json()


# ─── TOOL DEFINITIONS (for LLM function-calling) ────────────────────

TOOL_SCHEMAS = [
    {
        "name": "list_reports",
        "description": "List the user's most recent civic reports/complaints (up to 5). Use when user asks about their reports or wants to track something but hasn't given a specific ID.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "track_report",
        "description": "Get detailed status of a specific report by its ID. Use when user provides or selects a report ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "report_id": {
                    "type": "string",
                    "description": "The report ID to look up",
                }
            },
            "required": ["report_id"],
        },
    },
    {
        "name": "list_jobs",
        "description": "List the user's recently posted StreetGig jobs (up to 5).",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "check_notifications",
        "description": "Check unread notifications for the user (up to 5).",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_profile",
        "description": "Get the user's profile information.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "navigate",
        "description": "Navigate the user to a specific section of the app. Use for requests like 'open StreetGig' or 'go to CivicConnect'.",
        "parameters": {
            "type": "object",
            "properties": {
                "destination": {
                    "type": "string",
                    "enum": [
                        "CivicConnect",
                        "StreetGig",
                        "SisterHood",
                        "KindShare",
                        "Profile",
                        "Notifications",
                    ],
                    "description": "App section to navigate to",
                }
            },
            "required": ["destination"],
        },
    },
    {
        "name": "check_updates",
        "description": "Check what has changed for the user since their last session — report status changes, new job applications, unread notifications. Use proactively when starting a new session.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "post_job",
        "description": "Post a new StreetGig job. This is a multi-turn flow. On the first call provide whatever info you have. The server will ask for missing fields step by step. Pass the accumulated collected_data back on each subsequent call.",
        "parameters": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "Job category e.g. Plumber, Electrician, Carpenter, Cleaners, Painters, etc.",
                },
                "amount": {
                    "type": "string",
                    "description": "Budget amount e.g. 500, 1000",
                },
                "time": {
                    "type": "string",
                    "description": "Duration e.g. Quick (< 1 hr), 1-2 Hours, Half Day, Full Day, Flexible",
                },
                "description": {
                    "type": "string",
                    "description": "Description of the work needed",
                },
                "collected_data": {
                    "type": "object",
                    "description": "Previously collected data from earlier turns in this flow. Pass this back on each subsequent call.",
                },
            },
            "required": [],
        },
    },
    {
        "name": "search_kindshare",
        "description": "Search for active donation requests on KindShare. Use when user asks about donating, wants to help, or asks if anyone needs donations.",
        "parameters": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "Optional category filter: food, clothes, medicine, books, etc.",
                }
            },
            "required": [],
        },
    },
]


# ─── NAVIGATION MAP ─────────────────────────────────────────────────

NAV_PATHS = {
    "CivicConnect": "/(main)/(tabs)/CivicConnect",
    "StreetGig": "/(main)/(tabs)/StreetGig",
    "SisterHood": "/(main)/(tabs)/SisterHood",
    "KindShare": "/kindshare",
    "Profile": "/(main)/profile",
    "Notifications": "/(main)/notifications",
}


# ─── TOOL IMPLEMENTATIONS ───────────────────────────────────────────

async def execute_tool(tool_name: str, args: dict, user_id: str, token: str = None) -> dict:
    """Dispatch a tool call and return structured result."""
    try:
        if tool_name == "list_reports":
            return await _list_reports(user_id, token)
        elif tool_name == "track_report":
            return await _track_report(args.get("report_id", ""), token)
        elif tool_name == "list_jobs":
            return await _list_jobs(user_id, token)
        elif tool_name == "check_notifications":
            return await _check_notifications(user_id, token)
        elif tool_name == "get_profile":
            return await _get_profile(user_id, token)
        elif tool_name == "navigate":
            return _navigate(args.get("destination", ""))
        elif tool_name == "check_updates":
            return await _check_updates(user_id, token)
        elif tool_name == "post_job":
            return await _post_job(args, user_id, token)
        elif tool_name == "search_kindshare":
            return await _search_kindshare(args, token)
        else:
            return {"error": f"Unknown tool: {tool_name}"}
    except Exception as e:
        print(f"[Tool] {tool_name} failed: {e}")
        return {"error": str(e)}


async def _list_reports(user_id: str, token: str) -> dict:
    """Fetch user's recent reports via the command endpoint."""
    try:
        data = await _post("/api/command/process", {
            "text": "show my reports",
            "pendingIntent": None,
            "collectedData": {},
            "conversationHistory": [],
        }, token)
        return {
            "tool": "list_reports",
            "data": data,
        }
    except Exception as e:
        return {"tool": "list_reports", "error": str(e)}


async def _track_report(report_id: str, token: str) -> dict:
    try:
        data = await _post("/api/command/process", {
            "text": f"track report {report_id}",
            "pendingIntent": "track_report",
            "collectedData": {"reportId": report_id},
            "conversationHistory": [],
        }, token)
        return {"tool": "track_report", "data": data}
    except Exception as e:
        return {"tool": "track_report", "error": str(e)}


async def _list_jobs(user_id: str, token: str) -> dict:
    try:
        data = await _post("/api/command/process", {
            "text": "my jobs",
            "pendingIntent": None,
            "collectedData": {},
            "conversationHistory": [],
        }, token)
        return {"tool": "list_jobs", "data": data}
    except Exception as e:
        return {"tool": "list_jobs", "error": str(e)}


async def _check_notifications(user_id: str, token: str) -> dict:
    try:
        data = await _post("/api/command/process", {
            "text": "show notifications",
            "pendingIntent": None,
            "collectedData": {},
            "conversationHistory": [],
        }, token)
        return {"tool": "check_notifications", "data": data}
    except Exception as e:
        return {"tool": "check_notifications", "error": str(e)}


async def _get_profile(user_id: str, token: str) -> dict:
    try:
        data = await _post("/api/command/process", {
            "text": "show my profile",
            "pendingIntent": None,
            "collectedData": {},
            "conversationHistory": [],
        }, token)
        return {"tool": "get_profile", "data": data}
    except Exception as e:
        return {"tool": "get_profile", "error": str(e)}


def _navigate(destination: str) -> dict:
    path = NAV_PATHS.get(destination)
    if path:
        return {
            "tool": "navigate",
            "action": {"type": "navigate", "path": path},
            "message": f"Opening {destination} for you.",
        }
    return {"tool": "navigate", "error": f"Unknown destination: {destination}"}


async def _check_updates(user_id: str, token: str) -> dict:
    """Aggregate updates from reports, jobs, and notifications."""
    updates = []

    # Check notifications
    try:
        notif_data = await _post("/api/command/process", {
            "text": "show notifications",
            "pendingIntent": None,
            "collectedData": {},
            "conversationHistory": [],
        }, token)
        reply = notif_data.get("reply", "")
        if "unread" in reply.lower():
            updates.append(reply)
    except:
        pass

    # Check recent reports
    try:
        report_data = await _post("/api/command/process", {
            "text": "show my reports",
            "pendingIntent": None,
            "collectedData": {},
            "conversationHistory": [],
        }, token)
        follow_up = report_data.get("followUp", "")
        reply = report_data.get("reply", "")
        if follow_up:
            updates.append(f"Reports: {follow_up}")
        elif reply:
            updates.append(f"Reports: {reply}")
    except:
        pass

    return {
        "tool": "check_updates",
        "updates": updates,
        "has_updates": len(updates) > 0,
    }


async def _post_job(args: dict, user_id: str, token: str) -> dict:
    """Multi-turn job posting via the command endpoint."""
    try:
        # Build collected data from whatever the LLM extracted
        collected = args.get("collected_data") or {}
        for field in ["category", "amount", "time", "description"]:
            val = args.get(field)
            if val:
                collected[field] = val

        data = await _post("/api/command/process", {
            "text": args.get("description") or args.get("category") or "post a job",
            "pendingIntent": "post_job",
            "collectedData": collected,
            "conversationHistory": [],
        }, token)

        result = {"tool": "post_job", "data": data}

        # If the server returned a followUp, it means more info is needed
        if data.get("followUp"):
            result["needs_more_info"] = True
            result["collected_data"] = data.get("collectedData", collected)

        # If the server returned a navigation action, the job was created
        if data.get("action"):
            result["action"] = data["action"]

        return result
    except Exception as e:
        return {"tool": "post_job", "error": str(e)}


async def _search_kindshare(args: dict, token: str) -> dict:
    """Search active donation requests on KindShare."""
    try:
        category = args.get("category", "")
        text = f"search kindshare donations{' ' + category if category else ''}"

        data = await _post("/api/command/process", {
            "text": text,
            "pendingIntent": "search_kindshare",
            "collectedData": {"category": category} if category else {},
            "conversationHistory": [],
        }, token)

        result = {"tool": "search_kindshare", "data": data}
        if data.get("action"):
            result["action"] = data["action"]
        return result
    except Exception as e:
        return {"tool": "search_kindshare", "error": str(e)}
