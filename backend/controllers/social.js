const db = require('../db');

// Get all friends for current user
exports.getFriends = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const query = `
      SELECT u.email as friend_email, u.last_name, u.weight, u.height, u.age, u.gender, u.country, u.created_at as joined_date,
             f.created_at as friends_since
      FROM friendships f
      JOIN users u ON (f.requester_email = u.email OR f.addressee_email = u.email)
      WHERE f.status = 'accepted' AND 
            (f.requester_email = $1 OR f.addressee_email = $1) AND
            u.email != $1
    `;
    
    const result = await db.query(query, [userEmail]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ msg: 'Failed to fetch friends' });
  }
};

// Send friend request
exports.sendFriendRequest = async (req, res) => {
  try {
    const { lastName } = req.body;
    const requesterEmail = req.user.email;
    
    // Check if user exists by last name
    const userCheck = await db.query('SELECT email FROM users WHERE last_name ILIKE $1', [lastName]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ msg: 'User not found with that last name' });
    }
    
    // If multiple users found, use the first one (could enhance to show options)
    const targetEmail = userCheck.rows[0].email;
    
    if (targetEmail === requesterEmail) {
      return res.status(400).json({ msg: 'Cannot send friend request to yourself' });
    }
    
    // Check if friendship already exists
    const existingFriendship = await db.query(
      'SELECT * FROM friendships WHERE (requester_email = $1 AND addressee_email = $2) OR (requester_email = $2 AND addressee_email = $1)',
      [requesterEmail, targetEmail]
    );
    
    if (existingFriendship.rows.length > 0) {
      return res.status(400).json({ msg: 'Friendship already exists or pending' });
    }
    
    // Create friend request
    await db.query(
      'INSERT INTO friendships (requester_email, addressee_email, status) VALUES ($1, $2, $3)',
      [requesterEmail, targetEmail, 'pending']
    );
    
    res.json({ msg: 'Friend request sent' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ msg: 'Failed to send friend request' });
  }
};

// Get pending friend requests
exports.getPendingRequests = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const query = `
      SELECT u.email as requester_email, u.last_name, u.weight, u.height, u.age, u.gender, u.country, 
             f.created_at
      FROM friendships f
      JOIN users u ON f.requester_email = u.email
      WHERE f.status = 'pending' AND f.addressee_email = $1
    `;
    
    const result = await db.query(query, [userEmail]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ msg: 'Failed to fetch pending requests' });
  }
};

// Accept friend request
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { email } = req.body;
    const userEmail = req.user.email;
    
    await db.query(
      'UPDATE friendships SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE requester_email = $2 AND addressee_email = $3',
      ['accepted', email, userEmail]
    );
    
    res.json({ msg: 'Friend request accepted' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ msg: 'Failed to accept friend request' });
  }
};

// Decline friend request
exports.declineFriendRequest = async (req, res) => {
  try {
    const { email } = req.body;
    const userEmail = req.user.email;
    
    await db.query(
      'UPDATE friendships SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE requester_email = $2 AND addressee_email = $3',
      ['declined', email, userEmail]
    );
    
    res.json({ msg: 'Friend request declined' });
  } catch (error) {
    console.error('Error declining friend request:', error);
    res.status(500).json({ msg: 'Failed to decline friend request' });
  }
};

// Remove friend
exports.removeFriend = async (req, res) => {
  try {
    const { email } = req.body;
    const userEmail = req.user.email;
    
    await db.query(
      'DELETE FROM friendships WHERE (requester_email = $1 AND addressee_email = $2) OR (requester_email = $2 AND addressee_email = $1)',
      [userEmail, email]
    );
    
    res.json({ msg: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ msg: 'Failed to remove friend' });
  }
};

// Get social posts
exports.getPosts = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const query = `
      SELECT sp.*, u.last_name as author_name
      FROM social_posts sp
      JOIN users u ON sp.author_email = u.email
      WHERE sp.is_public = true OR sp.author_email = $1
      ORDER BY sp.created_at DESC
      LIMIT 50
    `;
    
    const result = await db.query(query, [userEmail]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ msg: 'Failed to fetch posts' });
  }
};

