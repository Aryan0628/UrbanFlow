from typing import TypedDict, Optional, List


class Message(TypedDict):
    role: str       # "user" | "assistant"
    text: str


class Action(TypedDict, total=False):
    type: str       # "navigate" | "open_notifications" | "highlight_sos"
    path: str


class AssistantState(TypedDict):
    # ── Input ──
    user_id: str
    session_id: str
    current_message: str
    messages: List[Message]             # conversation history (last 20)

    # ── Internal ──
    tool_calls: Optional[List[dict]]    # tools selected by the router
    tool_results: Optional[List[dict]]  # data returned by tools
    proactive_updates: Optional[str]    # auto-detected changes since last session
    last_seen_context: Optional[dict]   # snapshot from previous session

    # ── Output ──
    response: str
    action: Optional[Action]
