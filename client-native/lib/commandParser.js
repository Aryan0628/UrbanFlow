/**
 * commandParser.js — Rule-based intent extraction (Tier 1 fallback).
 *
 * This is used as a LOCAL fallback when the server/LLM classifier is unavailable.
 * The primary classification happens server-side via Gemini.
 */

const INTENTS = [
  {
    intent: "track_report",
    keywords: [
      "track",
      "report status",
      "where is my report",
      "report update",
      "check report",
      "my complaint status",
      "complaint track",
    ],
    description: "Track the status of a filed report",
  },
  {
    intent: "post_job",
    keywords: [
      "post a job",
      "hire",
      "need help",
      "create job",
      "post job",
      "post gig",
      "need a",
      "find worker",
      "book a",
    ],
    description: "Post a new job on StreetGig",
  },
  {
    intent: "my_jobs",
    keywords: [
      "my jobs",
      "posted jobs",
      "my gigs",
      "jobs i posted",
      "job history",
    ],
    description: "View your posted jobs",
  },
  {
    intent: "show_notifications",
    keywords: [
      "notification",
      "alerts",
      "show notification",
      "my alerts",
      "unread",
    ],
    description: "Show notifications",
  },
  {
    intent: "file_complaint",
    keywords: [
      "file complaint",
      "report issue",
      "civic",
      "grievance",
      "garbage",
      "pothole",
      "water problem",
      "electricity",
    ],
    description: "File a civic complaint (CityHub)",
  },
  {
    intent: "fire_sos",
    keywords: ["fire", "sos", "emergency", "help me", "danger"],
    description: "Trigger fire SOS emergency",
  },
  {
    intent: "navigate_streetgig",
    keywords: ["streetgig", "street gig", "gig marketplace", "jobs market"],
    description: "Open StreetGig",
  },
  {
    intent: "navigate_sisterhood",
    keywords: [
      "sisterhood",
      "sister hood",
      "women safety",
      "safe route",
      "sos map",
    ],
    description: "Open SisterHood safety",
  },
  {
    intent: "navigate_kindshare",
    keywords: ["kindshare", "kind share", "ngo", "donate", "donation"],
    description: "Open KindShare",
  },
  {
    intent: "show_profile",
    keywords: ["my profile", "profile", "account", "my account"],
    description: "Show user profile",
  },
  {
    intent: "learning_schemes",
    keywords: [
      "learning",
      "schemes",
      "courses",
      "skill",
      "upskill",
      "government scheme",
    ],
    description: "Show recommended learning schemes",
  },
  {
    intent: "show_weather",
    keywords: ["weather", "temperature", "climate", "forecast"],
    description: "Show current weather",
  },
];

/**
 * Extracts the best matching intent from raw text.
 * @param {string} text - User's raw input
 * @returns {{ intent: string, confidence: number, description: string, raw: string }}
 */
export function parseCommand(text) {
  if (!text || typeof text !== "string") {
    return { intent: "unknown", confidence: 0, raw: text };
  }

  const lower = text.toLowerCase().trim();

  let bestMatch = null;
  let bestScore = 0;

  for (const { intent, keywords, description } of INTENTS) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        // Longer keyword = more specific = higher confidence
        const score = keyword.length / lower.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { intent, description };
        }
      }
    }
  }

  if (bestMatch) {
    return {
      intent: bestMatch.intent,
      confidence: Math.min(bestScore + 0.3, 1),
      description: bestMatch.description,
      raw: text,
    };
  }

  return { intent: "unknown", confidence: 0, description: null, raw: text };
}

/**
 * Extracts entities from text for known intents.
 * E.g., "Post a plumber job for 500" → { category: "Plumber", amount: "500" }
 */
export function extractEntities(text, intent) {
  const lower = text.toLowerCase();
  const entities = {};

  if (intent === "post_job") {
    // Try to find a category
    const CATEGORIES = [
      "Movers","Carpenter","Plumber","Electrician","Masonry","Cleaners",
      "Painters","Mechanic","Gardening","AC Repair","Tech Support","Tailor",
      "Beauty & Salon","Delivery","Photography","House Sitting",
      "Civil Work","Flooring","Roofing","Welding","Scaffolding",
      "Security","Janitorial Services","Maintenance","BMS Operator",
      "Pest Control","Deep Cleaning","Home Renovation","Appliance Repair","Interior Design",
    ];

    for (const cat of CATEGORIES) {
      if (lower.includes(cat.toLowerCase())) {
        entities.category = cat;
        break;
      }
    }

    // Try to find an amount (₹ or number after "for")
    const amountMatch = lower.match(/(?:₹|rs\.?|for\s+)(\d+)/i);
    if (amountMatch) {
      entities.amount = amountMatch[1];
    }
  }

  if (intent === "track_report") {
    // Try to extract a report ID (alphanumeric, at least 6 chars)
    const idMatch = text.match(/[a-zA-Z0-9]{6,}/);
    if (idMatch && idMatch[0].length >= 8) {
      entities.reportId = idMatch[0];
    }
  }

  return entities;
}