// Create social post
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const userEmail = req.user.email;
    const file = req.file; // For file uploads
    
    console.log('Creating post for user:', userEmail);
    console.log('Post content:', content);
    console.log('File uploaded:', file?.originalname);
    
    // First check if user exists
    const userCheck = await db.query('SELECT email FROM users WHERE email = $1', [userEmail]);
    if (userCheck.rows.length === 0) {
      console.log('User does not exist in database:', userEmail);
      return res.status(400).json({ msg: 'User not found in database' });
    }
    
    // Prepare metadata
    let metadata = null;
    if (file) {
      metadata = {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}` // Use relative path for proxy
      };
    }
    
    const result = await db.query(
      'INSERT INTO social_posts (author_email, content, post_type, is_public, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userEmail, content, 'update', true, JSON.stringify(metadata)]
    );
    
    // Get the post with author name
    const postWithAuthor = await db.query(
      'SELECT sp.*, u.last_name as author_name FROM social_posts sp JOIN users u ON sp.author_email = u.email WHERE sp.id = $1',
      [result.rows[0].id]
    );
    
    console.log('Post created successfully:', postWithAuthor.rows[0]);
    res.json(postWithAuthor.rows[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    res.status(500).json({ msg: 'Failed to create post', error: error.message });
  }
};

// Like post
exports.likePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userEmail = req.user.email;
    
    // Check if already liked
    const existingLike = await db.query(
      'SELECT * FROM post_likes WHERE post_id = $1 AND user_email = $2',
      [postId, userEmail]
    );
    
    if (existingLike.rows.length === 0) {
      // Add like
      await db.query(
        'INSERT INTO post_likes (post_id, user_email) VALUES ($1, $2)',
        [postId, userEmail]
      );
      
      // Update likes count
      await db.query(
        'UPDATE social_posts SET likes_count = likes_count + 1 WHERE id = $1',
        [postId]
      );
    } else {
      // Remove like
      await db.query(
        'DELETE FROM post_likes WHERE post_id = $1 AND user_email = $2',
        [postId, userEmail]
      );
      
      // Update likes count
      await db.query(
        'UPDATE social_posts SET likes_count = likes_count - 1 WHERE id = $1',
        [postId]
      );
    }
    
    res.json({ msg: 'Post like toggled' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ msg: 'Failed to like post' });
  }
};

// Comment on post
exports.commentOnPost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { comment } = req.body;
    const userEmail = req.user.email;
    
    if (!comment || comment.trim() === '') {
      return res.status(400).json({ msg: 'Comment cannot be empty' });
    }
    
    // Add comment
    await db.query(
      'INSERT INTO post_comments (post_id, author_email, content) VALUES ($1, $2, $3)',
      [postId, userEmail, comment.trim()]
    );
    
    // Update comments count
    await db.query(
      'UPDATE social_posts SET comments_count = comments_count + 1 WHERE id = $1',
      [postId]
    );
    
    res.json({ msg: 'Comment added' });
  } catch (error) {
    console.error('Error commenting on post:', error);
    res.status(500).json({ msg: 'Failed to comment on post' });
  }
};

// Share post
exports.sharePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userEmail = req.user.email;
    
    // Get original post
    const originalPost = await db.query(
      'SELECT * FROM social_posts WHERE id = $1',
      [postId]
    );
    
    if (originalPost.rows.length === 0) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    
    // Create a new post as a share
    const result = await db.query(
      'INSERT INTO social_posts (author_email, content, post_type, is_public) VALUES ($1, $2, $3, $4) RETURNING *',
      [userEmail, `Shared: ${originalPost.rows[0].content}`, 'update', true]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error sharing post:', error);
    res.status(500).json({ msg: 'Failed to share post' });
  }
};

// Get comments for a post
exports.getPostComments = async (req, res) => {
  try {
    const postId = req.params.postId;
    
    const query = `
      SELECT pc.*, u.last_name as author_name
      FROM post_comments pc
      JOIN users u ON pc.author_email = u.email
      WHERE pc.post_id = $1
      ORDER BY pc.created_at ASC
    `;
    
    const result = await db.query(query, [postId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching post comments:', error);
    res.status(500).json({ msg: 'Failed to fetch comments' });
  }
};

// Get encouragements for current user
exports.getEncouragements = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const query = `
      SELECT e.*, u.last_name as sender_name
      FROM encouragements e
      JOIN users u ON e.sender_email = u.email
      WHERE e.recipient_email = $1
      ORDER BY e.created_at DESC
      LIMIT 50
    `;
    
    const result = await db.query(query, [userEmail]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching encouragements:', error);
    res.status(500).json({ msg: 'Failed to fetch encouragements' });
  }
};

// Get conversation between two users
exports.getConversation = async (req, res) => {
  try {
    const { friendEmail } = req.params;
    const userEmail = req.user.email;
    
    const query = `
      SELECT e.*, 
             u_sender.last_name as sender_name,
             CASE 
               WHEN e.sender_email = $1 THEN 'sent'
               ELSE 'received'
             END as message_type
      FROM encouragements e
      JOIN users u_sender ON e.sender_email = u_sender.email
      WHERE (e.sender_email = $1 AND e.recipient_email = $2) 
         OR (e.sender_email = $2 AND e.recipient_email = $1)
      ORDER BY e.created_at ASC
      LIMIT 100
    `;
    
    const result = await db.query(query, [userEmail, friendEmail]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ msg: 'Failed to fetch conversation' });
  }
};

// Get all users for messaging
exports.getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT email, last_name 
      FROM users 
      WHERE email != $1
      ORDER BY last_name ASC
    `;
    
    const result = await db.query(query, [req.user.email]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ msg: 'Failed to fetch users' });
  }
};

