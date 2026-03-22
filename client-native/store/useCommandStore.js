import { create } from "zustand";
import { api } from "../lib/api";

/**
 * Command Store — manages the assistant conversation state.
 *
 * messages: [{ role: 'user'|'assistant', text, timestamp, data?, options? }]
 * pendingIntent: The intent currently being fulfilled (multi-turn flows)
 * collectedData: Data accumulated during a multi-turn flow (e.g. job posting)
 */
export const useCommandStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────
  isOpen: false,
  messages: [],
  isProcessing: false,
  pendingIntent: null,
  collectedData: {},

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

  // ── Set the pending multi-turn intent ──────────────
  setPendingIntent: (intent) => set({ pendingIntent: intent }),

  // ── Accumulate data for multi-turn flows ───────────
  updateCollectedData: (updates) =>
    set((s) => ({
      collectedData: { ...s.collectedData, ...updates },
    })),

  // ── Processing flag ────────────────────────────────
  setProcessing: (val) => set({ isProcessing: val }),

  // ── Send a user message & get response ─────────────
  sendMessage: async (text) => {
    const { addMessage, setProcessing, pendingIntent, collectedData } = get();

    // 1. Add user message
    addMessage("user", text);
    setProcessing(true);

    try {
      // 2. Call the server command endpoint
      const res = await api.post("/api/command/process", {
        text,
        pendingIntent,
        collectedData,
        conversationHistory: get()
          .messages.slice(-10)
          .map((m) => ({ role: m.role, text: m.text })),
      });

      const result = res.data;

      // 3. Handle the response
      if (result.followUp) {
        // Multi-turn: server is asking for more info
        set({
          pendingIntent: result.intent,
          collectedData: { ...get().collectedData, ...result.collectedData },
        });
        addMessage("assistant", result.followUp, {
          options: result.options || null,
        });
      } else if (result.reply) {
        // Final answer
        set({ pendingIntent: null, collectedData: {} });
        addMessage("assistant", result.reply, {
          data: result.data || null,
          action: result.action || null,
        });
      }

      return result;
    } catch (err) {
      console.error("[CommandStore] Error:", err);
      addMessage(
        "assistant",
        "Sorry, something went wrong. Please try again."
      );
      return null;
    } finally {
      setProcessing(false);
    }
  },

  // ── Reset conversation ─────────────────────────────
  reset: () =>
    set({
      messages: [],
      pendingIntent: null,
      collectedData: {},
      isProcessing: false,
    }),
}));
