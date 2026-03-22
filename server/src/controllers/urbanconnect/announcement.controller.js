import Announcement from "../../models/urbanconnect/announcementModel.js";

/**
 * cosine similarity helper
 */
function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * GET /api/announcements?city=Delhi&limit=20
 * Fetch latest synthetic announcements (read-only, max 20)
 */
export const getAnnouncements = async (req, res) => {
  try {
    const { city, limit = 20 } = req.query;

    const filter = {};
    if (city) filter.city = city;

    const announcements = await Announcement.find(filter)
      .populate("authority", "postName department city")
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit), 20))
      .lean();

    const formatted = announcements.map((a) => ({
      _id: a._id,
      title: a.title,
      body: a.body,
      city: a.city,
      department: a.department,
      authorityName: a.authority?.postName || "Official",
      authorityDepartment: a.authority?.department || "",
      createdAt: a.createdAt,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("Error fetching announcements:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/announcements/search
 * Vector similarity search for RAG fact-checking (internal, used by agent)
 * Body: { embedding: number[], city: string }
 */
export const searchAnnouncementsForRAG = async (req, res) => {
  try {
    const { embedding, city } = req.body;

    if (!embedding?.length) {
      return res.status(400).json({ error: "embedding is required" });
    }

    const filter = {};
    if (city) filter.city = city;
    // Only fetch announcements that have embeddings
    filter["embedding.0"] = { $exists: true };

    const announcements = await Announcement.find(filter)
      .populate("authority", "postName department")
      .lean();

    // Compute cosine similarity and rank
    const scored = announcements
      .map((a) => ({
        _id: a._id,
        title: a.title,
        body: a.body,
        authorityName: a.authority?.postName || "Official",
        department: a.authority?.department || a.department || "",
        createdAt: a.createdAt,
        similarity: cosineSimilarity(embedding, a.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    res.json({ success: true, results: scored });
  } catch (err) {
    console.error("Announcement RAG search failed:", err);
    res.status(500).json({ error: err.message });
  }
};