// Get challenges
exports.getChallenges = async (req, res) => {
  try {
    const query = `
      SELECT c.*, 
             COALESCE(pc_all.participant_count, 0) as participant_count,
             cp.current_progress,
             cp.is_completed,
             cp.completed_at,
             cp.joined_at,
             CASE WHEN cp.participant_email IS NOT NULL THEN true ELSE false END as is_joined
      FROM challenges c
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id AND cp.participant_email = $1
      LEFT JOIN (
        SELECT challenge_id, COUNT(id) as participant_count
        FROM challenge_participants
        GROUP BY challenge_id
      ) pc_all ON c.id = pc_all.challenge_id
      WHERE c.is_active = true AND c.end_date > CURRENT_TIMESTAMP
      ORDER BY c.created_at DESC
    `;
    
    const result = await db.query(query, [req.user.email]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ msg: 'Failed to fetch challenges' });
  }
};

// Create challenge
exports.createChallenge = async (req, res) => {
  try {
    const {
      title,
      description,
      challenge_type,
      duration_days,
      target_value,
      reward_points,
      max_participants
    } = req.body;
    
    const userEmail = req.user.email;
    
    // Validate required fields
    if (!title || !challenge_type || !duration_days || !reward_points || !max_participants) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }
    
    // Calculate start and end dates
    const start_date = new Date();
    const end_date = new Date(start_date.getTime() + (duration_days * 24 * 60 * 60 * 1000));
    
    const result = await db.query(
      `INSERT INTO challenges 
       (title, description, challenge_type, duration_days, target_value, reward_points, created_by, max_participants, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [title, description, challenge_type, duration_days, target_value, reward_points, userEmail, max_participants, start_date, end_date]
    );
    
    // Automatically join the creator to the challenge
    await db.query(
      'INSERT INTO challenge_participants (challenge_id, participant_email) VALUES ($1, $2)',
      [result.rows[0].id, userEmail]
    );
    
    console.log('Challenge created successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ msg: 'Failed to create challenge' });
  }
};

// Join challenge
exports.joinChallenge = async (req, res) => {
  try {
    const challengeId = req.params.challengeId;
    const userEmail = req.user.email;
    
    // Check if already joined
    const existing = await db.query(
      'SELECT * FROM challenge_participants WHERE challenge_id = $1 AND participant_email = $2',
      [challengeId, userEmail]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ msg: 'Already joined this challenge' });
    }
    
    await db.query(
      'INSERT INTO challenge_participants (challenge_id, participant_email) VALUES ($1, $2)',
      [challengeId, userEmail]
    );
    
    res.json({ msg: 'Challenge joined' });
  } catch (error) {
    console.error('Error joining challenge:', error);
    res.status(500).json({ msg: 'Failed to join challenge' });
  }
};

// Update challenge progress
exports.updateProgress = async (req, res) => {
  try {
    const challengeId = req.params.challengeId;
    const { progress } = req.body;
    const userEmail = req.user.email;
    
    console.log('Update Progress - Received:', { challengeId, progress, userEmail });
    
    // Validate progress
    if (typeof progress !== 'number' || progress < 0) {
      return res.status(400).json({ msg: 'Progress must be a non-negative number' });
    }
    
    // Check if user is a participant
    const participantCheck = await db.query(
      'SELECT * FROM challenge_participants WHERE challenge_id = $1 AND participant_email = $2',
      [challengeId, userEmail]
    );
    
    console.log('Update Progress - Participant check:', participantCheck.rows);
    
    if (participantCheck.rows.length === 0) {
      return res.status(400).json({ msg: 'Not a participant in this challenge' });
    }
    
    // Update progress
    const updateResult = await db.query(
      'UPDATE challenge_participants SET current_progress = $1 WHERE challenge_id = $2 AND participant_email = $3',
      [progress, challengeId, userEmail]
    );
    
    console.log('Update Progress - Update result:', updateResult);
    
    // Verify the update
    const verifyResult = await db.query(
      'SELECT current_progress FROM challenge_participants WHERE challenge_id = $1 AND participant_email = $2',
      [challengeId, userEmail]
    );
    
    console.log('Update Progress - Verify result:', verifyResult.rows);
    
    res.json({ msg: 'Progress updated successfully', current_progress: progress });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ msg: 'Failed to update progress' });
  }
};

// Complete challenge and award points
exports.completeChallenge = async (req, res) => {
  try {
    const challengeId = req.params.challengeId;
    const userEmail = req.user.email;
    
    // Check if user is a participant and not already completed
    const participantCheck = await db.query(
      'SELECT * FROM challenge_participants WHERE challenge_id = $1 AND participant_email = $2',
      [challengeId, userEmail]
    );
    
    if (participantCheck.rows.length === 0) {
      return res.status(400).json({ msg: 'Not a participant in this challenge' });
    }
    
    if (participantCheck.rows[0].is_completed) {
      return res.status(400).json({ msg: 'Challenge already completed' });
    }
    
    // Get challenge details to award points
    const challengeResult = await db.query(
      'SELECT reward_points FROM challenges WHERE id = $1',
      [challengeId]
    );
    
    if (challengeResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Challenge not found' });
    }
    
    const rewardPoints = challengeResult.rows[0].reward_points;
    
    // Mark challenge as completed
    await db.query(
      `UPDATE challenge_participants 
       SET is_completed = true, completed_at = CURRENT_TIMESTAMP 
       WHERE challenge_id = $1 AND participant_email = $2`,
      [challengeId, userEmail]
    );
    
    // Award points to user if reward points > 0
    if (rewardPoints > 0) {
      // Update user's total points
      await db.query(
        `INSERT INTO user_achievement_stats (user_email, total_points)
         VALUES ($1, $2)
         ON CONFLICT (user_email) 
         DO UPDATE SET 
           total_points = user_achievement_stats.total_points + $2,
           updated_at = CURRENT_TIMESTAMP`,
        [userEmail, rewardPoints]
      );
      
      // Record the achievement
      await db.query(
        `INSERT INTO user_achievements (user_email, achievement_id, points_earned)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_email, achievement_id) DO NOTHING`,
        [userEmail, `challenge_${challengeId}`, rewardPoints]
      );
    }
    
    // Create a social post about challenge completion
    await db.query(
      `INSERT INTO social_posts (author_email, content, post_type, metadata)
       VALUES ($1, $2, 'challenge_complete', $3)`,
      [userEmail, `Completed a challenge and earned ${rewardPoints} points!`, 
       JSON.stringify({ challenge_id: challengeId, points_earned: rewardPoints })]
    );
    
    res.json({ 
      msg: 'Challenge completed successfully!', 
      points_awarded: rewardPoints 
    });
  } catch (error) {
    console.error('Error completing challenge:', error);
    res.status(500).json({ msg: 'Failed to complete challenge' });
  }
};

// Get activities (live activities and milestone celebrations)
exports.getActivities = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    // Get live activities
    const activitiesQuery = `
      SELECT la.*, u.last_name as host_name,
             COUNT(lap.id) as participant_count,
             CASE WHEN EXISTS (
               SELECT 1 FROM live_activity_participants lap 
               WHERE lap.activity_id = la.id AND lap.participant_email = $1
             ) THEN true ELSE false END as is_joined
      FROM live_activities la
      JOIN users u ON la.host_email = u.email
      LEFT JOIN live_activity_participants lap ON la.id = lap.activity_id
      WHERE la.scheduled_start > CURRENT_TIMESTAMP - INTERVAL '24 hours'
      GROUP BY la.id, u.last_name
      ORDER BY la.scheduled_start ASC
    `;
    
    // Get milestone celebrations
    const milestonesQuery = `
      SELECT mc.*, u.last_name as user_name
      FROM milestone_celebrations mc
      JOIN users u ON mc.user_email = u.email
      WHERE mc.is_shared = true 
      ORDER BY mc.celebration_date DESC
      LIMIT 10
    `;
    
    const [liveActivitiesResult, milestonesResult] = await Promise.all([
      db.query(activitiesQuery, [userEmail]),
      db.query(milestonesQuery)
    ]);
    
    // Format activities for frontend
    const activities = [
      ...liveActivitiesResult.rows.map(activity => ({
        type: 'live_activity',
        data: {
          id: activity.id,
          title: activity.title,
          description: activity.description,
          activity_type: activity.activity_type,
          host_email: activity.host_email,
          host_name: activity.host_name,
          scheduled_start: activity.scheduled_start,
          scheduled_end: activity.scheduled_end,
          max_participants: activity.max_participants,
          is_active: activity.is_active,
          created_at: activity.created_at,
          participant_count: parseInt(activity.participant_count),
          meeting_link: activity.meeting_link,
          meeting_password: activity.meeting_password,
          metadata: activity.metadata ? (typeof activity.metadata === 'string' ? JSON.parse(activity.metadata) : activity.metadata) : {}
        },
        timestamp: activity.created_at,
        is_joined: activity.is_joined
      })),
      ...milestonesResult.rows.map(milestone => ({
        type: 'milestone',
        data: {
          id: milestone.id,
          user_email: milestone.user_email,
          user_name: milestone.user_name,
          milestone_type: milestone.milestone_type,
          milestone_value: milestone.milestone_value,
          description: milestone.description,
          is_shared: milestone.is_shared,
          shared_with: milestone.shared_with,
          celebration_date: milestone.celebration_date,
          created_at: milestone.created_at
        },
        timestamp: milestone.created_at
      }))
    ];
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ msg: 'Failed to fetch activities' });
  }
};

// Join activity
exports.joinActivity = async (req, res) => {
  try {
    const activityId = req.params.activityId;
    const userEmail = req.user.email;
    
    console.log(`[JOIN ACTIVITY] User ${userEmail} joining activity ${activityId}`);
    
    // Check if already joined
    const existing = await db.query(
      'SELECT * FROM live_activity_participants WHERE activity_id = $1 AND participant_email = $2',
      [activityId, userEmail]
    );
    
    if (existing.rows.length > 0) {
      console.log(`[JOIN ACTIVITY] User ${userEmail} already joined activity ${activityId}`);
      return res.status(400).json({ msg: 'Already joined this activity' });
    }
    
    // Get activity details for email notification
    const activityDetails = await db.query(
      'SELECT la.*, u.last_name as host_name FROM live_activities la JOIN users u ON la.host_email = u.email WHERE la.id = $1',
      [activityId]
    );
    
    if (activityDetails.rows.length === 0) {
      console.log(`[JOIN ACTIVITY] Activity ${activityId} not found`);
      return res.status(404).json({ msg: 'Activity not found' });
    }
    
    const activity = activityDetails.rows[0];
    console.log(`[JOIN ACTIVITY] Found activity: ${activity.title}`);
    
    await db.query(
      'INSERT INTO live_activity_participants (activity_id, participant_email, joined_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
      [activityId, userEmail]
    );
    
    console.log(`[JOIN ACTIVITY] User ${userEmail} successfully joined activity ${activityId}`);
    
    // Send email notification to user who joined
    await sendActivityJoinConfirmation(userEmail, activity);
    
    res.json({ msg: 'Activity joined' });
  } catch (error) {
    console.error('Error joining activity:', error);
    res.status(500).json({ msg: 'Failed to join activity' });
  }
};

// Helper function to send activity join confirmation email
async function sendActivityJoinConfirmation(userEmail, activity) {
  try {
    console.log(`[EMAIL] Preparing join confirmation for ${userEmail} - activity: ${activity.title}`);
    
    const NotificationService = require('../services/notificationService');
    const notificationService = new NotificationService();
    
    const notification = {
      title: `Successfully Joined: ${activity.title}`,
      message: `Hi ${userEmail.split('@')[0]}! You have successfully joined "${activity.title}" scheduled for ${new Date(activity.scheduled_start).toLocaleString()}.\n\nActivity Details:\n- Type: ${activity.activity_type.replace('_', ' ')}\n- Host: ${activity.host_name}\n- Description: ${activity.description}\n\nWe'll send you reminders before the activity starts. Get ready for your session!`,
      type: 'activity_join',
      metadata: {
        activityId: activity.id,
        activityType: activity.activity_type,
        scheduledStart: activity.scheduled_start
      }
    };
    
    const result = await notificationService.sendEmailNotification(userEmail, notification);
    console.log(`[EMAIL] Join confirmation result for ${userEmail}:`, result);
  } catch (error) {
    console.error('Failed to send activity join confirmation email:', error);
  }
}

