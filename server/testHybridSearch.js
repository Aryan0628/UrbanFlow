import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const announcementSchema = new mongoose.Schema({
  title: String,
  body: String,
  city: String,
  embedding: [Number]
});

const Announcement = mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);

async function testSearch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Let's test the vectorSearch operator inside compound.should
    const pipeline1 = [
      {
        $search: {
          index: "hybrid_announcement_index",
          compound: {
            should: [
              {
                vectorSearch: {
                  queryVector: new Array(1536).fill(0.1),
                  path: "embedding",
                  numCandidates: 10,
                  limit: 5
                }
              }
            ]
          }
        }
      },
      { $limit: 1 }
    ];

    try {
      console.log("Testing vectorSearch in compound.should...");
      const res1 = await Announcement.aggregate(pipeline1);
      console.log("Success! Results:", res1.length);
    } catch (e) {
      console.error("Pipeline 1 failed:", e.message);
    }
    
    // Test top-level vectorSearch
    const pipeline2 = [
      {
        $search: {
          index: "hybrid_announcement_index",
          vectorSearch: {
            queryVector: new Array(1536).fill(0.1),
            path: "embedding",
            numCandidates: 10,
            limit: 5
          }
        }
      },
      { $limit: 1 }
    ];

    try {
      console.log("Testing top-level vectorSearch...");
      const res2 = await Announcement.aggregate(pipeline2);
      console.log("Success! Results:", res2.length);
    } catch (e) {
      console.error("Pipeline 2 failed:", e.message);
    }

    mongoose.disconnect();
  } catch (err) {
    console.error("Connection error:", err);
  }
}

testSearch();
