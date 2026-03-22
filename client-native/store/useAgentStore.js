import { create } from "zustand";
import { api } from "../lib/api";

/**
 * Agent Store v2 — manages the LangGraph assistant conversation state.
 *
 * messages: [{ role: 'user'|'assistant', text, timestamp, action? }]
 */
export const useAgentStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────
  isOpen: false,
  messages: [],
  isProcessing: false,
  sessionId: null,

  // ── UI Controls ────────────────────────────────────
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  // ── Add a message to the conversation ──────────────
  addMessage: (role, text, extra = {}) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { role, text, timestamp: Date.now(), ...extra },
      ],
    })),

  // ── Processing flag ────────────────────────────────
  setProcessing: (val) => set({ isProcessing: val }),

  // ── Send a user message & get response ─────────────
  sendMessage: async (text) => {
    const { addMessage, setProcessing, sessionId } = get();

    // 1. Add user message
    addMessage("user", text);
    setProcessing(true);

    try {
      // 2. Call the LangGraph agent endpoint
      const res = await api.post("/api/agent/chat", {
        text,
        sessionId,
        messages: get()
          .messages.slice(-20)
          .map((m) => ({ role: m.role, text: m.text })),
      });

      const result = res.data;

      // 3. Store session ID if returned
      if (result.sessionId) {
        set({ sessionId: result.sessionId });
      }

      // 4. Add assistant reply
      if (result.reply) {
        addMessage("assistant", result.reply, {
          action: result.action || null,
        });
      }

      return result;
    } catch (err) {
      console.error("[AgentStore] Error:", err);
      addMessage(
        "assistant",
        "Sorry, something went wrong. Please try again."
      );
      return null;
    } finally {
      setProcessing(false);
    }
  },

  // ── Send proactive check on session start ──────────
  checkUpdates: async () => {
    const { sendMessage } = get();
    return sendMessage("__session_start__");
  },

  // ── Reset conversation ─────────────────────────────
  reset: () =>
    set({
      messages: [],
      isProcessing: false,
      sessionId: null,
    }),
}));
