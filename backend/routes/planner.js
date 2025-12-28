const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');
const planner = require('../services/personalizedPlannerService');
const { regenerateMealDatabase } = require('../services/comprehensiveMealDatabase');

// Helper to extract email from user object
const getUserEmail = (req) => {
  const email = req.user && (typeof req.user === 'object' ? req.user.email : req.user);
  if (!email) {
    throw new Error('User email not found in token');
  }
  return email;
};

// Basic health and availability checks
router.get('/', auth, async (_req, res) => res.json({ ok: true, msg: 'Personalized Planner available' }));
router.get('/health', (_req, res) => res.json({ ok: true }));

const HIGH_INCOME_COUNTRIES = new Set([
	'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 'Japan', 'Sweden', 'Norway', 'Netherlands'
]);

const inferBudgetClassFromCountry = (country) => {
	if (!country) return 'economy';
	return HIGH_INCOME_COUNTRIES.has(country) ? 'rich' : 'economy';
};

// Basic planner routes (placeholder) - implement planner logic as needed
router.get('/', auth, async (req, res) => {
  res.json({ ok: true, msg: 'Planner routes available' });
});

// simple health check for planner
router.get('/health', (_req, res) => res.json({ ok: true }));

/**
 * POST /api/planner/generate
 * Body: { goalCalories?, proteinTarget? }
 * Uses user profile and food aggregator to build a simple daily meal plan.
 */
// Get user profile and today's log for comprehensive planning
async function getUserProfileAndLog(email) {
  try {
    const userQuery = await db.query(
      `SELECT email, weight, height, age, gender, country, economic_class AS economic_class_db, dietary_preferences, cuisine_preferences FROM users WHERE email = $1`,
      [email]
    );
    const user = userQuery.rows[0] || {};

    const goalsQuery = await db.query(
      `SELECT weight_goal, activity_level FROM user_goals WHERE user_email = $1 ORDER BY updated_at DESC LIMIT 1`,
      [email]
    );
    const goals = goalsQuery.rows[0] || {};

    const getEffectiveDate = () => {
      // Use simple calendar date for consistency with AI Coach
      const now = new Date();
      return now.toISOString().split('T')[0];
    };

    const todayStr = getEffectiveDate();
    const logQuery = await db.query(
      `SELECT foods, exercises, water_intake FROM daily_logs WHERE user_email = $1 AND date = $2`,
      [email, todayStr]
    );
    const todayLog = logQuery.rows[0] || { foods: [], exercises: [], water_intake: 0 };

    if (typeof todayLog.foods === 'string') todayLog.foods = JSON.parse(todayLog.foods || '[]');
    if (typeof todayLog.exercises === 'string') todayLog.exercises = JSON.parse(todayLog.exercises || '[]');

    return {
      ...user,
      economic_class: user.economic_class_db || user.economic_class || 'standard',
      weightGoal: goals.weight_goal || 'maintain',
      goalCalories: goals.daily_calories || 2000,
      proteinTarget: goals.daily_protein || 100,
      activityLevel: goals.activity_level || 'moderate',
      todayLog
    };
  } catch (error) {
    console.error('Error getting user profile and log:', error);
    return {
      email,
      weightGoal: 'maintain',
      goalCalories: 2000,
      proteinTarget: 100,
      activityLevel: 'moderate',
      todayLog: { foods: [], exercises: [], water_intake: 0 }
    };
  }
}

// Map frontend budget IDs to planner keys
function mapBudgetToKey(budget) {
  const mapping = { budget: 'budget', economical: 'value', moderate: 'standard', premium: 'premium' };
  return mapping[budget] || 'standard';
}

// Main generate endpoint
router.post('/generate', auth, async (req, res) => {
  try {
    const { planType = 'daily', budget = 'moderate' } = req.body || {};
    const userProfile = await getUserProfileAndLog(getUserEmail(req));
    const key = mapBudgetToKey(budget);

    let plan;
    switch (planType) {
      case 'daily':
        plan = await planner.generateDailyPlan(userProfile, budget);
        break;
      case 'weekly':
        plan = await planner.generateWeeklyPlan(userProfile, budget);
        break;
      case 'workout':
        plan = planner.generateWorkoutPlan(userProfile);
        break;
      default:
        plan = await planner.generateDailyPlan(userProfile, budget);
    }

    // Handle different plan structures
    let meals = [];
    
    if (planType === 'weekly' && plan.week) {
      // Weekly plan structure: plan.week[].meals.{breakfast,lunch,dinner,snacks}
      const firstDay = plan.week[0] || {};
      const dayMeals = firstDay.meals || {};
      
      meals = ['breakfast', 'lunch', 'dinner', 'snacks'].map(meal => ({
        name: meal === 'snacks' ? 'Snack' : meal.charAt(0).toUpperCase() + meal.slice(1),
        description: dayMeals[meal]?.combo || `${meal.charAt(0).toUpperCase() + meal.slice(1)} for ${firstDay.day || 'Today'}`,
        calories: Number(dayMeals[meal]?.calories || 0),
        protein: Number(dayMeals[meal]?.protein || 0),
        time: '',
        foods: dayMeals[meal]?.foods || []
      }));
    } else if (planType === 'workout') {
      // Workout plan has no meals, return empty meals array
      meals = [];
    } else {
      // Daily plan structure: plan.{breakfast,lunch,dinner,snacks}
      const mk = (meal) => ({
        name: meal === 'snacks' ? 'Snack' : meal.charAt(0).toUpperCase() + meal.slice(1),
        description: plan[meal]?.tip || '',
        calories: Number(plan[meal]?.targetCalories || 0),
        protein: Number(plan[meal]?.targetProtein || 0),
        time: plan[meal]?.time || '',
        foods: (plan[meal]?.combos && plan[meal].combos.length > 0) ? plan[meal].combos : []
      });

      meals = ['breakfast', 'lunch', 'dinner', 'snacks'].map(m => mk(m));
    }

    const response = {
      planType,
      budget,
      meals,
      workouts: plan.workouts || [],
      tips: plan.tips || [],
      personalizedNote: plan.personalizedNote || '',
      // Add full weekly data for weekly plans
      week: plan.week || null,
      weeklyTips: plan.weeklyTips || [],
      shoppingList: plan.shoppingList || null,
      metadata: {
        country: plan.country || userProfile.country || 'local',
        economicClass: key,
        planType,
        budget,
        apiSourced: plan.apiSourced || {}
      }
    };

    res.json(response);
  } catch (err) {
    console.error('Planner generate error:', err);
    res.status(500).json({ error: 'Failed to generate meal plan' });
  }
});

