/**
 * Achievement Routes
 * Backend API for the achievement/gamification system
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// DB error helper
const handleDbError = (err, res) => {
  if (!err) return false;
  const code = err.code || '';
  if (code === 'DB_UNAVAILABLE' || code === 'ECONNREFUSED') {
    return res.status(503).json({ error: 'Database unavailable. Try again later.' });
  }
  return false;
};

// @route   GET api/achievements
// @desc    Get user's achievement data
router.get('/', auth, async (req, res) => {
  try {
    // Extract email from user object
    const email = req.user && (typeof req.user === 'object' ? req.user.email : req.user);
    
    if (!email) {
      return res.status(400).json({ error: 'User email not found in token' });
    }

    // Get unlocked achievements
    const achievementsQuery = await db.query(
      `SELECT achievement_id AS "achievementId", unlocked_at AS "unlockedAt", points_earned AS "pointsEarned"
       FROM user_achievements WHERE user_email = $1`,
      [email]
    );

    // Get or create stats
    let statsQuery = await db.query(
      `SELECT total_points AS "totalPoints", current_streak AS "currentStreak", 
              longest_streak AS "longestStreak", level, last_activity_date AS "lastActivityDate"
       FROM user_achievement_stats WHERE user_email = $1`,
      [email]
    );

    if (statsQuery.rows.length === 0) {
      await db.query(
        `INSERT INTO user_achievement_stats (user_email) VALUES ($1)`,
        [email]
      );
      statsQuery = await db.query(
        `SELECT total_points AS "totalPoints", current_streak AS "currentStreak", 
                longest_streak AS "longestStreak", level, last_activity_date AS "lastActivityDate"
         FROM user_achievement_stats WHERE user_email = $1`,
        [email]
      );
    }

    res.json({
      unlockedAchievements: achievementsQuery.rows,
      stats: statsQuery.rows[0]
    });
  } catch (err) {
    if (handleDbError(err, res)) return;
    console.error('Get achievements error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST api/achievements/unlock
// @desc    Unlock an achievement
router.post('/unlock', auth, async (req, res) => {
  const { achievementId, points } = req.body;
  try {
    // Extract email from user object
    const email = req.user && (typeof req.user === 'object' ? req.user.email : req.user);
    
    if (!email) {
      return res.status(400).json({ error: 'User email not found in token' });
    }

    // Check if already unlocked
    const existing = await db.query(
      `SELECT id FROM user_achievements WHERE user_email = $1 AND achievement_id = $2`,
      [email, achievementId]
    );

    if (existing.rows.length > 0) {
      return res.json({ success: false, msg: 'Already unlocked' });
    }

    // Insert achievement
    await db.query(
      `INSERT INTO user_achievements (user_email, achievement_id, points_earned) VALUES ($1, $2, $3)`,
      [email, achievementId, points]
    );

    // Update stats
    await db.query(
      `UPDATE user_achievement_stats 
       SET total_points = total_points + $1, 
           level = FLOOR((total_points + $1) / 500) + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_email = $2`,
      [points, email]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Unlock achievement error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT api/achievements/streak
// @desc    Update user streak
router.put('/streak', auth, async (req, res) => {
  const { currentStreak, longestStreak } = req.body;
  try {
    // Extract email from user object
    const email = req.user && (typeof req.user === 'object' ? req.user.email : req.user);
    
    if (!email) {
      return res.status(400).json({ error: 'User email not found in token' });
    }

    await db.query(
      `UPDATE user_achievement_stats 
       SET current_streak = $1, longest_streak = GREATEST(longest_streak, $2),
           last_activity_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
       WHERE user_email = $3`,
      [currentStreak, longestStreak, email]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Update streak error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT api/achievements/sync
// @desc    Sync full achievement state from frontend
router.put('/sync', auth, async (req, res) => {
  const { totalPoints, currentStreak, longestStreak, level, unlockedAchievements } = req.body;
  try {
    // Extract email from user object
    const email = req.user && (typeof req.user === 'object' ? req.user.email : req.user);
    
    if (!email) {
      return res.status(400).json({ error: 'User email not found in token' });
    }

    // Update stats
    await db.query(
      `INSERT INTO user_achievement_stats (user_email, total_points, current_streak, longest_streak, level, last_activity_date)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
       ON CONFLICT (user_email) DO UPDATE SET
         total_points = $2, current_streak = $3, longest_streak = $4, level = $5,
         last_activity_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP`,
      [email, totalPoints, currentStreak, longestStreak, level]
    );

    // Sync unlocked achievements
    if (unlockedAchievements && unlockedAchievements.length > 0) {
      for (const ach of unlockedAchievements) {
        await db.query(
          `INSERT INTO user_achievements (user_email, achievement_id, points_earned, unlocked_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_email, achievement_id) DO NOTHING`,
          [email, ach.id, ach.points, ach.unlockedAt || new Date()]
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Sync achievements error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
