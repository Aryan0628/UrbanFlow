import express from "express";
import { checkJwt } from "../auth/authMiddleware.js";
import { processCommand } from "../controllers/command/command.controller.js";
import { synthesizeSpeech } from "../controllers/command/ttsController.js";

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

/**
 * POST /api/command/tts
 * 
 * Synthesizes text to speech using Google Cloud TTS (Neural2 voice).
 * Body: { text: string }
 * Response: { audioBase64: string }
 */
router.post("/tts", checkJwt, synthesizeSpeech);

export default router;
