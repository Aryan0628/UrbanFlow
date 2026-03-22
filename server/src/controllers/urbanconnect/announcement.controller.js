import Announcement from "../../models/urbanconnect/announcementModel.js";

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
 * Hybrid Vector + BM25 search for RAG fact-checking
 */
export const searchAnnouncementsForRAG = async (req, res) => {
  try {
    // We now accept 'queryText' alongside the embedding to run the BM25 keyword search
    const { embedding, city, queryText } = req.body;

    if (!embedding?.length) {
      return res.status(400).json({ error: "embedding is required" });
    }

    // Build the MongoDB Atlas Hybrid Search Pipeline
    const baseVectorSearch = {
      index: "hybrid_announcement_index", // This MUST match the name of the index in Atlas
      vectorSearch: {
        // Handle dimension mismatch: slice 1536 dim to 768 dim if required by your index
        queryVector: embedding.length > 768 ? embedding.slice(0, 768) : embedding,
        path: "embedding",
        numCandidates: 100,
        limit: 5
      }
    };

    const filterCompound = {};

    // 2. The Pre-Filter (Hard constraint: Must match the city)
    if (city) {
      filterCompound.must = [
        {
          text: {
            query: city,
            path: "city"
          }
        }
      ];
    }

    // 3. The BM25 Text Search (Exact Keywords)
    // Add the keyword search to the filter pipeline as an optional 'should' match 
    if (queryText) {
      filterCompound.should = [
        {
          text: {
            query: queryText,
            path: ["title", "body", "department"] // Fields to check for keywords
          }
        }
      ];
    }

    if (filterCompound.must || filterCompound.should) {
      baseVectorSearch.vectorSearch.filter = { compound: filterCompound };
    }

    const pipeline = [
      { $search: baseVectorSearch },
      { $limit: 5 }
    ];

    // Lookup the authority details (since we are using aggregation, we can't use standard .populate())
    // NOTE: Change "administrations" to whatever your actual authority collection name is in MongoDB
    pipeline.push({
      $lookup: {
        from: "administrations", 
        localField: "authority",
        foreignField: "_id",
        as: "authorityDoc"
      }
    });

    pipeline.push({
      $unwind: { path: "$authorityDoc", preserveNullAndEmptyArrays: true }
    });

    // Execute the Hybrid Search
    const announcements = await Announcement.aggregate(pipeline);

    // Format the results for the LangGraph Agent
    const scored = announcements.map((a) => ({
      _id: a._id,
      title: a.title,
      body: a.body,
      authorityName: a.authorityDoc?.postName || "Official",
      department: a.authorityDoc?.department || a.department || "",
      createdAt: a.createdAt,
      // MongoDB automatically assigns an RRF search score when combining Vector + Text
      similarityScore: a.score 
    }));

    res.json({ success: true, results: scored });
  } catch (err) {
    console.error("Announcement RAG search failed:", err);
    res.status(500).json({ error: err.message });
  }
};