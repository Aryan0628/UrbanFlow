import { VertexAI } from "@google-cloud/vertexai";
import { executeServerAction } from "./command.actions.js";

const vertex_ai = new VertexAI({
  project: "certain-acre-482416-b7",
  location: "us-central1",
});

const SYSTEM_PROMPT = `You are the UrbanFlow AI Assistant — a smart city app helper.

Your job is to classify the user's message into ONE of these intents and extract any entities.

AVAILABLE INTENTS:
1. "track_report" — User wants to check status of a filed report/complaint
   Entities: reportId (string, if mentioned)

2. "post_job" — User wants to post a job/gig on StreetGig
   Entities: category (from list below), amount (number), time (from list below), description (string)
   
3. "my_jobs" — User wants to see their posted jobs

4. "show_notifications" — User wants to see notifications/alerts

5. "file_complaint" — User wants to file a civic complaint (garbage, pothole, water, electricity)

6. "navigate_streetgig" — User wants to open StreetGig marketplace

7. "navigate_sisterhood" — User wants to open SisterHood (women safety)

8. "navigate_kindshare" — User wants to open KindShare (NGO/donations)

9. "search_kindshare" — User wants to see active donation requests, wants to donate, or asks if anyone needs donations
   Entities: category (optional — e.g. "food", "clothes", "medicine", "books")

10. "show_profile" — User wants to see their profile info

11. "learning_schemes" — User wants to see government learning schemes

12. "show_weather" — User wants weather info

13. "fire_sos" — User is reporting a fire emergency

14. "unknown" — Cannot classify the intent

JOB CATEGORIES: Movers, Carpenter, Plumber, Electrician, Masonry, Cleaners, Painters, Mechanic, Gardening, AC Repair, Tech Support, Tailor, Beauty & Salon, Delivery, Photography, House Sitting, Civil Work, Flooring, Roofing, Welding, Scaffolding, Security, Janitorial Services, Maintenance, BMS Operator, Pest Control, Deep Cleaning, Home Renovation, Appliance Repair, Interior Design

TIME SLOTS: Quick (< 1 hr), 1-2 Hours, Half Day (4 hrs), Full Day (8 hrs), Next 24 Hours, Flexible

MULTI-TURN CONTEXT:
If pendingIntent is provided, the user is continuing a multi-turn flow. For "post_job", the fields are collected step by step: category → amount → time → description. Identify which field the user's current message is answering.

RULES:
- Respond ONLY with valid JSON, no markdown, no extra text.
- The intent must be exactly one from the list above.
- Be lenient with language — understand Hindi, Hinglish, casual phrasing.
- For "post_job", extract as many entities as possible from a single message.

RESPONSE FORMAT:
{
  "intent": "string",
  "entities": { ... },
  "confidence": 0.0 to 1.0
}`;

/**
 * Classify the user's intent using Gemini.
 */
async function classifyIntent(text, conversationHistory, pendingIntent, collectedData) {
  const model = vertex_ai.getGenerativeModel({
    model: "gemini-2.5-pro",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0,
    },
  });

  const userMessage = `
User message: "${text}"
${pendingIntent ? `Pending intent: "${pendingIntent}"` : ""}
${collectedData && Object.keys(collectedData).length > 0 ? `Already collected: ${JSON.stringify(collectedData)}` : ""}
${conversationHistory?.length > 0 ? `Recent conversation:\n${conversationHistory.map(m => `${m.role}: ${m.text}`).join('\n')}` : ""}

Classify the intent and extract entities.`;

  try {
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }, { text: userMessage }] },
      ],
    });

    const rawText = result.response.candidates[0].content.parts
      .map((p) => p.text || "")
      .join("");

    return JSON.parse(rawText);
  } catch (err) {
    console.error("[Command] Gemini classification failed:", err.message);
    return { intent: "unknown", entities: {}, confidence: 0 };
  }
}

/**
 * POST /api/command/process
 * 
 * Body: { text, pendingIntent?, collectedData?, conversationHistory? }
 * Response: { intent, reply?, followUp?, options?, data?, action?, collectedData? }
 */
export const processCommand = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;
    const { text, pendingIntent, collectedData, conversationHistory } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ message: "Text is required" });
    }

    // 1. Classify the intent
    const classification = await classifyIntent(
      text.trim(),
      conversationHistory,
      pendingIntent,
      collectedData
    );

    // Use the classified intent (or the pending intent if in a multi-turn flow)
    const intent = pendingIntent && classification.confidence < 0.5
      ? pendingIntent
      : classification.intent;

    // 2. Merge newly extracted entities with already collected data
    const mergedData = { ...(collectedData || {}), ...(classification.entities || {}) };

    // For multi-turn flows: if the user sends a raw text as an answer,
    // figure out which field they're filling
    if (pendingIntent === "post_job" && classification.intent === "post_job") {
      const entities = classification.entities || {};
      // If no specific entity was extracted, the raw text is likely the answer
      if (Object.keys(entities).length === 0) {
        if (!mergedData.category) mergedData.category = text.trim();
        else if (!mergedData.amount) mergedData.amount = text.trim().replace(/[₹,\s]/g, "");
        else if (!mergedData.time) mergedData.time = text.trim();
        else if (!mergedData.description) mergedData.description = text.trim();
      }
    }

    // For track_report: resolve reportId from list selection or raw text
    if (pendingIntent === "track_report" && !mergedData.reportId) {
      const cleaned = text.trim();
      const reportsList = mergedData._reportsList || collectedData?._reportsList;

      if (reportsList && reportsList.length > 0) {
        // Try to match by number (e.g. "1", "2", "3. Title...")
        const numMatch = cleaned.match(/^(\d+)/);
        if (numMatch) {
          const idx = parseInt(numMatch[1], 10) - 1;
          if (idx >= 0 && idx < reportsList.length) {
            mergedData.reportId = reportsList[idx].id;
          }
        }

        // If still no match, try to match by title
        if (!mergedData.reportId) {
          const found = reportsList.find(
            (r) => cleaned.toLowerCase().includes(r.title.toLowerCase())
          );
          if (found) mergedData.reportId = found.id;
        }
      }

      // Fallback: treat raw text as a report ID if long enough
      if (!mergedData.reportId && cleaned.length >= 4) {
        mergedData.reportId = cleaned;
      }

      // Clean up internal list data before passing to handler
      delete mergedData._reportsList;
    }

    // 3. Execute the action
    const result = await executeServerAction(intent, {
      text: text.trim(),
      entities: classification.entities,
      collectedData: mergedData,
      userId,
    });

    return res.json({
      intent,
      confidence: classification.confidence,
      ...result,
    });
  } catch (err) {
    console.error("[Command] Process error:", err);
    return res.status(500).json({
      reply: "Sorry, something went wrong. Please try again.",
    });
  }
};
