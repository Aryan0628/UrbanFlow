import { db } from "../../firebaseadmin/firebaseadmin.js";

/**
 * command.actions.js — Server-side action executor.
 *
 * Handles the actual data fetching/mutations for classified intents.
 * Returns structured responses for the client to display.
 */

const JOB_CATEGORIES = [
  "Movers", "Carpenter", "Plumber", "Electrician", "Masonry", "Cleaners",
  "Painters", "Mechanic", "Gardening", "AC Repair", "Tech Support", "Tailor",
  "Beauty & Salon", "Delivery", "Photography", "House Sitting",
  "Civil Work", "Flooring", "Roofing", "Welding", "Scaffolding",
  "Security", "Janitorial Services", "Maintenance", "BMS Operator",
  "Pest Control", "Deep Cleaning", "Home Renovation", "Appliance Repair", "Interior Design",
].sort();

const TIME_SLOTS = [
  "Quick (< 1 hr)", "1-2 Hours", "Half Day (4 hrs)",
  "Full Day (8 hrs)", "Next 24 Hours", "Flexible",
];

export async function executeServerAction(intent, params = {}) {
  const handler = actionHandlers[intent] || actionHandlers.unknown;
  try {
    return await handler(params);
  } catch (err) {
    console.error(`[Command Action] ${intent} failed:`, err);
    return { reply: "Something went wrong while processing your request." };
  }
}

