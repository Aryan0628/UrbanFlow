import Question from '../models/urbanconnect/questionModel.js';
import User from '../models/urbanconnect/userModel.js';
import Comment from '../models/urbanconnect/commentModel.js';
import { uploadImage as uploadToCloudinary } from '../services/uploadImage.js';
import QuestionVote from '../models/urbanconnect/questionVoteModel.js';

const getTimeAgo = (date) => {
  if (!date) return 'Just now';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m";
  return seconds > 0 ? Math.floor(seconds) + "s" : 'Just now';
};

export const fetchQuestions = async (req, res) => {
  try {
    const after = req.query.after;
    const limit = parseInt(req.query.limit || "20");

    const query = {};
    if (after) {
      query._id = { $lt: after };
    }

    const questions = await Question.find(query)
      .populate('author', 'username avatar email')
      .sort({ _id: -1 })
      .limit(limit)
      .lean();

    const email = req.user?.email || req.query.email;
    let userId = null;
    if (email) {
      const dbUser = await User.findOne({ email });
      if (dbUser) userId = dbUser._id;
    }

    const questionIds = questions.map(q => q._id);
    let voteMap = new Map();
    if (userId) {
      const votes = await QuestionVote.find({ userId, questionId: { $in: questionIds } }).lean();
      voteMap = new Map(votes.map(v => [v.questionId.toString(), v.value]));
    }

    const questionsWithCommentCount = await Promise.all(
      questions.map(async (q) => {
        const commentCount = await Comment.countDocuments({ questionId: q._id });
        return {
          ...q,
          authorName: q.author?.username || q.author?.name || 'UrbanFlow User',
          authorHandle: (q.author?.username || q.author?.name || 'resident').toLowerCase().replace(/\s+/g, ''),
          authorAvatar: q.author?.avatar || q.author?.picture || '',
          timeAgo: getTimeAgo(q.createdAt),
          commentCount,
          userVote: voteMap.get(q._id.toString()) || 0,
        };
      })
    );

    const nextCursor = questions.length > 0 ? questions[questions.length - 1]._id : null;

    res.status(200).json({
      data: questionsWithCommentCount,
      nextCursor,
      hasMore: questions.length === limit,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch questions", error: error.message });
  }
};

export const fetchQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate('author', 'username avatar email');
    if (!question) return res.status(404).json({ error: "Question not found" });

    // Ensure the frontend receives the deeply loaded comments exactly as the mock expects
    const comments = await Comment.find({ questionId: question._id, parentId: null }).sort({ createdAt: -1 }).lean();
    
    // Check vote
    let userVote = 0;
    const email = req.user?.email || req.query.email;
    if (email) {
      const dbUser = await User.findOne({ email });
      if (dbUser) {
        const vote = await QuestionVote.findOne({ userId: dbUser._id, questionId: question._id }).lean();
        if (vote) userVote = vote.value;
      }
    }

    // Convert Mongoose doc to plain object and inject mock variables expected by frontend
    const postData = {
      ...question.toObject(),
      userVote,
      authorName: question.author?.username || question.author?.name || 'UrbanFlow User',
      authorHandle: (question.author?.username || question.author?.name || 'resident').toLowerCase().replace(/\s+/g, ''),
      authorAvatar: question.author?.avatar || question.author?.picture || '',
      timeAgo: getTimeAgo(question.createdAt),
      comments: comments.map(c => ({
        ...c,
        id: c._id.toString(),
        authorName: c.authorName || 'User',
        authorHandle: 'resident',
        text: c.body,
        timeAgo: getTimeAgo(c.createdAt)
      }))
    };

    res.status(200).json(postData);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch question", details: err.message });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const { title, description, image } = req.body;
    
    // Simulate user extraction from auth middleware or body
    const email = req.body.author?.email || "mock@domain.com";

    let dbUser = await User.findOne({ email });
    if (!dbUser) {
        dbUser = await User.create({
            username: req.body.author?.name || "Anonymous",
            email: email,
            auth0Id: req.body.author?.sub || 'mock_auth0_id_' + Date.now()
        });
    }

    const newQuestion = await Question.create({
      author: dbUser._id,
      title: title,
      description: description,
      image: image || [],
    });

    res.status(201).json({ message: "Question uploaded to database", data: newQuestion });
  } catch (error) {
    res.status(500).json({ message: "Failed to create question", error: error.message });
  }
};

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    const imageUrl = await uploadToCloudinary(req.file.buffer);
    res.status(200).json({ url: imageUrl });
  } catch (error) {
    res.status(500).json({ message: "Failed to upload image", error: error.message });
  }
};

