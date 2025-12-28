/**
 * AI Coach Routes - Real-time Personalized Suggestions
 * Provides suggestions after EVERY food/exercise log
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateCoachSuggestions, getQuickFoodSuggestion, getQuickExerciseSuggestion, generateDetailedAnalysis } = require('../services/aiCoachService');
const { ECONOMIC_CLASSES } = require('../services/plannerConstants');
const db = require('../db');

/**
 * Helper to handle database errors
 */
const handleDbError = (err, res) => {
  if (!err) return false;
  const code = err.code || '';
  if (code === 'DB_UNAVAILABLE' || code === 'ECONNREFUSED') {
    return res.status(503).json({ error: 'Database unavailable. Try again later.' });
  }
  return false;
};

const safeParseJson = (val, fallback) => {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
};

const getEffectiveDate = () => {
  // Use simple calendar date for consistency
  const now = new Date();
  const dateString = now.toISOString().split('T')[0];
  console.log('AI Coach using calendar date:', dateString);
  return dateString;
};

/**
 * Helper to get user profile and daily progress
 */
async function getUserContext(email) {
  try {
    const todayStr = getEffectiveDate();
    console.log('getUserContext: Looking for data for email:', email, 'date:', todayStr);
    
    // Get user profile
    const userQuery = await db.query(
      `SELECT weight, height, age, gender, country, economic_class FROM users WHERE email = $1`,
      [email]
    );
    if (!userQuery.rows.length) {
      console.log('getUserContext: No user found');
      return null;
    }
    const user = userQuery.rows[0];
    console.log('getUserContext: Found user:', user);
    
    // Get user goals
    const goalsQuery = await db.query(
      `SELECT weight_goal, activity_level FROM user_goals WHERE user_email = $1`,
      [email]
    );
    const goals = goalsQuery.rows[0] || { weight_goal: 'maintain', activity_level: 'light' };
    console.log('getUserContext: Found goals:', goals);
    
    // Get today's log
    const logQuery = await db.query(
      `SELECT foods, exercises, water_intake FROM daily_logs WHERE user_email = $1 AND date = $2`,
      [email, todayStr]
    );
    console.log('getUserContext: Log query result rows:', logQuery.rows.length);
    if (logQuery.rows.length > 0) {
      console.log('getUserContext: Raw log data:', logQuery.rows[0]);
    }
    
    // Also check what dates exist for this user
    const datesQuery = await db.query(
      `SELECT date, COUNT(*) as food_count FROM daily_logs WHERE user_email = $1 GROUP BY date ORDER BY date DESC LIMIT 5`,
      [email]
    );
    console.log('getUserContext: Recent dates for user:', datesQuery.rows);
    
    const todayLog = logQuery.rows[0] || { foods: [], exercises: [], water_intake: 0 };
    todayLog.foods = safeParseJson(todayLog.foods, []);
    todayLog.exercises = safeParseJson(todayLog.exercises, []);
    todayLog.waterIntake = todayLog.water_intake || 0;
    
    console.log('getUserContext: Processed todayLog - foods:', todayLog.foods.length, 'exercises:', todayLog.exercises.length, 'water:', todayLog.waterIntake);

    // Calculate BMR and targets
    const bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + (user.gender === 'male' ? 5 : -161);
    const activityMult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }[goals.activity_level] || 1.375;
    let goalCalories = bmr * activityMult;
    if (goals.weight_goal === 'lose') goalCalories -= 500;
    else if (goals.weight_goal === 'gain') goalCalories += 500;
    goalCalories = Math.round(goalCalories);
    
    const proteinTarget = Math.round(user.weight * (goals.weight_goal === 'gain' ? 2.0 : 1.6));
    
    // Calculate consumed
    const caloriesConsumed = todayLog.foods.reduce((sum, f) => sum + (f.calories || 0), 0);
    const proteinConsumed = todayLog.foods.reduce((sum, f) => {
      const p = f.nutrients?.macros?.find(m => m.name === 'Protein');
      return sum + (p?.amount || 0);
    }, 0);
    const carbsConsumed = todayLog.foods.reduce((sum, f) => {
      const c = f.nutrients?.macros?.find(m => m.name === 'Carbs');
      return sum + (c?.amount || 0);
    }, 0);
    const fatConsumed = todayLog.foods.reduce((sum, f) => {
      const fa = f.nutrients?.macros?.find(m => m.name === 'Fat');
      return sum + (fa?.amount || 0);
    }, 0);
    
    return {
      userProfile: {
        ...user,
        weightGoal: goals.weight_goal,
        economicClass: user.economic_class || 'standard'
      },
      todayLog,
      dailyProgress: {
        calories: { achieved: caloriesConsumed },
        protein: proteinConsumed,
        carbs: carbsConsumed,
        fat: fatConsumed,
        goalCalories,
        proteinTarget
      }
    };
  } catch (err) {
    throw err;
  }
}