// Send encouragement
exports.sendEncouragement = async (req, res) => {
  try {
    const { recipientEmail, message } = req.body;
    const senderEmail = req.user.email;
    
    if (!recipientEmail || !message) {
      return res.status(400).json({ msg: 'Recipient email and message are required' });
    }
    
    // Check if recipient exists
    const recipientCheck = await db.query('SELECT email FROM users WHERE email = $1', [recipientEmail]);
    if (recipientCheck.rows.length === 0) {
      return res.status(404).json({ msg: 'Recipient not found' });
    }
    
    // Send encouragement
    await db.query(
      'INSERT INTO encouragements (sender_email, recipient_email, message, encouragement_type) VALUES ($1, $2, $3, $4)',
      [senderEmail, recipientEmail, message, 'general']
    );
    
    res.json({ msg: 'Encouragement sent' });
  } catch (error) {
    console.error('Error sending encouragement:', error);
    res.status(500).json({ msg: 'Failed to send encouragement' });
  }
};

// Create live activity
exports.createActivity = async (req, res) => {
  try {
    const {
      title,
      description,
      activity_type,
      scheduled_start,
      scheduled_end,
      max_participants,
      use_in_app_meeting = false
    } = req.body;
    
    const hostEmail = req.user.email;
    
    // Validate required fields
    if (!title || !description || !activity_type || !scheduled_start || !scheduled_end || !max_participants) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }
    
    // Validate activity type
    const validTypes = ['workout', 'nutrition_workshop', 'qna', 'challenge_prep'];
    if (!validTypes.includes(activity_type)) {
      return res.status(400).json({ msg: 'Invalid activity type' });
    }
    
    // Validate dates
    const startTime = new Date(scheduled_start);
    const endTime = new Date(scheduled_end);
    
    if (startTime >= endTime) {
      return res.status(400).json({ msg: 'End time must be after start time' });
    }
    
    if (startTime <= new Date()) {
      return res.status(400).json({ msg: 'Start time must be in the future' });
    }
    
    let meetingLink = null;
    let meetingPassword = null;
    
    // Generate in-app meeting link if requested
    if (use_in_app_meeting) {
      const InAppMeetingService = require('../services/inAppMeetingService');
      const meetingService = new InAppMeetingService();
      
      const meetingDetails = await meetingService.createMeetingRoom();
      
      meetingLink = meetingDetails.meetUrl;
      meetingPassword = meetingDetails.password;
      
      console.log(`[IN-APP MEETING] Created meeting for activity "${title}": ${meetingLink}`);
    }
    
    // Create activity
    const result = await db.query(
      `INSERT INTO live_activities 
       (title, description, activity_type, host_email, scheduled_start, scheduled_end, 
        max_participants, meeting_link, meeting_password, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [title, description, activity_type, hostEmail, scheduled_start, scheduled_end, 
       max_participants, meetingLink, meetingPassword, JSON.stringify({ use_in_app_meeting })]
    );
    
    console.log('Activity created successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ msg: 'Failed to create activity' });
  }
};

// Create milestone celebration
exports.createMilestone = async (req, res) => {
  try {
    const {
      milestone_type,
      milestone_value,
      description
    } = req.body;
    
    const userEmail = req.user.email;
    
    // Validate required fields
    if (!milestone_type || !milestone_value || !description) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }
    
    // Validate milestone value
    if (typeof milestone_value !== 'number' || milestone_value <= 0) {
      return res.status(400).json({ msg: 'Milestone value must be a positive number' });
    }
    
    // Create milestone celebration
    const result = await db.query(
      `INSERT INTO milestone_celebrations 
       (user_email, milestone_type, milestone_value, description, is_shared, celebration_date)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userEmail, milestone_type, milestone_value, description, true]
    );
    
    console.log('Milestone created successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating milestone:', error);
    res.status(500).json({ msg: 'Failed to create milestone' });
  }
};