const actionHandlers = {

  track_report: async ({ entities, collectedData, userId }) => {
    const reportId = entities?.reportId || collectedData?.reportId;


    if (!reportId) {
      try {
        const snapshot = await db.collectionGroup("userReports")
          .where("userId", "==", userId)
          .orderBy("createdAt", "desc")
          .limit(5)
          .get();

        if (snapshot.empty) {
          return {
            reply: "You have no reports yet. File a complaint via CivicConnect to get started!",
            action: { type: "navigate", path: "/(main)/(tabs)/CivicConnect" },
          };
        }

        const reports = snapshot.docs.map((doc) => {
          const d = doc.data();
          return { id: d.id, title: d.title || "Untitled Report", status: d.status || "PENDING" };
        });

        const list = reports
          .map((r, i) => `${i + 1}. ${r.title} — ${r.status}`)
          .join("\n");

        return {
          followUp:
            `Your Recent Reports:\n\n${list}\n\n` +
            `Pick a number to track, or type a report ID directly.`,
          options: reports.map((r, i) => `${i + 1}. ${r.title}`),
          intent: "track_report",
          collectedData: { _reportsList: reports },
        };
      } catch (err) {
        console.error("[Track] Fetch reports error:", err);
        return {
          followUp: "Could not load your reports. Please type your report ID directly.",
          intent: "track_report",
          collectedData: {},
        };
      }
    }

    // reportId is available — fetch the full report
    try {
      const snapshot = await db.collectionGroup("userReports")
        .where("id", "==", reportId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return { reply: `Report "${reportId}" not found. Please check the ID.` };
      }

      const report = snapshot.docs[0].data();
      return {
        reply:
          `${report.title || "Report"}\n\n` +
          `• Status: ${report.status}\n` +
          `• Severity: ${report.severity || "N/A"}\n` +
          `${report.address ? `• Location: ${report.address}\n` : ""}` +
          `\nTap "Open" to see the full timeline.`,
        data: { reportId, status: report.status },
        action: { type: "navigate", path: `/(main)/track/${reportId}` },
      };
    } catch (err) {
      console.error("[Track] Error:", err);
      return { reply: "Could not fetch report details. Please try again." };
    }
  },

  // ─── Post Job (Multi-turn) ────────────────────
  post_job: async ({ text, entities, collectedData, userId }) => {
    const data = { ...(collectedData || {}) };

    // Step 1: Category
    if (!data.category) {
      return {
        followUp: "What type of work do you need? Pick a category:",
        options: JOB_CATEGORIES.slice(0, 15),
        intent: "post_job",
        collectedData: data,
      };
    }

    // Step 2: Amount
    if (!data.amount) {
      return {
        followUp: `Got it — **${data.category}**. What's your budget?`,
        options: ["₹200", "₹500", "₹1000", "₹2000"],
        intent: "post_job",
        collectedData: data,
      };
    }

    // Step 3: Time
    if (!data.time) {
      return {
        followUp: `Budget: ₹${data.amount}. How long do you need the worker?`,
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

    // Step 5: Execute — create the job
    try {
      const jobRef = db.collection("jobs").doc();
      const amount = Number(String(data.amount).replace(/[₹,\s]/g, ""));

      await Promise.all([
        jobRef.set({
          description: data.description,
          amount,
          time: data.time,
          category: data.category,
          location: data.location || { lat: 0, lng: 0 },
          employerId: userId,
          status: "OPEN",
          createdAt: new Date(),
        }),
        db.collection("jobChats").doc(jobRef.id).set({
          participants: [userId],
          closed: false,
          createdAt: new Date(),
        }),
      ]);

      return {
        reply:
          `Job posted!\n\n` +
          `• Category: ${data.category}\n` +
          `• Budget: ₹${amount}\n` +
          `• Duration: ${data.time}\n\n` +
          `Workers nearby will be notified. Tap "Open" to manage.`,
        data: { jobId: jobRef.id },
        action: { type: "navigate", path: "/(main)/(tabs)/StreetGig" },
      };
    } catch (err) {
      console.error("[PostJob] Error:", err);
      return { reply: "Failed to post the job. Please try again." };
    }
  },

  // ─── My Jobs ──────────────────────────────────
  my_jobs: async ({ userId }) => {
    try {
      const snap = await db.collection("jobs")
        .where("employerId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      if (snap.empty) {
        return { reply: "You haven't posted any jobs yet. Say **\"post a job\"** to create one!" };
      }

      const jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const list = jobs
        .map((j, i) => `${i + 1}. ${j.category} — ₹${j.amount} (${j.status})`)
        .join("\n");

      return {
        reply: `Your Jobs (showing latest ${jobs.length})\n\n${list}`,
        action: { type: "navigate", path: "/(main)/(tabs)/StreetGig" },
      };
    } catch (err) {
      return { reply: "Could not fetch your jobs." };
    }
  },

  // ─── Notifications (just signal client to open) ─
  show_notifications: async ({ userId }) => {
    try {
      const snap = await db.collection("notifications")
        .where("userId", "==", userId)
        .where("isRead", "==", false)
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      const unread = snap.docs.map((d) => d.data());

      if (unread.length === 0) {
        return { reply: "All caught up! No unread notifications." };
      }

      const list = unread
        .map((n, i) => `${i + 1}. ${n.message}`)
        .join("\n");

      return {
        reply: `${unread.length} unread notifications\n\n${list}`,
        action: { type: "open_notifications" },
      };
    } catch (err) {
      return { reply: "Tap the bell icon on the dashboard to see notifications." };
    }
  },

  // ─── Profile ──────────────────────────────────
  show_profile: async ({ userId }) => {
    try {
      const snap = await db.collection("users").doc(userId).get();
      if (!snap.exists) return { reply: "Profile not found." };

      const p = snap.data();
      return {
        reply:
          `👤 **${p.name || "User"}**\n` +
          `• Email: ${p.email || "N/A"}\n` +
          `• Worker: ${p.interestedToWork ? "Active" : "Inactive"}\n` +
          (p.workerCategories?.length ? `• Skills: ${p.workerCategories.join(", ")}\n` : "") +
          (p.rating ? `• Rating:  ${p.rating}\n` : "") +
          (p.completedJobs ? `• Completed Jobs: ${p.completedJobs}\n` : ""),
      };
    } catch (err) {
      return { reply: " Could not load your profile." };
    }
  },

  // ─── Navigation intents (simple responses) ────
  file_complaint: async () => ({
    reply: "Opening CivicConnect for you. You can file a grievance report there.",
    action: { type: "navigate", path: "/(main)/(tabs)/CivicConnect" },
  }),

  navigate_streetgig: async () => ({
    reply: "Opening StreetGig — your local gig marketplace.",
    action: { type: "navigate", path: "/(main)/(tabs)/StreetGig" },
  }),

  navigate_sisterhood: async () => ({
    reply: "Opening SisterHood — AI-powered safety navigation.",
    action: { type: "navigate", path: "/(main)/(tabs)/SisterHood" },
  }),

  navigate_kindshare: async () => ({
    reply: "Opening KindShare — connect with NGOs.",
    action: { type: "navigate", path: "/kindshare" },
  }),

  learning_schemes: async () => ({
    reply: "Opening your personalized Learning Schemes recommendations.",
    action: { type: "navigate", path: "/(main)/(tabs)/StreetGig" },
  }),

  show_weather: async () => ({
    reply: "Check the weather widget at the top of your dashboard! 🌤️",
  }),

  fire_sos: async () => ({
    reply: "For fire emergencies, please use the SOS button on the dashboard header. It requires GPS confirmation for safety and immediately notifies rescue services.",
    action: { type: "highlight_sos" },
  }),


  unknown: async ({ text }) => ({
    reply:
      `I'm not sure what you mean. Here's what I can help with:\n\n` +
      `• Track my report — Check report status\n` +
      `• Post a job — Create a StreetGig listing\n` +
      `• My jobs — View your posted jobs\n` +
      `• Notifications — Check alerts\n` +
      `• File complaint — Open CivicConnect\n` +
      `• My profile — View your info\n` +
      `• Learning schemes
       — Course recommendations`,
  }),
};
