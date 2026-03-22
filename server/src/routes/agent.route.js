import express from "express";
import axios from "axios";
import { checkJwt } from "../auth/authMiddleware.js";

const router = express.Router();
const PYTHON_SERVER = process.env.PYTHON_SERVER || "http://localhost:10000";

/**
 * POST /api/agent/chat
 *
 * Proxy to the Python LangGraph assistant.
 * Forwards the authenticated user's request to the Python server.
 *
 * Body: { text: string, sessionId?: string, messages?: [{role, text}] }
 * Response: { reply: string, action?: object, proactiveUpdates?: boolean }
 */
router.post("/chat", checkJwt, async (req, res) => {
  try {
    const token = req.headers.authorization;
    const { text, sessionId, messages } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ message: "Text is required" });
    }

    const response = await axios.post(
      `${PYTHON_SERVER}/assistant-chat`,
      { text, sessionId, messages },
      {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    return res.json(response.data);
  } catch (err) {
    console.error("[Agent Proxy] Error:", err.response?.data || err.message);
    return res.status(err.response?.status || 500).json({
      reply: "Sorry, the assistant is unavailable right now. Please try again.",
    });
  }
});

export default router;