// Get user milestones
exports.getUserMilestones = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const currentUserEmail = req.user.email;
    
    // Allow viewing own milestones or if viewing someone's profile
    const targetEmail = userEmail || currentUserEmail;
    
    const query = `
      SELECT mc.*, u.last_name as user_name
      FROM milestone_celebrations mc
      JOIN users u ON mc.user_email = u.email
      WHERE mc.user_email = $1
      ORDER BY mc.celebration_date DESC
    `;
    
    const result = await db.query(query, [targetEmail]);
    
    console.log(`[MILESTONES] Retrieved ${result.rows.length} milestones for ${targetEmail}`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user milestones:', error);
    res.status(500).json({ msg: 'Failed to fetch milestones' });
  }
};

// Get user completed challenges
exports.getUserChallenges = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const currentUserEmail = req.user.email;
    
    // Allow viewing own challenges or if viewing someone's profile
    const targetEmail = userEmail || currentUserEmail;
    
    const query = `
      SELECT c.*, 
             cp.progress,
             cp.completed_at,
             cp.points_awarded,
             c.title as challenge_title,
             c.description as challenge_description,
             c.challenge_type,
             c.duration_days,
             c.target_value,
             c.reward_points,
             c.max_participants
      FROM challenge_participants cp
      JOIN challenges c ON cp.challenge_id = c.id
      WHERE cp.participant_email = $1 AND cp.completed_at IS NOT NULL
      ORDER BY cp.completed_at DESC
    `;
    
    const result = await db.query(query, [targetEmail]);
    
    console.log(`[CHALLENGES] Retrieved ${result.rows.length} completed challenges for ${targetEmail}`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    res.status(500).json({ msg: 'Failed to fetch challenges' });
  }
};