export const postComment = async (req, res) => {
  try {
    const { comment, questionId, parentId } = req.body;
    
    // Simulate user extraction from auth middleware or body
    const email = req.body.authorEmail || req.user?.email || "commenter@domain.com";
    
    let dbUser = await User.findOne({ email });
    if (!dbUser) {
        dbUser = await User.create({
           username: req.body.authorName || "Anonymous Replier",
           email: email,
           auth0Id: 'mock_auth0_id_cmt_' + Date.now()
        });
    }

    const newComment = await Comment.create({
      body: comment,
      questionId: questionId || undefined,
      parentId: parentId || null,
      votes: 0,
      author: dbUser._id,
      authorName: dbUser.username,
      authorEmail: dbUser.email,
      replyCount: 0,
    });

    if (parentId) {
      await Comment.findByIdAndUpdate(parentId, { $inc: { replyCount: 1 } });
    }

    res.status(201).json({ message: "Comment Added", newComment });
  } catch (error) {
    res.status(500).json({ message: "Failed to post comment", error: error.message });
  }
};

import Vote from '../models/urbanconnect/voteModel.js';
import Saved from '../models/urbanconnect/savedModel.js';

export const getComments = async (req, res) => {
  try {
    const { questionId, after, limit = 10 } = req.query;
    if (!questionId) return res.status(400).json({ error: "Missing questionId" });

    let query = { questionId, parentId: null };
    if (after) {
      query._id = { $lt: after }; 
    }

    let comments = await Comment.find(query)
      .sort({ votes: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Mock user auth layer logic for mapping saved and userVotes
    const email = req.user?.email || req.query.email;
    if (email) {
       const user = await User.findOne({ email });
       if (user) {
         const commentIds = comments.map(c => c._id);
         const votes = await Vote.find({ userId: user._id, commentId: { $in: commentIds } }).lean();
         const saves = await Saved.find({ userId: user._id, commentId: { $in: commentIds } }).lean();
         
         const voteMap = new Map(votes.map(v => [v.commentId.toString(), v.value]));
         const saveSet = new Set(saves.map(s => s.commentId.toString()));

         comments = comments.map(c => ({
           ...c,
           userVote: voteMap.get(c._id.toString()) || 0,
           saved: saveSet.has(c._id.toString())
         }));
       }
    } else {
       comments = comments.map(c => ({ ...c, userVote: 0, saved: false }));
    }

    const nextCursor = comments.length > 0 ? comments[comments.length - 1]._id : null;
    res.status(200).json({ comments, nextCursor, hasMore: comments.length === parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments", details: err.message });
  }
};

export const getReplies = async (req, res) => {
  try {
    const { parentId, after, limit = 5 } = req.query;
    if (!parentId) return res.status(400).json({ error: "Missing parentId" });

    let query = { parentId };
    if (after) {
      query._id = { $lt: after }; 
    }

    let replies = await Comment.find(query)
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .lean();

    // Mock user auth layer logic for mapping saved and userVotes
    const email = req.user?.email || req.query.email;
    if (email) {
       const user = await User.findOne({ email });
       if (user) {
         const replyIds = replies.map(r => r._id);
         const votes = await Vote.find({ userId: user._id, commentId: { $in: replyIds } }).lean();
         const saves = await Saved.find({ userId: user._id, commentId: { $in: replyIds } }).lean();
         
         const voteMap = new Map(votes.map(v => [v.commentId.toString(), v.value]));
         const saveSet = new Set(saves.map(s => s.commentId.toString()));

         replies = replies.map(r => ({
           ...r,
           userVote: voteMap.get(r._id.toString()) || 0,
           saved: saveSet.has(r._id.toString())
         }));
       }
    } else {
       replies = replies.map(r => ({ ...r, userVote: 0, saved: false }));
    }

    const nextCursor = replies.length > 0 ? replies[replies.length - 1]._id : null;
    res.status(200).json({ replies, nextCursor, hasMore: replies.length === parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch replies", details: err.message });
  }
};

export const patchVote = async (req, res) => {
  try {
    const { commentId, value } = req.body;
    if (!commentId) return res.status(400).json({ error: "Missing commentId" });

    // Simulate Auth
    const email = req.user?.email || req.body.email || "mock@domain.com";
    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({
            username: req.body.authorName || "Anonymous Voter",
            email: email,
            auth0Id: 'mock_auth0_id_vote_' + Date.now()
        });
    }

    let delta = 0;
    const existingVote = await Vote.findOne({ userId: user._id, commentId });

    if (!existingVote && value !== 0) {
      await Vote.create({ userId: user._id, commentId, value });
      delta = value;
    } else if (existingVote && value === 0) {
      await existingVote.deleteOne();
      delta = -existingVote.value;
    } else if (existingVote && existingVote.value !== value) {
      delta = value - existingVote.value;
      existingVote.value = value;
      await existingVote.save();
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { $inc: { votes: delta } },
      { returnDocument: 'after' }
    ).lean();

    res.status(200).json({ message: "Vote Updated", userVote: value, updatedComment });
  } catch (err) {
    res.status(500).json({ error: "Failed to update vote", details: err.message });
  }
};

export const patchQuestionVote = async (req, res) => {
  try {
    const { questionId, value } = req.body;
    if (!questionId) return res.status(400).json({ error: "Missing questionId" });

    // Simulate Auth
    const email = req.user?.email || req.body.email || "mock@domain.com";
    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({
            username: req.body.authorName || "Anonymous Voter",
            email: email,
            auth0Id: 'mock_auth0_id_qvote_' + Date.now()
        });
    }

    let delta = 0;
    const existingVote = await QuestionVote.findOne({ userId: user._id, questionId });

    if (!existingVote && value !== 0) {
      await QuestionVote.create({ userId: user._id, questionId, value });
      delta = value;
    } else if (existingVote && value === 0) {
      await existingVote.deleteOne();
      delta = -existingVote.value;
    } else if (existingVote && existingVote.value !== value) {
      delta = value - existingVote.value;
      existingVote.value = value;
      await existingVote.save();
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      { $inc: { votes: delta } },
      { returnDocument: 'after' }
    ).lean();

    res.status(200).json({ message: "Question Vote Updated", userVote: value, updatedQuestion });
  } catch (err) {
    res.status(500).json({ error: "Failed to update question vote", details: err.message });
  }
};

export const searchQuestions = async (req, res) => {
  try {
    const search = req.body.search || req.query.search;
    
    if (!search || search.trim() === "") {
        return res.status(200).json([]);
    }

    const regex = new RegExp(search, 'i');
    
    let searchResults = await Question.find({
      $or: [
        { title: { $regex: regex } },
        { description: { $regex: regex } },
        { tags: { $regex: regex } }
      ]
    })
    .populate('author', 'username avatar email')
    .sort({ _id: -1 })
    .lean();

    searchResults = searchResults.map(q => ({
        ...q,
        authorName: q.author?.username || q.author?.name || 'UrbanFlow User',
        authorHandle: (q.author?.username || q.author?.name || 'resident').toLowerCase().replace(/\s+/g, ''),
        authorAvatar: q.author?.avatar || q.author?.picture || '',
        timeAgo: getTimeAgo(q.createdAt),
    }));

    res.status(200).json(searchResults);
  } catch (err) {
    res.status(500).json({ error: "Failed to search questions", details: err.message });
  }
};

export const fetchUserProfile = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const dbUser = await User.findOne({ email });
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    // Fetch user's posts
    let userPosts = await Question.find({ author: dbUser._id })
      .populate('author', 'username avatar email')
      .sort({ createdAt: -1 })
      .lean();
    
    // Inject PostCard schema fields
    userPosts = await Promise.all(userPosts.map(async (q) => {
      const commentCount = await Comment.countDocuments({ questionId: q._id });
      const vote = await QuestionVote.findOne({ userId: dbUser._id, questionId: q._id }).lean();
      return {
        ...q,
        authorName: q.author?.username || q.author?.name || 'UrbanFlow User',
        authorHandle: (q.author?.username || q.author?.name || 'resident').toLowerCase().replace(/\s+/g, ''),
        authorAvatar: q.author?.avatar || q.author?.picture || '',
        timeAgo: getTimeAgo(q.createdAt),
        commentCount,
        userVote: vote ? vote.value : 0,
      };
    }));

    // Fetch user's replies
    const userReplies = await Comment.find({ authorEmail: email })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch user's liked posts
    const likes = await QuestionVote.find({ userId: dbUser._id, value: 1 }).lean();
    const likedQuestionIds = likes.map(v => v.questionId);
    
    let likedPosts = await Question.find({ _id: { $in: likedQuestionIds } })
      .populate('author', 'username avatar email')
      .sort({ createdAt: -1 })
      .lean();
      
    likedPosts = await Promise.all(likedPosts.map(async (q) => {
      const commentCount = await Comment.countDocuments({ questionId: q._id });
      return {
        ...q,
        authorName: q.author?.username || q.author?.name || 'UrbanFlow User',
        authorHandle: (q.author?.username || q.author?.name || 'resident').toLowerCase().replace(/\s+/g, ''),
        authorAvatar: q.author?.avatar || q.author?.picture || '',
        timeAgo: getTimeAgo(q.createdAt),
        commentCount,
        userVote: 1, // We know they liked it because it's in their liked list
      };
    }));

    res.status(200).json({
      posts: userPosts,
      replies: userReplies,
      likes: likedPosts
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user profile", details: err.message });
  }
};
