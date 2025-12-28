/**
 * RAG-based Chat Routes
 * Uses Retrieval-Augmented Generation for contextual responses
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');
const RAGService = require('../services/ragService');

// Initialize RAG service
const ragService = new RAGService();

// Helper to extract email from user object
const getUserEmail = (req) => {
  const email = req.user && (typeof req.user === 'object' ? req.user.email : req.user);
  if (!email) {
    throw new Error('User email not found in token');
  }
  return email;
};

/**
 * @route   POST /api/chat/message
 * @desc    Send message to RAG chatbot
 */
router.post('/message', auth, async (req, res) => {
  const { message } = req.body;
  
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Get user data
    const userQuery = await db.query(
      `SELECT email, weight, height, age, gender, country 
       FROM users WHERE email = $1`,
      [getUserEmail(req)]
    );

    if (!userQuery.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userQuery.rows[0];

    // Get user goals
    const goalsQuery = await db.query(
      `SELECT target_weight AS "targetWeight", weight_goal AS "weightGoal", goal_timeline AS "goalTimeline"
       FROM user_goals WHERE user_email = $1`,
      [getUserEmail(req)]
    );

    const goals = goalsQuery.rows[0] || {
      targetWeight: userData.weight,
      weightGoal: 'maintain',
      goalTimeline: 12
    };

    // Safe JSON parsing function
    const safeParseJson = (data) => {
      if (!data) return [];
      if (typeof data === 'object') return data;
      try {
        return JSON.parse(data);
      } catch (e) {
        return [];
      }
    };

    // Get today's log specifically (using current date format)
    const today = new Date().toISOString().split('T')[0];
    const todayLogQuery = await db.query(
      `SELECT date, foods, exercises, water_intake AS "waterIntake"
       FROM daily_logs 
       WHERE user_email = $1 AND date = $2`,
      [getUserEmail(req), today]
    );

    // If no today's log, try to get the most recent log
    let dailyLogs = [];
    if (todayLogQuery.rows.length > 0) {
      dailyLogs = todayLogQuery.rows.map(log => ({
        date: log.date,
        foods: safeParseJson(log.foods),
        exercises: safeParseJson(log.exercises),
        waterIntake: log.waterIntake || 0
      }));
      console.log('Chat Route: Today log foods:', dailyLogs[0].foods);
    } else {
      // Get the most recent log as fallback
      const recentLogQuery = await db.query(
        `SELECT date, foods, exercises, water_intake AS "waterIntake"
         FROM daily_logs 
         WHERE user_email = $1 
         ORDER BY date DESC 
         LIMIT 1`,
        [getUserEmail(req)]
      );
      
      if (recentLogQuery.rows.length > 0) {
        dailyLogs = recentLogQuery.rows.map(log => ({
          date: log.date,
          foods: safeParseJson(log.foods),
          exercises: safeParseJson(log.exercises),
          waterIntake: log.waterIntake || 0
        }));
        console.log('Chat Route: Recent log foods:', dailyLogs[0].foods);
      }
    }

    // Build user context
    const userContext = ragService.buildUserContext(userData, dailyLogs, goals);

    // Generate RAG response
    const response = await ragService.generateResponse(message, userContext);

    res.json({ 
      response,
      context: {
        hasUserData: true,
        dataPoints: dailyLogs.length,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

/**
 * @route   POST /api/chat/feedback
 * @desc    Submit feedback on chat responses
 */
router.post('/feedback', auth, async (req, res) => {
  const { messageId, rating, comment } = req.body;
  
  try {
    // Store feedback for improving the system
    await db.query(
      `INSERT INTO chat_feedback (user_email, message_id, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [getUserEmail(req), messageId, rating, comment]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

/**
 * @route   GET /api/chat/history
 * @desc    Get chat history for user
 */
router.get('/history', auth, async (req, res) => {
  try {
    // In a full implementation, you'd store chat history in database
    // For now, return empty history
    res.json({ history: [] });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * @route   DELETE /api/chat/cache
 * @desc    Clear user context cache
 */
router.delete('/cache', auth, async (req, res) => {
  try {
    ragService.clearUserCache(getUserEmail(req));
    res.json({ success: true });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

module.exports = router;
