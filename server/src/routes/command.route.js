import express from "express";
import { checkJwt } from "../auth/authMiddleware.js";
import { processCommand } from "../controllers/command/command.controller.js";

const router = express.Router();

/**
 * POST /api/command/process
 * 
 * Classifies user intent via Gemini and executes the corresponding action.
 * Supports multi-turn flows (e.g. job posting wizard).
 * 
 * Body: {
 *   text: string,                      // User's raw input
 *   pendingIntent?: string,            // Intent from previous turn (multi-turn)
 *   collectedData?: object,            // Data accumulated so far
 *   conversationHistory?: [{role, text}] // Recent messages for context
 * }
 */
router.post("/process", checkJwt, processCommand);

export default router;
