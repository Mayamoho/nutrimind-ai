/**
 * Notification Routes - Smart Notifications & Reminders API
 */

const express = require('express');
const router = express.Router();
const NotificationService = require('../services/notificationService');
const ragService = require('../services/ragService');
const db = require('../db');

const notificationService = new NotificationService();

// Helper to extract email from user object
const getUserEmail = (req) => {
  const email = req.user && (typeof req.user === 'object' ? req.user.email : req.user);
  if (!email) {
    throw new Error('User email not found in token');
  }
  return email;
};

// Middleware to check if user is authenticated
const authenticateToken = require('../middleware/auth');

// Get user notification settings
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const settings = await notificationService.getUserNotificationSettings(getUserEmail(req));
    res.json(settings);
  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({ error: 'Failed to get notification settings' });
  }
});

// Update user notification settings
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const settings = req.body;
    const updatedSettings = await notificationService.updateUserNotificationSettings(getUserEmail(req), settings);
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

// Get notification history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = await notificationService.getNotificationHistory(getUserEmail(req), limit);
    res.json(history);
  } catch (error) {
    console.error('Error getting notification history:', error);
    res.status(500).json({ error: 'Failed to get notification history' });
  }
});

// Generate and send notifications (manual trigger)
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    // Get user data
    const userQuery = await db.query(
      'SELECT email, weight, height, age, gender, country FROM users WHERE email = $1',
      [getUserEmail(req)]
    );
    
    if (!userQuery.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userQuery.rows[0];
    
    // Get user goals
    const goalsQuery = await db.query(
      'SELECT target_weight AS "targetWeight", weight_goal AS "weightGoal" FROM user_goals WHERE user_email = $1',
      [getUserEmail(req)]
    );
    
    const goals = goalsQuery.rows[0] || {
      targetWeight: userData.weight,
      weightGoal: 'maintain'
    };
    
    // Get today's log
    const today = new Date().toISOString().split('T')[0];
    const todayLogQuery = await db.query(
      'SELECT foods, exercises, water_intake AS "waterIntake" FROM daily_logs WHERE user_email = $1 AND date = $2',
      [getUserEmail(req), today]
    );
    
    const todayLog = todayLogQuery.rows[0] || {
      foods: [],
      exercises: [],
      waterIntake: 0
    };
    
    // Build user context
    const userContext = ragService.buildUserContext(userData, [todayLog], goals);
    
    // Get notification settings
    const settings = await notificationService.getUserNotificationSettings(getUserEmail(req));
    
    // Generate notifications
    const notifications = await notificationService.generateNotifications(userData, userContext, settings);
    
    // Save notifications
    const savedNotifications = [];
    for (const notification of notifications) {
      const saved = await notificationService.saveNotification(getUserEmail(req), notification);
      savedNotifications.push(saved);
    }
    
    res.json({
      message: `Generated ${savedNotifications.length} notifications`,
      notifications: savedNotifications
    });
  } catch (error) {
    console.error('Error generating notifications:', error);
    res.status(500).json({ error: 'Failed to generate notifications' });
  }
});

// Get pending notifications
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT * FROM notification_logs 
      WHERE user_email = $1 AND status = 'pending' 
      ORDER BY scheduled_time ASC
    `;
    
    const result = await db.query(query, [getUserEmail(req)]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    res.status(500).json({ error: 'Failed to get pending notifications' });
  }
});

// Mark notification as read/dismissed
router.put('/:id/dismiss', authenticateToken, async (req, res) => {
  try {
    const query = `
      UPDATE notification_logs 
      SET status = 'dismissed', sent_time = CURRENT_TIMESTAMP 
      WHERE id = $1 AND user_email = $2 
      RETURNING *
    `;
    
    const result = await db.query(query, [req.params.id, getUserEmail(req)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({ error: 'Failed to dismiss notification' });
  }
});

// Test notification (for development)
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { type, title, message } = req.body;
    
    const notification = {
      type: type || 'test',
      title: title || 'Test Notification',
      message: message || 'This is a test notification',
      scheduledTime: new Date(),
      metadata: { test: true }
    };
    
    const saved = await notificationService.saveNotification(getUserEmail(req), notification);
    res.json(saved);
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ error: 'Failed to create test notification' });
  }
});

module.exports = router;