// Convenience endpoints used by frontend
router.post('/daily', auth, async (req, res) => {
  try {
    const { budget = 'moderate' } = req.body || {};
    const userProfile = await getUserProfileAndLog(getUserEmail(req));
    const key = mapBudgetToKey(budget);

    const plan = await planner.generateDailyPlan(userProfile, budget);

    const meals = ['breakfast','lunch','dinner','snacks'].map(m => ({
      name: m === 'snacks' ? 'Snack' : m.charAt(0).toUpperCase() + m.slice(1),
      description: plan[m].tip || '',
      calories: Number(plan[m].targetCalories || 0),
      protein: Number(plan[m].targetProtein || 0),
      time: plan[m].time,
      foods: plan[m].combos || []
    }));

    res.json({
      planType: 'daily',
      budget,
      meals,
      tips: plan.tips || [],
      personalizedNote: plan.personalizedNote || '',
      metadata: { country: plan.country || userProfile.country || 'local', economicClass: key, planType: 'daily', budget, apiSourced: plan.apiSourced || {} }
    });
  } catch (err) {
    console.error('Planner daily error:', err);
    res.status(500).json({ error: 'Failed to generate daily plan' });
  }
});

router.post('/weekly', auth, async (req, res) => {
  try {
    const { budget = 'moderate' } = req.body || {};
    const userProfile = await getUserProfileAndLog(getUserEmail(req));
    const key = mapBudgetToKey(budget);

    const plan = await planner.generateWeeklyPlan(userProfile, budget);

    const response = {
      planType: 'weekly',
      meals: plan.weekPlan.map(day => ({
        name: day.day,
        description: `${day.theme} - ${day.focus}`,
        calories: day.targetCalories,
        protein: day.targetProtein,
        time: 'Full Day',
        foods: [
          { name: 'Breakfast', description: day.meals.breakfast.combo, calories: day.meals.breakfast.calories, protein: day.meals.breakfast.protein },
          { name: 'Lunch', description: day.meals.lunch.combo, calories: day.meals.lunch.calories, protein: day.meals.lunch.protein },
          { name: 'Dinner', description: day.meals.dinner.combo, calories: day.meals.dinner.calories, protein: day.meals.dinner.protein }
        ]
      })),
      tips: plan.weeklyTips || [],
      personalizedNote: `Weekly plan for ${userProfile.weightGoal} goal`,
      metadata: { country: userProfile.country || 'local', planType: 'weekly', shoppingList: plan.shoppingList || {} }
    };

    res.json(response);
  } catch (err) {
    console.error('Planner weekly error:', err);
    res.status(500).json({ error: 'Failed to generate weekly plan' });
  }
});

router.post('/workout', auth, async (req, res) => {
  try {
    const userProfile = await getUserProfileAndLog(getUserEmail(req));
    const plan = planner.generateWorkoutPlan(userProfile);

    const response = {
      planType: 'workout',
      meals: [],
      workouts: plan.workouts.map(w => ({ name: w.name, description: w.description, calories: w.calories, protein: w.duration, time: `${w.duration} min`, intensity: w.intensity, type: w.type })),
      tips: plan.tips || [],
      personalizedNote: plan.personalNote || '',
      metadata: { country: userProfile.country || 'local', planType: 'workout', focus: plan.focus || 'Balanced Fitness' }
    };

    res.json(response);
  } catch (err) {
    console.error('Planner workout error:', err);
    res.status(500).json({ error: 'Failed to generate workout plan' });
  }
});

// Temporary debug route (no auth) - returns a sample daily plan for debugging frontend mapping
router.get('/debug', async (_req, res) => {
  try {
    const sample = await planner.generateDailyPlan({ country: 'Local', goalCalories: 2000, proteinTarget: 100, weightGoal: 'maintain' }, 'moderate');
    // Expose the full sample plan so we can inspect fields in the frontend
    res.json({ ok: true, sample });
  } catch (err) {
    console.error('Planner debug error:', err);
    res.status(500).json({ error: 'Failed to produce debug plan' });
  }
});

// POST /api/planner/regenerate - Regenerate meal database for freshness
router.post('/regenerate', auth, async (req, res) => {
  try {
    regenerateMealDatabase();
    res.json({ 
      success: true, 
      message: 'Meal database regenerated with fresh combinations',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Planner regenerate error:', err);
    res.status(500).json({ error: 'Failed to regenerate meal database' });
  }
});

module.exports = router;
