import express from 'express';
import { fetchQuestions, fetchQuestionById, createQuestion, postComment, getComments, getReplies, patchVote, uploadImage as uploadImageController } from '../controllers/urbanconnect.controller.js';
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

export default router;
