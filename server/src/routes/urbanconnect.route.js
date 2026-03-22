import express from 'express';
import { fetchQuestions, fetchQuestionById, createQuestion, postComment, getComments, getReplies, patchVote, patchQuestionVote, searchQuestions, fetchUserProfile, toggleSave, uploadImage as uploadImageController, fetchAuthoritiesByCity } from '../controllers/urbanconnect.controller.js';
import { upload } from '../../middlewares/upload.js';
import { clusterCheck, getClusters } from '../controllers/urbanconnect/cluster.controller.js';
import { civicSyndication } from '../services/civicSyndication.js';
import { fetchAndAnalyzeCityPulse } from '../controllers/urbanconnect/cityPulse.controller.js'; // [NEW]

const router = express.Router();

router.post('/syndicate-civic', (req, res) => {
  res.status(200).json({ queued: true });
  civicSyndication(req.body);
});

router.get('/fetchQuestion', fetchQuestions);
router.get('/fetchQuestion/:id', fetchQuestionById);
router.post('/ask', createQuestion);
router.post('/upload', upload.single('image'), uploadImageController);
router.post('/comment', postComment);
router.get('/comments', getComments);
router.get('/replies', getReplies);
router.patch('/votes', patchVote);
router.patch('/questionVotes', patchQuestionVote);
router.post('/search', searchQuestions);
router.post('/save', toggleSave);
router.get('/profile', fetchUserProfile);
router.get('/authorities/:city', fetchAuthoritiesByCity);
router.post('/cluster-check', clusterCheck);
router.get('/clusters', getClusters);

// [TESTING] Manual trigger for Apify City Pulse
router.get('/test-pulse', async (req, res) => {
  console.log("[DEBUG] /test-pulse route hit!");
  res.status(200).json({ message: "City Pulse scraping triggered in background. Check server logs." });
  try {
    await fetchAndAnalyzeCityPulse();
  } catch (err) {
    console.error("Test Pulse failed:", err);
  }
});

export default router;
