import express from 'express';
import { fetchQuestions, fetchQuestionById, createQuestion, postComment, getComments, getReplies, patchVote, patchQuestionVote, searchQuestions, fetchUserProfile, uploadImage as uploadImageController, fetchAuthoritiesByCity } from '../controllers/urbanconnect.controller.js';
import { upload } from '../../middlewares/upload.js';

const router = express.Router();

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
router.get('/profile', fetchUserProfile);
router.get('/authorities/:city', fetchAuthoritiesByCity);

export default router;
