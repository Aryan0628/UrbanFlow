import express from "express";
import { getUserById } from "../controllers/user.controller.js";
import { checkJwt } from "../auth/authMiddleware.js";
import { fetchReportsByUserId } from "../controllers/user/getRepots.js"
import { db } from "../firebaseadmin/firebaseadmin.js";

const router = express.Router();

router.get("/reports",checkJwt,fetchReportsByUserId);

// ─── Get authenticated user's profile from Firestore ───
router.get("/profile", checkJwt, async (req, res) => {
  try {
    const userId = req.auth.payload.sub;
    const userRef = db.collection("users").doc(userId);
    const snap = await userRef.get();
    if (!snap.exists) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ profile: snap.data() });
  } catch (err) {
    console.error("GET /profile error:", err);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// ─── Update worker interest ───
router.patch("/worker-interest", checkJwt, async (req, res) => {
  try {
    const userId = req.auth.payload.sub;
    const { interestedToWork, workerCategory } = req.body;
    if (typeof interestedToWork !== "boolean") {
      return res.status(400).json({ message: "interestedToWork must be a boolean" });
    }
    const updateData = {
      interestedToWork,
      hasSeenWorkerPrompt: true,
    };
    if (interestedToWork && workerCategory) {
      updateData.workerCategory = workerCategory;
    }
    const userRef = db.collection("users").doc(userId);
    await userRef.update(updateData);
    return res.json({ success: true });
  } catch (err) {
    console.error("PATCH /worker-interest error:", err);
    return res.status(500).json({ message: "Failed to update worker interest" });
  }
});

// ─── Get all interested workers (sorted) ───
router.get("/workers", checkJwt, async (req, res) => {
  try {
    const snap = await db
      .collection("users")
      .where("interestedToWork", "==", true)
      .get();

    let workers = [];
    snap.forEach((doc) => workers.push({ id: doc.id, ...doc.data() }));

    // Sort: rating desc → completedJobs desc → name asc
    workers.sort((a, b) => {
      const ratingA = a.rating || 3;
      const ratingB = b.rating || 3;
      if (ratingA !== ratingB) return ratingB - ratingA;

      const jobsA = a.completedJobs || 0;
      const jobsB = b.completedJobs || 0;
      if (jobsA !== jobsB) return jobsB - jobsA;

      return (a.name || "").localeCompare(b.name || "");
    });

    return res.json({ workers });
  } catch (err) {
    console.error("GET /workers error:", err);
    return res.status(500).json({ message: "Failed to fetch workers" });
  }
});

router.get("/:id", getUserById);

export default router;