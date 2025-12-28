const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const socialController = require('../controllers/social');
const authMiddleware = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow images and documents
    if (file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('application/') ||
        file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  }
});

// Apply authentication middleware to all social routes
router.use(authMiddleware);

// Friends routes
router.get('/friends', socialController.getFriends);
router.post('/friends/request', socialController.sendFriendRequest);
router.get('/friends/pending', socialController.getPendingRequests);
router.post('/friends/accept', socialController.acceptFriendRequest);
router.post('/friends/decline', socialController.declineFriendRequest);
router.delete('/friends/remove', socialController.removeFriend);

// Social posts routes
router.get('/posts', socialController.getPosts);
router.post('/posts', upload.single('file'), socialController.createPost);
router.post('/posts/:postId/like', socialController.likePost);
router.post('/posts/:postId/comment', socialController.commentOnPost);
router.post('/posts/:postId/share', socialController.sharePost);
router.get('/posts/:postId/comments', socialController.getPostComments);

// Challenges routes
router.get('/challenges', socialController.getChallenges);
router.post('/challenges', socialController.createChallenge);
router.post('/challenges/:challengeId/join', socialController.joinChallenge);
router.put('/challenges/:challengeId/progress', socialController.updateProgress);
router.post('/challenges/:challengeId/complete', socialController.completeChallenge);

// Activities routes
router.get('/activities', socialController.getActivities);
router.post('/activities', socialController.createActivity);
router.post('/activities/:activityId/join', socialController.joinActivity);
router.put('/activities/:activityId/status', socialController.updateActivityStatus);
router.get('/activities/:activityId/participants', socialController.getActivityParticipants);

// Encouragement routes
router.post('/encouragement', socialController.sendEncouragement);
router.get('/encouragements', socialController.getEncouragements);
router.get('/conversation/:friendEmail', socialController.getConversation);
router.get('/users', socialController.getAllUsers);

// Milestone routes
router.get('/milestones/:userEmail?', socialController.getUserMilestones);
router.post('/milestones', socialController.createMilestone);

// User challenges routes
router.get('/challenges/:userEmail?', socialController.getUserChallenges);

// Activity status routes
router.put('/activities/:activityId/status', socialController.updateActivityStatus);

module.exports = router;
