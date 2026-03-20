import { router } from "expo-router";
import { api } from "./api";
import { useNotificationStore } from "../store/useNotificationStore";

/**
 * commandExecutor.js — Maps classified intents to real actions.
 *
 * Each handler returns { reply, data?, action? } to display in the chat.
 * For multi-turn flows, handlers return { followUp, options? } instead.
 */

// ── Job posting flow steps ──────────────────────────
const JOB_CATEGORIES = [
  "Movers","Carpenter","Plumber","Electrician","Masonry","Cleaners",
  "Painters","Mechanic","Gardening","AC Repair","Tech Support","Tailor",
  "Beauty & Salon","Delivery","Photography","House Sitting",
  "Civil Work","Flooring","Roofing","Welding","Scaffolding",
  "Security","Janitorial Services","Maintenance","BMS Operator",
  "Pest Control","Deep Cleaning","Home Renovation","Appliance Repair","Interior Design",
].sort();

const TIME_SLOTS = [
  "Quick (< 1 hr)",
  "1-2 Hours",
  "Half Day (4 hrs)",
  "Full Day (8 hrs)",
  "Next 24 Hours",
  "Flexible",
];

// ── Intent Handlers ────────────────────────────────

const handlers = {
  // ─── Track Report ───────────────────────────────
  track_report: async ({ entities, collectedData }) => {
    const reportId = entities?.reportId || collectedData?.reportId;

    if (!reportId) {
      return {
        followUp: "Sure! What's your report ID? You can find it in your reports list.",
        intent: "track_report",
      };
    }

    try {
      const res = await api.get(`/api/track/${reportId}`);
      const report = res.data.report || res.data;

      return {
        reply: `📋 **${report.title || "Report"}**\n\n` +
          `• Status: **${report.status}**\n` +
          `• Severity: ${report.severity || "N/A"}\n` +
          `${report.address ? `• Location: ${report.address}\n` : ""}` +
          `\nWould you like to see the full details?`,
        data: { reportId, status: report.status },
        action: { type: "navigate", path: `/(main)/track/${reportId}` },
      };
    } catch (err) {
      return {
        reply: "❌ Could not find that report. Please double-check the ID and try again.",
      };
    }
  },

  // ─── Post Job (Multi-turn) ─────────────────────
  post_job: async ({ text, entities, collectedData, step }) => {
    const data = { ...collectedData };

    // Step 1: Category
    if (!data.category) {
      if (entities?.category) {
        data.category = entities.category;
      } else {
        return {
          followUp: "What type of work do you need? Pick a category:",
          options: JOB_CATEGORIES.slice(0, 12), // Show first 12 for readability
          intent: "post_job",
          collectedData: data,
        };
      }
    }

    // If user just provided the category this turn
    if (!collectedData?.category && !data.amount) {
      // The user's text IS the category selection
      const matchedCat = JOB_CATEGORIES.find(
        (c) => c.toLowerCase() === text.toLowerCase().trim()
      );
      if (matchedCat) data.category = matchedCat;
      else if (!entities?.category) data.category = text.trim();
    }

    // Step 2: Amount
    if (!data.amount) {
      return {
        followUp: `Got it — **${data.category}**. What's your budget? (e.g. 500, 1000)`,
        options: ["₹200", "₹500", "₹1000", "₹2000"],
        intent: "post_job",
        collectedData: data,
      };
    }

    // Step 3: Time
    if (!data.time) {
      return {
        followUp: `Budget: ₹${data.amount}. How long do you need the worker for?`,
        options: TIME_SLOTS,
        intent: "post_job",
        collectedData: data,
      };
    }

    // Step 4: Description
    if (!data.description) {
      return {
        followUp: "Almost done! Briefly describe what needs to be done:",
        intent: "post_job",
        collectedData: data,
      };
    }

    // Step 5: Submit the job
    try {
      const res = await api.post("/api/jobs", {
        description: data.description,
        amount: Number(data.amount.toString().replace(/[₹,]/g, "")),
        time: data.time,
        category: data.category,
        location: data.location || { lat: 0, lng: 0 }, // Will be filled by caller
      });

      return {
        reply:
          `✅ **Job posted successfully!**\n\n` +
          `• Category: ${data.category}\n` +
          `• Budget: ₹${data.amount}\n` +
          `• Duration: ${data.time}\n\n` +
          `Workers nearby will be notified. Check "My Jobs" for updates.`,
        data: { jobId: res.data?.job?.id },
        action: { type: "navigate", path: "/(main)/(tabs)/StreetGig" },
      };
    } catch (err) {
      return {
        reply: "❌ Failed to post the job. Please try again or use the StreetGig screen directly.",
      };
    }
  },

  // ─── My Jobs ───────────────────────────────────
  my_jobs: async () => {
    try {
      const res = await api.get("/api/jobs/my");
      const jobs = res.data.jobs || [];

      if (jobs.length === 0) {
        return { reply: "You haven't posted any jobs yet. Say **\"post a job\"** to create one!" };
      }

      const list = jobs
        .slice(0, 5)
        .map((j, i) => `${i + 1}. **${j.category}** — ₹${j.amount} (${j.status})`)
        .join("\n");

      return {
        reply: `📋 **Your Jobs** (${jobs.length} total)\n\n${list}\n\nOpen StreetGig to manage them.`,
        action: { type: "navigate", path: "/(main)/(tabs)/StreetGig" },
      };
    } catch (err) {
      return { reply: "❌ Could not fetch your jobs. Please try again." };
    }
  },

  // ─── Show Notifications ────────────────────────
  show_notifications: async () => {
    const notifications = useNotificationStore.getState().notifications;
    const unread = notifications.filter((n) => !n.isRead);

    if (notifications.length === 0) {
      return { reply: "🔔 No notifications yet." };
    }

    const list = unread
      .slice(0, 5)
      .map((n, i) => `${i + 1}. ${n.message}`)
      .join("\n");

    return {
      reply:
        `🔔 **${unread.length} unread** out of ${notifications.length} total\n\n` +
        (list || "All caught up! ✨"),
      action: { type: "open_notifications" },
    };
  },

  // ─── Navigation intents ────────────────────────
  file_complaint: async () => ({
    reply: "Opening **CivicConnect** for you. You can file a grievance report there.",
    action: { type: "navigate", path: "/(main)/(tabs)/CivicConnect" },
  }),

  navigate_streetgig: async () => ({
    reply: "Opening **StreetGig** — your local gig marketplace.",
    action: { type: "navigate", path: "/(main)/(tabs)/StreetGig" },
  }),

  navigate_sisterhood: async () => ({
    reply: "Opening **SisterHood** — stay safe with AI-driven safe routes.",
    action: { type: "navigate", path: "/(main)/(tabs)/SisterHood" },
  }),

  navigate_kindshare: async () => ({
    reply: "Opening **KindShare** — connect with NGOs and donate.",
    action: { type: "navigate", path: "/kindshare" },
  }),

  // ─── Profile ───────────────────────────────────
  show_profile: async () => {
    try {
      const res = await api.get("/api/user/profile");
      const p = res.data.profile;
      return {
        reply:
          `👤 **${p.name || "User"}**\n` +
          `• Email: ${p.email || "N/A"}\n` +
          `• Worker: ${p.interestedToWork ? "✅ Active" : "❌ Inactive"}\n` +
          (p.workerCategories?.length
            ? `• Skills: ${p.workerCategories.join(", ")}\n`
            : "") +
          (p.rating ? `• Rating: ⭐ ${p.rating}\n` : ""),
      };
    } catch (err) {
      return { reply: "❌ Could not load your profile." };
    }
  },

  // ─── Learning Schemes ──────────────────────────
  learning_schemes: async () => {
    try {
      const res = await api.get("/api/user/learning-schemes");
      const { upgradationCourses, improvementCourses } = res.data;

      const up = (upgradationCourses || [])
        .slice(0, 3)
        .map((s, i) => `${i + 1}. ${s.name || s.title || "Scheme"}`)
        .join("\n");
      const imp = (improvementCourses || [])
        .slice(0, 3)
        .map((s, i) => `${i + 1}. ${s.name || s.title || "Scheme"}`)
        .join("\n");

      return {
        reply:
          `📚 **Recommended Schemes**\n\n` +
          `**Upgradation:**\n${up || "None found"}\n\n` +
          `**Improvement:**\n${imp || "None found"}`,
      };
    } catch (err) {
      return { reply: "❌ Could not fetch learning schemes." };
    }
  },

  // ─── Weather ───────────────────────────────────
  show_weather: async () => ({
    reply: "Check the weather widget on the top of your dashboard! 🌤️",
  }),

  // ─── Fire SOS ──────────────────────────────────
  fire_sos: async () => ({
    reply:
      "🚨 **Emergency SOS** — Please use the SOS button on the dashboard header for immediate emergency alerts. It requires GPS confirmation for safety.",
    action: { type: "highlight_sos" },
  }),

  // ─── Unknown ───────────────────────────────────
  unknown: async ({ text }) => ({
    reply:
      `I'm not sure what you mean by "${text}". Here's what I can help with:\n\n` +
      `• **Track my report** — Check report status\n` +
      `• **Post a job** — Create a StreetGig listing\n` +
      `• **My jobs** — View your posted jobs\n` +
      `• **Notifications** — Check alerts\n` +
      `• **File complaint** — Open CivicConnect\n` +
      `• **My profile** — View your profile\n` +
      `• **Learning schemes** — Get course recommendations`,
  }),
};

/**
 * Execute a classified intent.
 * @param {string} intent
 * @param {object} params - { text, entities, collectedData, userLocation }
 * @returns {Promise<object>} - { reply, data?, action?, followUp?, options? }
 */
export async function executeCommand(intent, params = {}) {
  const handler = handlers[intent] || handlers.unknown;
  return handler(params);
}

/**
 * Perform a navigation action returned by the executor.
 * Called from the UI layer after receiving an action.
 */
export function performAction(action) {
  if (!action) return;

  switch (action.type) {
    case "navigate":
      if (action.path) router.push(action.path);
      break;
    case "open_notifications":
      // Handled by the CommandBar UI
      break;
    case "highlight_sos":
      // Handled by the CommandBar UI
      break;
    default:
      break;
  }
}
