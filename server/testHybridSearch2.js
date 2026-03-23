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

    const pipeline = [
      {
        $search: {
          index: "hybrid_announcement_index",
          vectorSearch: {
            queryVector: new Array(768).fill(0.1),
            path: "embedding",
            numCandidates: 10,
            limit: 5,
            filter: {
              compound: {
                must: [
                  {
                    text: {
                      query: "test",
                      path: "city"
                    }
                  }
                ]
              }
            }
          }
        }
      },
      { $limit: 1 }
    ];

    try {
      console.log("Testing top-level vectorSearch with compound filter...");
      const res = await Announcement.aggregate(pipeline);
      console.log("Success! Results:", res.length);
    } catch (e) {
      console.error("Pipeline failed:", e.message);
    }

    mongoose.disconnect();
  } catch (err) {
    console.error("Connection error:", err);
  }
}

testSearch();