/**
 * POST /api/aicoach/detailed-analysis
 * Get comprehensive detailed analysis of user's daily history
 */
router.post('/detailed-analysis', auth, async (req, res) => {
  try {
    // Extract email from user object
    const email = req.user && (typeof req.user === 'object' ? req.user.email : req.user);
    console.log('AI Coach: Received detailed analysis request for user:', email);
    
    if (!email) {
      console.log('AI Coach: User email not found in token');
      return res.status(400).json({ error: 'User email not found in token' });
    }
    
    const context = await getUserContext(email);
    if (!context) {
      console.log('AI Coach: User context not found');
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('AI Coach: Got user context, generating detailed analysis...');
    const detailedAnalysis = await generateDetailedAnalysis(
      context.userProfile,
      email
    );
    
    console.log('AI Coach: Generated detailed analysis');
    res.json(detailedAnalysis);
  } catch (err) {
    if (handleDbError(err, res)) return;
    console.error('AI Coach detailed analysis error:', err);
    res.status(500).json({ error: 'AI Coach detailed analysis failed' });
  }
});

/**
 * POST /api/aicoach/suggestions
 * Get comprehensive AI coach suggestions
 */
router.post('/suggestions', auth, async (req, res) => {
  try {
    // Extract email from user object
    const email = req.user && (typeof req.user === 'object' ? req.user.email : req.user);
    console.log('AI Coach: Received request for user:', email);
    
    if (!email) {
      console.log('AI Coach: User email not found in token');
      return res.status(400).json({ error: 'User email not found in token' });
    }
    
    const context = await getUserContext(email);
    if (!context) {
      console.log('AI Coach: User context not found');
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('AI Coach: Got user context, generating suggestions...');
    console.log('AI Coach: Today log foods count:', context.todayLog.foods?.length || 0);
    console.log('AI Coach: Today log exercises count:', context.todayLog.exercises?.length || 0);
    console.log('AI Coach: Daily progress calories:', context.dailyProgress.calories);
    
    const suggestions = await generateCoachSuggestions(
      context.userProfile,
      context.todayLog,
      context.dailyProgress
    );
    
    console.log('AI Coach: Generated suggestions');
    res.json(suggestions);
  } catch (err) {
    if (handleDbError(err, res)) return;
    console.error('AI Coach error:', err);
    res.status(500).json({ error: 'AI Coach failed' });
  }
});

/**
 * POST /api/aicoach/quick-food-tip
 * Get quick suggestion after logging food
 * Body: { food: { name, calories, ... } }
 */
router.post('/quick-food-tip', auth, async (req, res) => {
  try {
    const { food } = req.body;
    if (!food) return res.status(400).json({ error: 'Food data required' });
    
    const context = await getUserContext(req.user && (typeof req.user === 'object' ? req.user.email : req.user));
    if (!context) return res.status(404).json({ error: 'User not found' });
    
    const tip = await getQuickFoodSuggestion(
      context.userProfile,
      food,
      context.dailyProgress
    );
    
    res.json(tip);
  } catch (err) {
    console.error('Quick food tip error:', err);
    res.status(500).json({ error: 'Failed to get tip' });
  }
});

/**
 * POST /api/aicoach/quick-exercise-tip
 * Get quick suggestion after logging exercise
 * Body: { exercise: { name, caloriesBurned, ... } }
 */
router.post('/quick-exercise-tip', auth, async (req, res) => {
  try {
    const { exercise } = req.body;
    if (!exercise) return res.status(400).json({ error: 'Exercise data required' });
    
    const context = await getUserContext(req.user && (typeof req.user === 'object' ? req.user.email : req.user));
    if (!context) return res.status(404).json({ error: 'User not found' });
    
    const tip = await getQuickExerciseSuggestion(
      context.userProfile,
      exercise,
      context.dailyProgress
    );
    
    res.json(tip);
  } catch (err) {
    console.error('Quick exercise tip error:', err);
    res.status(500).json({ error: 'Failed to get tip' });
  }
});

/**
 * GET /api/aicoach/economic-classes
 * Get available economic classes
 */
router.get('/economic-classes', (req, res) => {
  res.json(Object.entries(ECONOMIC_CLASSES).map(([id, val]) => ({ 
    id, 
    label: val.label,
    description: val.description 
  })));
});

/**
 * PUT /api/aicoach/preferences
 * Update user's economic class
 */
router.put('/preferences', auth, async (req, res) => {
  try {
    const { economicClass } = req.body;
    if (!economicClass || !ECONOMIC_CLASSES[economicClass]) {
      return res.status(400).json({ error: 'Invalid economic class' });
    }
    
    await db.query('UPDATE users SET economic_class = $1 WHERE email = $2', [economicClass, req.user && (typeof req.user === 'object' ? req.user.email : req.user)]);
    res.json({ message: 'Preferences updated', economicClass });
  } catch (err) {
    console.error('Update preferences error:', err);
    res.status(500).json({ error: 'Failed to update' });
  }
});

module.exports = router;