// Update activity status (start/end live activities)
exports.updateActivityStatus = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { status, meeting_link } = req.body; // status: 'live', 'ended'
    const userEmail = req.user.email;
    
    console.log(`[ACTIVITY STATUS] Updating activity ${activityId} to ${status} by ${userEmail}`);
    
    // Check if user is the host
    const activityCheck = await db.query(
      'SELECT * FROM live_activities WHERE id = $1 AND host_email = $2',
      [activityId, userEmail]
    );
    
    if (activityCheck.rows.length === 0) {
      console.log(`[ACTIVITY STATUS] User ${userEmail} is not host of activity ${activityId}`);
      return res.status(403).json({ msg: 'Only the host can update activity status' });
    }
    
    let updateFields = ['is_active = $1'];
    let values = [status === 'live'];
    
    if (meeting_link) {
      updateFields.push('meeting_link = $2');
      values.push(meeting_link);
    }
    
    if (status === 'ended') {
      // Only add ended_at if the column exists
      try {
        await db.query('ALTER TABLE live_activities ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP');
        updateFields.push('ended_at = CURRENT_TIMESTAMP');
      } catch (error) {
        console.log('[ACTIVITY STATUS] ended_at column already exists or could not be added:', error.message);
      }
      if (meeting_link) {
        updateFields.push('meeting_link = $3');
      }
    }
    
    const updateQuery = `UPDATE live_activities SET ${updateFields.join(', ')} WHERE id = $${values.length + 1} RETURNING *`;
    values.push(activityId);
    
    console.log(`[ACTIVITY STATUS] Update query: ${updateQuery}`);
    console.log(`[ACTIVITY STATUS] Update values:`, values);
    
    const result = await db.query(updateQuery, values);
    
    console.log(`[ACTIVITY STATUS] Update successful:`, result.rows[0]);
    
    // Log the activity status after update
    const updatedActivity = result.rows[0];
    console.log(`[ACTIVITY STATUS] Final is_active value:`, updatedActivity.is_active);
    console.log(`[ACTIVITY STATUS] Final ended_at value:`, updatedActivity.ended_at);
    
    // Notify participants about status change
    if (status === 'live') {
      await notifyActivityParticipants(activityId, 'started', activityCheck.rows[0]);
    } else if (status === 'ended') {
      await notifyActivityParticipants(activityId, 'ended', activityCheck.rows[0]);
      await createActivityCompletionTracking(activityId);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating activity status:', error);
    res.status(500).json({ msg: 'Failed to update activity status', error: error.message });
  }
};

