/**
 * Insights Routes
 * Backend API for daily nutrition insights
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// Helper to extract email from user object
const getUserEmail = (req) => {
  const email = req.user && (typeof req.user === 'object' ? req.user.email : req.user);
  if (!email) {
    throw new Error('User email not found in token');
  }
  return email;
};

// @route   GET api/insights/today
// @desc    Get today's insights for the user
router.get('/today', auth, async (req, res) => {
  try {
    const email = getUserEmail(req);
    const today = new Date().toISOString().split('T')[0];

    const result = await db.query(
      `SELECT date, overall_score AS "overallScore", grade, 
              calorie_balance AS "calorieBalance",
              protein_percentage AS "proteinPercentage",
              carbs_percentage AS "carbsPercentage",
              fat_percentage AS "fatPercentage",
              top_achievement AS "topAchievement",
              primary_focus AS "primaryFocus",
              insights_json AS "insights"
       FROM daily_insights 
       WHERE user_email = $1 AND date = $2`,
      [email, today]
    );

    if (result.rows.length === 0) {
      return res.json({ exists: false });
    }

    res.json({ exists: true, data: result.rows[0] });
  } catch (err) {
    console.error('Get today insights error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET api/insights/history
// @desc    Get insights history for the user (last 30 days)
router.get('/history', auth, async (req, res) => {
  try {
    const email = getUserEmail(req);
    const days = parseInt(req.query.days) || 30;

    const result = await db.query(
      `SELECT date, overall_score AS "overallScore", grade,
              calorie_balance AS "calorieBalance",
              protein_percentage AS "proteinPercentage",
              carbs_percentage AS "carbsPercentage",
              fat_percentage AS "fatPercentage",
              top_achievement AS "topAchievement"
       FROM daily_insights 
       WHERE user_email = $1 
       AND date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY date DESC`,
      [email]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get insights history error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST api/insights
// @desc    Save daily insights
router.post('/', auth, async (req, res) => {
  const { 
    date, 
    overallScore, 
    grade, 
    calorieBalance,
    proteinPercentage,
    carbsPercentage,
    fatPercentage,
    topAchievement,
    primaryFocus,
    insights 
  } = req.body;

  try {
    const email = getUserEmail(req);

    await db.query(
      `INSERT INTO daily_insights 
       (user_email, date, overall_score, grade, calorie_balance, 
        protein_percentage, carbs_percentage, fat_percentage,
        top_achievement, primary_focus, insights_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (user_email, date) DO UPDATE SET
         overall_score = $3, grade = $4, calorie_balance = $5,
         protein_percentage = $6, carbs_percentage = $7, fat_percentage = $8,
         top_achievement = $9, primary_focus = $10, insights_json = $11`,
      [
        email, date, overallScore, grade, calorieBalance,
        proteinPercentage, carbsPercentage, fatPercentage,
        topAchievement, primaryFocus, JSON.stringify(insights)
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Save insights error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET api/insights/stats
// @desc    Get aggregated insights statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const email = getUserEmail(req);

    // Get average score, best day, grade distribution
    const statsResult = await db.query(
      `SELECT 
         ROUND(AVG(overall_score)) AS "avgScore",
         MAX(overall_score) AS "bestScore",
         COUNT(*) AS "totalDays",
         COUNT(CASE WHEN grade = 'A' THEN 1 END) AS "aDays",
         COUNT(CASE WHEN grade = 'B' THEN 1 END) AS "bDays",
         COUNT(CASE WHEN grade = 'C' THEN 1 END) AS "cDays",
         COUNT(CASE WHEN grade = 'D' THEN 1 END) AS "dDays",
         COUNT(CASE WHEN grade = 'F' THEN 1 END) AS "fDays"
       FROM daily_insights 
       WHERE user_email = $1`,
      [email]
    );

    // Get best day details
    const bestDayResult = await db.query(
      `SELECT date, overall_score AS "overallScore", grade
       FROM daily_insights 
       WHERE user_email = $1 
       ORDER BY overall_score DESC 
       LIMIT 1`,
      [email]
    );

    // Get current week average
    const weekAvgResult = await db.query(
      `SELECT ROUND(AVG(overall_score)) AS "weekAvg"
       FROM daily_insights 
       WHERE user_email = $1 
       AND date >= CURRENT_DATE - INTERVAL '7 days'`,
      [email]
    );

    res.json({
      overall: statsResult.rows[0],
      bestDay: bestDayResult.rows[0] || null,
      weekAverage: weekAvgResult.rows[0]?.weekAvg || 0
    });
  } catch (err) {
    console.error('Get insights stats error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
