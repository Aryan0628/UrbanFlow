import express from 'express';
import { fetchQuestions, fetchQuestionById, createQuestion, postComment, getComments, getReplies, patchVote, patchQuestionVote, searchQuestions, fetchUserProfile, toggleSave, uploadImage as uploadImageController, fetchAuthoritiesByCity } from '../controllers/urbanconnect.controller.js';
import { upload } from '../../middlewares/upload.js';
import { clusterCheck, getClusters } from '../controllers/urbanconnect/cluster.controller.js';

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
router.post('/save', toggleSave);
router.get('/profile', fetchUserProfile);
router.get('/authorities/:city', fetchAuthoritiesByCity);
router.post('/cluster-check', clusterCheck);
router.get('/clusters', getClusters);

export default router;