// Helper function to notify activity participants
async function notifyActivityParticipants(activityId, action, activity) {
  try {
    const participantsQuery = `
      SELECT participant_email FROM live_activity_participants 
      WHERE activity_id = $1
    `;
    
    const participants = await db.query(participantsQuery, [activityId]);
    
    for (const participant of participants.rows) {
      // Create notification for participant
      const notificationTitle = action === 'started' ? 'Activity Started!' : 'Activity Ended';
      const notificationMessage = action === 'started' 
        ? `${activity.title} has started! Join now: ${activity.meeting_link || 'Check the activity page'}`
        : `${activity.title} has ended. Thanks for participating!`;
      
      await db.query(
        `INSERT INTO notification_logs 
         (user_email, notification_type, title, message, scheduled_time, metadata, status)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, 'sent')`,
        [
          participant.participant_email,
          'activity',
          notificationTitle,
          notificationMessage,
          JSON.stringify({
            activityId,
            action,
            activityType: activity.activity_type
          })
        ]
      );
    }
  } catch (error) {
    console.error('Error notifying participants:', error);
  }
}

// Helper function to create activity completion tracking
async function createActivityCompletionTracking(activityId) {
  try {
    // Mark activity as completed for all participants
    await db.query(
      `UPDATE live_activity_participants 
       SET left_at = CURRENT_TIMESTAMP 
       WHERE activity_id = $1 AND left_at IS NULL`,
      [activityId]
    );
    
    // Could add more sophisticated tracking here (duration, feedback, etc.)
    console.log(`Activity ${activityId} completion tracking created`);
  } catch (error) {
    console.error('Error creating completion tracking:', error);
  }
}

// Get activity participants for host
exports.getActivityParticipants = async (req, res) => {
  try {
    const { activityId } = req.params;
    const userEmail = req.user.email;
    
    // Check if user is the host
    const activityCheck = await db.query(
      'SELECT * FROM live_activities WHERE id = $1 AND host_email = $2',
      [activityId, userEmail]
    );
    
    if (activityCheck.rows.length === 0) {
      return res.status(403).json({ msg: 'Only the host can view participants' });
    }
    
    const participantsQuery = `
      SELECT lap.participant_email, u.last_name, lap.joined_at, lap.left_at
      FROM live_activity_participants lap
      JOIN users u ON lap.participant_email = u.email
      WHERE lap.activity_id = $1
      ORDER BY lap.joined_at ASC
    `;
    
    const result = await db.query(participantsQuery, [activityId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching activity participants:', error);
    res.status(500).json({ msg: 'Failed to fetch participants' });
  }
};
