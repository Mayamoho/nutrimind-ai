// routes/data.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// add helper to map DB problems to 503
const handleDbErrorResponse = (err, res) => {
  if (!err) return false;
  const code = err.code || '';
  if (code === 'DB_UNAVAILABLE' || code === 'ECONNREFUSED') {
    res.status(503).json({ error: 'Database unavailable. Try again later.' });
    return true;
  }
  return false;
};

// Helper to parse stored JSON safely
const safeParseJson = (val, fallback) => {
  if (!val) return fallback;
  // If it's already an object/array, return it directly
  if (typeof val === 'object' && !Array.isArray(val)) return val;
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return val;
  try {
    const parsed = JSON.parse(val);
    console.log('Parsed JSON from DB:', { original: val, parsed });
    return parsed;
  } catch (e) {
    console.error('JSON parse error:', { val, error: e.message });
    return fallback;
  }
};

// Helper to extract email from user object
const getUserEmail = (req) => {
  const email = req.user && (typeof req.user === 'object' ? req.user.email : req.user);
  if (!email) {
    throw new Error('User email not found in token');
  }
  return email;
};

/**
 * Get the "effective date" based on 6 AM day boundary
 * If it's before 6 AM, return yesterday's date
 * If it's 6 AM or later, return today's date
 */
const getEffectiveDate = (date = new Date()) => {
  // Use simple calendar date for consistency with AI Coach
  const dateString = date.toISOString().split('T')[0];
  
  console.log('Backend getEffectiveDate using calendar date:', dateString);
  return dateString;
};
  
  // ORIGINAL 6 AM LOGIC (commented out for testing)
  // const hour = date.getHours();
  // const dateString = date.toISOString().split('T')[0];
  // 
  // console.log('Backend getEffectiveDate:', { 
  //   currentTime: date.toISOString(), 
  //   hour, 
  //   dateString,
  //   before6AM: hour < 6 
  // });
  // 
  // // If before 6 AM, we're still in the previous day
  // if (hour < 6) {
  //   const yesterday = new Date(date);
  //   yesterday.setDate(yesterday.getDate() - 1);
  //   const result = yesterday.toISOString().split('T')[0];
  //   console.log('Backend using yesterday:', result);
  //   return result;
  // }
  // 
  // console.log('Backend using today:', dateString);
  // return dateString;

// Helper to get or create today's log entry, ensuring camelCase properties
// Uses 6 AM day boundary
const getTodaysLog = async (email) => {
  const todayStr = getEffectiveDate();
  const selectQuery = `
    SELECT id, user_email, date, foods, exercises, 
           neat_activities AS "neatActivities", 
           water_intake AS "waterIntake" 
    FROM daily_logs 
    WHERE user_email = $1 AND date = $2`;
  // Try to select first
  let log = await db.query(selectQuery, [email, todayStr]);

  if (log.rows.length === 0) {
    // Attempt to insert; if a concurrent request inserted first, the ON CONFLICT DO NOTHING
    // will prevent a duplicate-key error. If insert returns no rows, select the existing row.
    const insertQuery = `
      INSERT INTO daily_logs (user_email, date, foods, exercises, neat_activities, water_intake)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_email, date) DO NOTHING
      RETURNING id, user_email, date, foods, exercises, neat_activities AS "neatActivities", water_intake AS "waterIntake"`;

    const newLog = await db.query(insertQuery, [email, todayStr, JSON.stringify([]), JSON.stringify([]), JSON.stringify([]), 0]);

    if (newLog.rows.length > 0) {
      const row = newLog.rows[0];
      row.foods = safeParseJson(row.foods, []);
      row.exercises = safeParseJson(row.exercises, []);
      row.neatActivities = safeParseJson(row.neatActivities, []);
      return row;
    }

    // If we reach here, another request inserted the row first—select it now
    const existingQ = await db.query(selectQuery, [email, todayStr]);
    const existing = existingQ.rows[0];
    existing.foods = safeParseJson(existing.foods, []);
    existing.exercises = safeParseJson(existing.exercises, []);
    existing.neatActivities = safeParseJson(existing.neatActivities, []);
    return existing;
  }

  const existing = log.rows[0];
  existing.foods = safeParseJson(existing.foods, []);
  existing.exercises = safeParseJson(existing.exercises, []);
  existing.neatActivities = safeParseJson(existing.neatActivities, []);
  return existing;
};

// allow preflight for this router explicitly
router.options('*', (req, res) => res.sendStatus(204));

// --------------------------- SEARCH ROUTES ---------------------------

// @route   GET api/data/search/foods?q=...
// @desc    Search foods from local food_database (free/local)
router.get('/search/foods', auth, async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);

  try {
    const results = await db.query(
      `SELECT name, serving_size AS "servingUnit", calories, protein, carbohydrates, fat, 
              sodium, potassium, cholesterol, "vitaminA", "vitaminC", "vitaminD", 
              calcium, iron, magnesium, zinc, sugar, fiber
       FROM food_database
       WHERE name ILIKE $1
       ORDER BY name
       LIMIT 15`,
      [`%${q}%`]
    );

    let formattedResults = results.rows.map((item) => ({
      name: item.name,
      servingQuantity: 1,
      servingUnit: item.servingUnit || 'serving',
      calories: Number(item.calories) || 0,
      nutrients: {
        macros: [
          { name: 'Protein', amount: Number(item.protein) || 0, unit: 'g' },
          { name: 'Carbs', amount: Number(item.carbohydrates) || 0, unit: 'g' },
          { name: 'Fat', amount: Number(item.fat) || 0, unit: 'g' }
        ],
        micros: [
          { name: 'Fiber', amount: Math.round((item.fiber || 0) * 10) / 10, unit: 'g' },
          { name: 'Sugar', amount: Math.round((item.sugar || 0) * 10) / 10, unit: 'g' },
          { name: 'Sodium', amount: Math.round(item.sodium || 0), unit: 'mg' },
          { name: 'Potassium', amount: Math.round(item.potassium || 0), unit: 'mg' },
          { name: 'Cholesterol', amount: Math.round(item.cholesterol || 0), unit: 'mg' },
          { name: 'Vitamin A', amount: Math.round(item.vitaminA || 0), unit: 'mcg' },
          { name: 'Vitamin C', amount: Math.round(item.vitaminC || 0), unit: 'mg' },
          { name: 'Vitamin D', amount: Math.round(item.vitaminD || 0), unit: 'mcg' },
          { name: 'Calcium', amount: Math.round(item.calcium || 0), unit: 'mg' },
          { name: 'Iron', amount: Math.round((item.iron || 0) * 10) / 10, unit: 'mg' },
          { name: 'Magnesium', amount: Math.round(item.magnesium || 0), unit: 'mg' },
          { name: 'Zinc', amount: Math.round((item.zinc || 0) * 10) / 10, unit: 'mg' }
        ]
      }
    }));

    // If local DB returns few results, supplement with aggregated free datasets
    if (formattedResults.length < 6) {
      try {
        const agg = require('../services/foodAggregatorService');
        const extra = await agg.searchFood(q, req.query.country || 'world');
        const mapped = (extra || []).map(e => ({
          name: e.name,
          servingQuantity: e.servingQuantity || 1,
          servingUnit: e.servingUnit || 'serving',
          calories: Number(e.calories) || 0,
          nutrients: {
            macros: [
              { name: 'Protein', amount: Number(e.protein) || 0, unit: 'g' },
              { name: 'Carbs', amount: Number(e.carbs) || 0, unit: 'g' },
              { name: 'Fat', amount: Number(e.fat) || 0, unit: 'g' }
            ],
            micros: e.nutrients?.micros || [
              { name: 'Fiber', amount: Math.round((e.fiber || 0) * 10) / 10, unit: 'g' },
              { name: 'Sugar', amount: Math.round((e.sugar || 0) * 10) / 10, unit: 'g' },
              { name: 'Sodium', amount: Math.round(e.sodium || 0), unit: 'mg' },
              { name: 'Potassium', amount: Math.round(e.potassium || 0), unit: 'mg' },
              { name: 'Cholesterol', amount: Math.round(e.cholesterol || 0), unit: 'mg' },
              { name: 'Vitamin A', amount: Math.round(e.vitaminA || 0), unit: 'mcg' },
              { name: 'Vitamin C', amount: Math.round(e.vitaminC || 0), unit: 'mg' },
              { name: 'Vitamin D', amount: Math.round(e.vitaminD || 0), unit: 'mcg' },
              { name: 'Calcium', amount: Math.round(e.calcium || 0), unit: 'mg' },
              { name: 'Iron', amount: Math.round((e.iron || 0) * 10) / 10, unit: 'mg' },
              { name: 'Magnesium', amount: Math.round(e.magnesium || 0), unit: 'mg' },
              { name: 'Zinc', amount: Math.round((e.zinc || 0) * 10) / 10, unit: 'mg' }
            ]
          }
        }));
        // Append new items, avoiding duplicates
        const existing = new Set(formattedResults.map(r => r.name.toLowerCase()));
        for (const m of mapped) {
          if (!existing.has(m.name.toLowerCase())) formattedResults.push(m);
        }
      } catch (e) { console.warn('Supplement local food search with aggregator failed:', e.message || e); }
    }

    return res.json(formattedResults);
  } catch (err) {
    if (handleDbErrorResponse(err, res)) return;
    console.error('Food search error:', err);
    return res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET api/data/search/exercises?q=...
// @desc    Search exercises from a small in-memory list (free/local)
router.get('/search/exercises', auth, async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q) return res.json([]);

  // Keep this list small and predictable; frontend already has a richer local database.
  const EXERCISE_LIBRARY = [
    { name: 'Walking', caloriesBurned: 120 },
    { name: 'Brisk Walking', caloriesBurned: 150 },
    { name: 'Jogging', caloriesBurned: 240 },
    { name: 'Running', caloriesBurned: 330 },
    { name: 'Cycling', caloriesBurned: 260 },
    { name: 'Swimming', caloriesBurned: 300 },
    { name: 'Yoga', caloriesBurned: 90 },
    { name: 'Strength Training', caloriesBurned: 180 },
    { name: 'HIIT', caloriesBurned: 360 },
    { name: 'Dancing', caloriesBurned: 200 }
  ];

  const matches = EXERCISE_LIBRARY
    .filter((e) => e.name.toLowerCase().includes(q))
    .slice(0, 15)
    .map((e) => ({ name: e.name, caloriesBurned: e.caloriesBurned, duration: 30 }));

  return res.json(matches);
});

// @route   GET api/data/user
// @desc    Get all data for a logged-in user
router.get('/user', auth, async (req, res) => {
  try {
    const email = getUserEmail(req);

    const userQuery = await db.query(
      `SELECT email, last_name AS "lastName", weight, start_weight AS "startWeight",
              height, age, gender, country
       FROM users WHERE email = $1`,
      [email]
    );

    // If the user is missing, this is fatal
    const user = userQuery.rows[0];
    if (!user) {
      return res.status(400).json({ error: "User not found in database." });
    }

    const goalsQuery = await db.query(
      `SELECT target_weight AS "targetWeight",
              weight_goal AS "weightGoal",
              goal_timeline AS "goalTimeline"
       FROM user_goals WHERE user_email = $1`,
      [email]
    );

    // FALLBACK GOALS if not found
    const userGoals =
      goalsQuery.rows[0] || {
        targetWeight: user.weight,
        weightGoal: "maintain",
        goalTimeline: 12
      };

    const dailyLogsQuery = await db.query(
      `SELECT date, foods, exercises,
              neat_activities AS "neatActivities",
              water_intake AS "waterIntake"
       FROM daily_logs
       WHERE user_email = $1 ORDER BY date ASC`,
      [email]
    );

    // Parse daily logs and deduplicate by date
    const logsMap = new Map();
    console.log('Processing daily logs from backend:', { 
      totalLogs: dailyLogsQuery.rows.length,
      logDetails: dailyLogsQuery.rows.map(r => ({ 
        date: r.date, 
        foodCount: r.foods ? (typeof r.foods === 'string' ? JSON.parse(r.foods || '[]') : r.foods || []).length : 0 
      }))
    });
    
    dailyLogsQuery.rows.forEach(r => {
      const dateKey = r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date;
      if (!logsMap.has(dateKey)) {
        const foods = safeParseJson(r.foods, []);
        const exercises = safeParseJson(r.exercises, []);
        const neatActivities = safeParseJson(r.neatActivities, []);
        console.log('Retrieved log for date:', { dateKey, foods, exercises, neatActivities });
        logsMap.set(dateKey, {
          date: dateKey,
          foods,
          exercises,
          neatActivities,
          waterIntake: r.waterIntake || 0,
        });
      }
    });

    // Ensure today's log exists in database (using 6 AM boundary)
    const todayStr = getEffectiveDate();
    if (!logsMap.has(todayStr)) {
      const todayLog = await getTodaysLog(email);
      logsMap.set(todayStr, {
        date: todayStr,
        foods: todayLog.foods || [],
        exercises: todayLog.exercises || [],
        neatActivities: todayLog.neatActivities || [],
        waterIntake: todayLog.waterIntake || 0,
      });
    }

    const parsedDailyLogs = Array.from(logsMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Remove the flawed deduplication logic - keep all logs as-is
    const finalDailyLogs = parsedDailyLogs;

    // Weight log fallback
    const weightLogQuery = await db.query(
      `SELECT date, weight
       FROM weight_logs WHERE user_email = $1 ORDER BY date ASC`,
      [email]
    );

    const weightLog =
      weightLogQuery.rows.length > 0
        ? weightLogQuery.rows.map(w => ({
            date: w.date instanceof Date ? w.date.toISOString().split('T')[0] : w.date,
            weight: parseFloat(w.weight)
          }))
        : [{ date: todayStr, weight: parseFloat(user.weight) || 70 }];

    // Send robust final data
    res.json({
      user,
      userGoals,
      dailyLogs: finalDailyLogs,
      weightLog
    });

  } catch (err) {
    if (handleDbErrorResponse(err, res)) return;
    console.error("DATA USER ERROR:", err);
    res.status(500).send("Server Error");
  }
});


// @route   PUT api/data/goals
// @desc    Update user goals
router.put('/goals', auth, async (req, res) => {
  const { targetWeight, weightGoal, goalTimeline } = req.body;
  try {
    const updatedGoalsQuery = await db.query(
      'UPDATE user_goals SET target_weight = $1, weight_goal = $2, goal_timeline = $3 WHERE user_email = $4 RETURNING target_weight AS "targetWeight", weight_goal AS "weightGoal", goal_timeline AS "goalTimeline"',
      [targetWeight, weightGoal, goalTimeline, getUserEmail(req)]
    );
    res.json(updatedGoalsQuery.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --------------------------- ADDED HELPERS ---------------------------

// Simple country -> budget heuristic (very small static list; adjust as needed)
const HIGH_INCOME_COUNTRIES = new Set([
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 'Japan', 'Sweden', 'Norway', 'Netherlands'
]);

/**
 * Infer a simple budget class from the user's country.
 * Returns 'rich' or 'economy' (used to bias meal combos).
 */
const inferBudgetClassFromCountry = (country) => {
  if (!country) return 'economy';
  return HIGH_INCOME_COUNTRIES.has(country) ? 'rich' : 'economy';
};

/**
 * Aggregate nutrients from an array of food entries.
 * Each food is expected to optionally include calories and nutrients.macros entries.
 */
const aggregateFoods = (foods = []) => {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, count: 0 };
  foods.forEach(f => {
    totals.count += 1;
    if (typeof f.calories === 'number') totals.calories += f.calories;
    const macros = (f.nutrients && f.nutrients.macros) || [];
    macros.forEach(m => {
      const name = (m.name || '').toLowerCase();
      const amount = Number(m.amount) || 0;
      if (name.includes('protein')) totals.protein += amount;
      if (name.includes('carb')) totals.carbs += amount;
      if (name.includes('fat')) totals.fat += amount;
    });
    // try fiber from micros if present
    const micros = (f.nutrients && f.nutrients.micros) || [];
    micros.forEach(m => {
      const name = (m.name || '').toLowerCase();
      const amount = Number(m.amount) || 0;
      if (name.includes('fiber')) totals.fiber += amount;
    });
  });
  return totals;
};

/**
 * Build human readable analysis for a food result, basic "why / why not".
 * Uses nutrient thresholds to craft messages.
 */
const analyzeFoodForUser = (food, deficits, user, countryHint, budgetClass) => {
  const reasons = [];
  const warnings = [];

  // Simple checks on macros
  const macros = (food.nutrients && food.nutrients.macros) || [];
  const getMacro = (label) => {
    const m = macros.find(x => (x.name || '').toLowerCase().includes(label));
    return m ? Number(m.amount) || 0 : 0;
  };
  const protein = getMacro('protein');
  const fiber = ((food.nutrients && food.nutrients.micros) || []).reduce((acc, mm) => acc + ((mm.name || '').toLowerCase().includes('fiber') ? (Number(mm.amount) || 0) : 0), 0);
  const calories = Number(food.calories) || 0;

  if (protein >= 8 && deficits.protein > 0) reasons.push(`Good protein source (+${protein}g) to help meet your protein target (~${Math.round(deficits.protein + (user.weight ? user.weight * 0.8 : 0))}g).`);
  if (fiber >= 3 && deficits.fiber > 0) reasons.push(`Contains fiber (${fiber}g) which supports satiety and gut health.`);
  if (calories > 0 && deficits.calories > 0 && calories <= deficits.calories + 150) reasons.push(`Fits into remaining caloric allowance (~${Math.round(deficits.calories)} kcal left).`);
  if ((food.name || '').toLowerCase().includes(countryHint.toLowerCase())) reasons.push(`Matches your region's cuisine (${countryHint}) — likely familiar and seasonally available.`);

  // Budget hints
  if (budgetClass === 'economy' && (food.source || '').toLowerCase().includes('local')) {
    reasons.push('Locally-sourced / local DB result — often more budget-friendly.');
  }

  // Simple warnings
  if (calories > 600) warnings.push('High in calories — portion control advised.');
  const sugar = ((food.nutrients && food.nutrients.micros) || []).reduce((acc, mm) => acc + ((mm.name || '').toLowerCase().includes('sugar') ? (Number(mm.amount) || 0) : 0), 0);
  if (sugar > 15) warnings.push('High sugar content — avoid if reducing sugar intake.');
  const sodium = ((food.nutrients && food.nutrients.micros) || []).reduce((acc, mm) => acc + ((mm.name || '').toLowerCase().includes('sodium') ? (Number(mm.amount) || 0) : 0), 0);
  if (sodium > 800) warnings.push('High sodium — avoid if watching blood pressure.');

  const analysis = [];
  if (reasons.length) analysis.push('Why eat it: ' + reasons.join(' '));
  if (warnings.length) analysis.push('Why avoid / caution: ' + warnings.join(' '));
  if (!reasons.length && !warnings.length) analysis.push('Balanced choice; check portion sizes and your personal preferences.');

  return {
    food,
    analysis: analysis.join(' ')
  };
};

/**
 * Generate suggestions and simple meal combos for a user.
 * - uses historical foods from DB (daily_logs)
 * - uses today's log to compute deficits vs. a simple protein target of 0.8g/kg
 * - queries foodAggregatorService for candidate foods (falls back to local DB)
 */
const generateSuggestionsAndMeals = async (email) => {
  // load user
  const userQ = await db.query('SELECT email, country, weight FROM users WHERE email = $1', [email]);
  const user = userQ.rows[0] || { email, country: '', weight: null };
  const country = user.country || 'local';

  // collect all historical foods to get favorites and ingredient patterns
  const hist = await db.query('SELECT foods FROM daily_logs WHERE user_email = $1', [email]);
  const allFoods = [];
  hist.rows.forEach(r => {
    const parsed = safeParseJson(r.foods, []);
    parsed.forEach(f => allFoods.push(f));
  });

  // today's log
  const todayLog = await getTodaysLog(email);
  const todaysFoods = Array.isArray(todayLog.foods) ? todayLog.foods : [];

  // aggregate
  const histAgg = aggregateFoods(allFoods);
  const todayAgg = aggregateFoods(todaysFoods);

  // protein target heuristic: 0.8g per kg (fallback 60kg)
  const weight = parseFloat(user.weight) || 60;
  const proteinTarget = weight * 0.8;
  const calorieTarget = 2000; // simple default, frontend may override
  const fiberTarget = 25;

  const deficits = {
    protein: Math.max(0, proteinTarget - todayAgg.protein),
    calories: Math.max(0, calorieTarget - todayAgg.calories),
    fiber: Math.max(0, fiberTarget - todayAgg.fiber)
  };

  // Prepare queries to food APIs: prioritize country cuisine + nutrient needs
  const foodAggregator = require('../services/foodAggregatorService');
  const queries = [];
  if (deficits.protein > 10) queries.push(`${country} fish`, `${country} legumes`, 'chicken breast', 'tofu');
  if (deficits.fiber > 5) queries.push(`${country} vegetables`, 'beans', 'whole grains', 'lentils');
  if (deficits.calories > 200) queries.push(`${country} hearty meal`, 'starchy vegetables', 'rice and beans');

  // De-duplicate queries
  const qset = Array.from(new Set(queries)).slice(0, 6);
  let candidates = [];
  for (const q of qset) {
    try {
      const res = await foodAggregator.searchFood(q);
      if (Array.isArray(res) && res.length) {
        candidates = candidates.concat(res.slice(0, 6));
      }
    } catch (e) {
      // ignore individual API failures
    }
  }

  // If still empty, fallback to local DB
  if (!candidates.length) {
    try {
      const dbRes = await db.query(
        `SELECT name, serving_size AS "servingUnit", calories, protein, carbohydrates, fat, sodium, sugar, fiber 
         FROM food_database 
         WHERE name ILIKE $1 LIMIT 12`,
        [`%${country}%`]
      );
      candidates = dbRes.rows.map(item => ({
        name: item.name,
        servingQuantity: 1,
        servingUnit: item.servingUnit,
        calories: item.calories,
        source: 'Local',
        nutrients: {
          macros: [
            { name: 'Protein', amount: item.protein, unit: 'g' },
            { name: 'Carbs', amount: item.carbohydrates, unit: 'g' },
            { name: 'Fat', amount: item.fat, unit: 'g' }
          ],
          micros: [
            { name: 'Sodium', amount: item.sodium, unit: 'mg' },
            { name: 'Sugar', amount: item.sugar, unit: 'g' },
            { name: 'Fiber', amount: item.fiber, unit: 'g' }
          ]
        }
      }));
    } catch (dbErr) {
      // Missing table or other DB error: fallback to a small built-in list
      console.warn('Suggestion generation DB fallback, using built-in food list:', dbErr && (dbErr.message || dbErr));
      const builtin = [
        { name: 'Rice', calories: 130, nutrients: { macros: [{ name: 'Protein', amount: 2.7 }] } },
        { name: 'Chicken Breast', calories: 165, nutrients: { macros: [{ name: 'Protein', amount: 31 }] } },
        { name: 'Lentils', calories: 116, nutrients: { macros: [{ name: 'Protein', amount: 9 }] } },
        { name: 'Oatmeal', calories: 389, nutrients: { macros: [{ name: 'Protein', amount: 17 }] } },
        { name: 'Egg', calories: 155, nutrients: { macros: [{ name: 'Protein', amount: 13 }] } }
      ];
      candidates = builtin;
    }
  }

  // Create analyzed suggestions
  const budgetClass = inferBudgetClassFromCountry(country);
  const suggestions = candidates.slice(0, 6).map(c => analyzeFoodForUser(c, deficits, user, country, budgetClass));

  // Build meal planner combos (country + budget + categories)
  // Simple example combos: 'rich + fish + vegetables' or 'economy + legumes + greens'
  const combos = [];
  const countryKey = country || 'local';
  if (budgetClass === 'rich') {
    combos.push({
      title: `${countryKey} + fish + vegetables`,
      description: `A balanced combo emphasizing protein and fresh produce popular in ${countryKey}. Often higher-cost ingredients but nutrient-dense.`,
      exampleComponents: ['Grilled fish', 'Roasted seasonal vegetables', 'Whole grain side']
    });
    combos.push({
      title: `${countryKey} + lean meat + salad`,
      description: 'Lean protein with leafy greens; good for muscle maintenance and micronutrients.',
      exampleComponents: ['Chicken or fish', 'Mixed salad', 'Light dressing']
    });
  } else {
    combos.push({
      title: `${countryKey} + legumes + vegetables`,
      description: `Budget-friendly plant-forward combo that provides protein and fiber using locally accessible ingredients for ${countryKey}.`,
      exampleComponents: ['Stewed beans/lentils', 'Stir-fried vegetables', 'Rice or local staple']
    });
    combos.push({
      title: `${countryKey} + eggs + greens`,
      description: 'Low-cost, high-quality protein and greens — simple and nutritious.',
      exampleComponents: ['Boiled or scrambled eggs', 'Sautéed greens', 'Whole grain toast or staple']
    });
  }

  return {
    suggestions,
    mealPlanner: {
      combos,
      metadata: {
        country: countryKey,
        budgetClass,
        todayAggregates: todayAgg,
        historicalAggregates: histAgg,
        deficits,
        proteinTarget
      }
    }
  };
};
// --------------------------- END HELPERS ---------------------------

// --- REPLACE: POST /food route to include suggestions in response ---
router.post('/food', auth, async (req, res) => {
  const { foods } = req.body; // Expects an array of food objects
  
  // Validate foods array
  if (!Array.isArray(foods)) {
    return res.status(400).json({ message: 'Foods must be an array' });
  }
  
  // Validate each food object
  const validatedFoods = foods.map(food => {
    const validated = {
      ...food,
      calories: Number(food.calories) || 0
    };
    
    // Validate nutrients structure if it exists
    if (food.nutrients) {
      validated.nutrients = {
        macros: Array.isArray(food.nutrients.macros) 
          ? food.nutrients.macros.map(macro => ({
              ...macro,
              amount: Number(macro.amount) || 0
            }))
          : [],
        micros: Array.isArray(food.nutrients.micros)
          ? food.nutrients.micros.map(micro => ({
              ...micro,
              amount: Number(micro.amount) || 0
            }))
          : []
      };
    }
    
    return validated;
  });
  
  try {
    const todayLog = await getTodaysLog(getUserEmail(req));
    const currentFoods = Array.isArray(todayLog.foods) ? todayLog.foods : [];
    const newFoods = [...currentFoods, ...validatedFoods];
    console.log('Storing foods:', { validatedFoods, currentFoods, newFoods });
    await db.query('UPDATE daily_logs SET foods = $1 WHERE id = $2', [JSON.stringify(newFoods), todayLog.id]);

    // Generate suggestions and meal plans (non-blocking if it fails)
    try {
      const suggestions = await generateSuggestionsAndMeals(getUserEmail(req));
      return res.json({ success: true, suggestions });
    } catch (sgErr) {
      console.error('Suggestion generation failed:', sgErr);
      return res.json({ success: true });
    }
  } catch (err) {
    if (handleDbErrorResponse(err, res)) return;
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
// --- end replacement ---

router.put('/exercise/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { name, caloriesBurned } = req.body || {};
  try {
    const todayLog = await getTodaysLog(getUserEmail(req));
    const currentExercises = Array.isArray(todayLog.exercises) ? todayLog.exercises : [];
    const updatedExercises = currentExercises.map((e) => (
      String(e.id) === String(id)
        ? { ...e, ...(name !== undefined ? { name } : {}), ...(caloriesBurned !== undefined ? { caloriesBurned } : {}) }
        : e
    ));
    await db.query('UPDATE daily_logs SET exercises = $1 WHERE id = $2', [JSON.stringify(updatedExercises), todayLog.id]);
    return res.json({ success: true });
  } catch (err) {
    if (handleDbErrorResponse(err, res)) return;
    console.error('Update exercise error:', err);
    return res.status(500).json({ error: 'Server Error' });
  }
});

router.delete('/exercise/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const todayLog = await getTodaysLog(getUserEmail(req));
    const currentExercises = Array.isArray(todayLog.exercises) ? todayLog.exercises : [];
    const updatedExercises = currentExercises.filter((e) => String(e.id) !== String(id));
    await db.query('UPDATE daily_logs SET exercises = $1 WHERE id = $2', [JSON.stringify(updatedExercises), todayLog.id]);
    return res.json({ success: true });
  } catch (err) {
    if (handleDbErrorResponse(err, res)) return;
    console.error('Delete exercise error:', err);
    return res.status(500).json({ error: 'Server Error' });
  }
});

router.post('/neat', auth, async (req, res) => {
  const newActivity = req.body;
  try {
    const todayLog = await getTodaysLog(getUserEmail(req));
    const currentActivities = Array.isArray(todayLog.neatActivities) ? todayLog.neatActivities : [];
    const updatedActivities = [...currentActivities, newActivity];
    await db.query('UPDATE daily_logs SET neat_activities = $1 WHERE id = $2', [JSON.stringify(updatedActivities), todayLog.id]);
    return res.json({ success: true });
  } catch (err) {
    if (handleDbErrorResponse(err, res)) return;
    console.error('Add NEAT error:', err);
    return res.status(500).json({ error: 'Server Error' });
  }
});

router.put('/neat/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { calories } = req.body || {};
  try {
    const todayLog = await getTodaysLog(getUserEmail(req));
    const currentActivities = Array.isArray(todayLog.neatActivities) ? todayLog.neatActivities : [];
    const updatedActivities = currentActivities.map((a) => (
      String(a.id) === String(id) ? { ...a, ...(calories !== undefined ? { calories } : {}) } : a
    ));
    await db.query('UPDATE daily_logs SET neat_activities = $1 WHERE id = $2', [JSON.stringify(updatedActivities), todayLog.id]);
    return res.json({ success: true });
  } catch (err) {
    if (handleDbErrorResponse(err, res)) return;
    console.error('Update NEAT error:', err);
    return res.status(500).json({ error: 'Server Error' });
  }
});

router.delete('/neat/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const todayLog = await getTodaysLog(getUserEmail(req));
    const currentActivities = Array.isArray(todayLog.neatActivities) ? todayLog.neatActivities : [];
    const updatedActivities = currentActivities.filter((a) => String(a.id) !== String(id));
    await db.query('UPDATE daily_logs SET neat_activities = $1 WHERE id = $2', [JSON.stringify(updatedActivities), todayLog.id]);
    return res.json({ success: true });
  } catch (err) {
    if (handleDbErrorResponse(err, res)) return;
    console.error('Delete NEAT error:', err);
    return res.status(500).json({ error: 'Server Error' });
  }
});

router.post('/water', auth, async (req, res) => {
  const { amount } = req.body || {};
  try {
    // Validate incoming amount (expected in ml)
    if (amount === undefined || amount === null) return res.status(400).json({ error: 'Amount is required' });
    let inc = Number(amount);
    if (Number.isNaN(inc)) return res.status(400).json({ error: 'Invalid amount' });

    // Accept floats but round to integer milliliters
    inc = Math.round(inc);
    if (inc < 0) return res.status(400).json({ error: 'Amount must be non-negative' });
    if (inc > 10000) return res.status(400).json({ error: 'Amount too large' }); // >10L is suspicious

    const todayLog = await getTodaysLog(getUserEmail(req));
    const current = Number(todayLog.waterIntake) || 0;
    const newTotal = current + inc;

    // Guard against unreasonable totals (e.g., >100L)
    if (newTotal > 100000) return res.status(400).json({ error: 'Resulting total too large' });

    await db.query('UPDATE daily_logs SET water_intake = $1 WHERE id = $2', [newTotal, todayLog.id]);
    return res.json({ success: true, waterIntake: newTotal });
  } catch (err) {
    if (handleDbErrorResponse(err, res)) return;
    console.error('Add water error:', err);
    return res.status(500).json({ error: 'Server Error' });
  }
});

// @route   PUT api/data/food/:id
// @desc    Update a food entry in today's log
router.put('/food/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { name, calories } = req.body || {};
  try {
    const todayLog = await getTodaysLog(getUserEmail(req));
    const currentFoods = Array.isArray(todayLog.foods) ? todayLog.foods : [];
    const updatedFoods = currentFoods.map((f) => (String(f.id) === String(id) ? { ...f, ...(name !== undefined ? { name } : {}), ...(calories !== undefined ? { calories } : {}) } : f));
    await db.query('UPDATE daily_logs SET foods = $1 WHERE id = $2', [JSON.stringify(updatedFoods), todayLog.id]);
    return res.json({ success: true });
  } catch (err) {
    if (handleDbErrorResponse(err, res)) return;
    console.error('Update food error:', err);
    return res.status(500).json({ error: 'Server Error' });
  }
});

// @route   DELETE api/data/food/:id
// @desc    Delete a food entry from today's log
router.delete('/food/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const todayLog = await getTodaysLog(getUserEmail(req));
    const currentFoods = Array.isArray(todayLog.foods) ? todayLog.foods : [];
    const updatedFoods = currentFoods.filter((f) => String(f.id) !== String(id));
    await db.query('UPDATE daily_logs SET foods = $1 WHERE id = $2', [JSON.stringify(updatedFoods), todayLog.id]);
    return res.json({ success: true });
  } catch (err) {
    if (handleDbErrorResponse(err, res)) return;
    console.error('Delete food error:', err);
    return res.status(500).json({ error: 'Server Error' });
  }
});

// --- REPLACE: POST /exercise route to include suggestions in response ---
router.post('/exercise', auth, async (req, res) => {
  const { exercise } = req.body;
  try {
    const todayLog = await getTodaysLog(getUserEmail(req));
    const currentExercises = Array.isArray(todayLog.exercises) ? todayLog.exercises : [];
    const newExercises = [...currentExercises, exercise];
    await db.query('UPDATE daily_logs SET exercises = $1 WHERE id = $2', [JSON.stringify(newExercises), todayLog.id]);

    // After logging exercise, regenerate suggestions because caloric/macro needs may change
    try {
      const suggestions = await generateSuggestionsAndMeals(getUserEmail(req));
      return res.json({ success: true, suggestions });
    } catch (sgErr) {
      console.error('Suggestion generation after exercise failed:', sgErr);
      return res.json({ success: true });
    }
  } catch (err) {
    if (handleDbErrorResponse(err, res)) return;
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
// --- end replacement ---

// // @route   DELETE api/data/exercise/:id
// // @desc    Delete an exercise from today's log
// router.delete('/exercise/:id', auth, async (req, res) => {
//     const { id } = req.params;
//     try {
//         const todayLog = await getTodaysLog(getUserEmail(req));
//         const updatedExercises = todayLog.exercises.filter(ex => ex.id !== id);
//         await db.query('UPDATE daily_logs SET exercises = $1 WHERE id = $2', [JSON.stringify(updatedExercises), todayLog.id]);
//         res.json({ msg: 'Exercise item removed' });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// });


// // Add/Update/Remove for NEAT
// router.post('/neat', auth, async (req, res) => {
//     const newActivity = req.body;
//     try {
//         const todayLog = await getTodaysLog(getUserEmail(req));
//         const updatedActivities = [...(todayLog.neatActivities || []), newActivity];
//         await db.query('UPDATE daily_logs SET neat_activities = $1 WHERE id = $2', [JSON.stringify(updatedActivities), todayLog.id]);
//         res.json({ success: true });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// });

// router.put('/neat/:id', auth, async (req, res) => {
//     const { id } = req.params;
//     const { calories } = req.body;
//     try {
//         const todayLog = await getTodaysLog(getUserEmail(req));
//         const updatedActivities = todayLog.neatActivities.map(a => a.id === id ? { ...a, calories } : a);
//         await db.query('UPDATE daily_logs SET neat_activities = $1 WHERE id = $2', [JSON.stringify(updatedActivities), todayLog.id]);
//         res.json({ success: true });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// });

// router.delete('/neat/:id', auth, async (req, res) => {
//     const { id } = req.params;
//     try {
//         const todayLog = await getTodaysLog(getUserEmail(req));
//         const updatedActivities = todayLog.neatActivities.filter(a => a.id !== id);
//         await db.query('UPDATE daily_logs SET neat_activities = $1 WHERE id = $2', [JSON.stringify(updatedActivities), todayLog.id]);
//         res.json({ msg: 'NEAT activity removed' });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// });

// // Water intake
// router.post('/water', auth, async (req, res) => {
//     const { amount } = req.body;
//     try {
//         const todayLog = await getTodaysLog(getUserEmail(req));
//         const newTotal = (todayLog.waterIntake || 0) + amount;
//         await db.query('UPDATE daily_logs SET water_intake = $1 WHERE id = $2', [newTotal, todayLog.id]);
//         res.json({ waterIntake: newTotal });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// });

// // Search routes
// router.get('/search/foods', auth, async (req, res) => {
//     const { q } = req.query;
//     try {
//         const results = await db.query(
//             `SELECT name, serving_size AS "servingUnit", calories, protein, carbohydrates, fat, sodium, sugar, fiber 
//              FROM food_database 
//              WHERE name ILIKE $1 LIMIT 10`,
//             [`%${q}%`]
//         );
//         // Transform to match front-end structure
//         const formattedResults = results.rows.map(item => ({
//             name: item.name,
//             servingQuantity: 1,
//             servingUnit: item.servingUnit,
//             calories: item.calories,
//             nutrients: {
//                 macros: [
//                     { name: 'Protein', amount: item.protein, unit: 'g' },
//                     { name: 'Carbs', amount: item.carbohydrates, unit: 'g' },
//                     { name: 'Fat', amount: item.fat, unit: 'g' }
//                 ],
//                 micros: [
//                     { name: 'Sodium', amount: item.sodium, unit: 'mg' },
//                     { name: 'Sugar', amount: item.sugar, unit: 'g' },
//                     { name: 'Fiber', amount: item.fiber, unit: 'g' }
//                 ]
//             }
//         }));
//         res.json(formattedResults);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// });

// router.get('/search/exercises', auth, async (req, res) => {
//     const { q } = req.query;
//     try {
//         const results = await db.query(
//             `SELECT name, calories_burned_per_30_min AS "caloriesBurned" 
//              FROM exercise_database 
//              WHERE name ILIKE $1 LIMIT 10`,
//             [`%${q}%`]
//         );
//          const formattedResults = results.rows.map(item => ({
//             name: item.name,
//             caloriesBurned: item.caloriesBurned,
//             duration: 30
//         }));
//         res.json(formattedResults);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// });


// @route   POST api/data/weight
// @desc    Add or update weight log entry
router.post('/weight', auth, async (req, res) => {
  const { date, weight } = req.body;
  const email = getUserEmail(req);
  
  // Validate inputs
  if (!date || weight === null || weight === undefined || isNaN(weight)) {
    return res.status(400).json({ message: 'Date and valid weight are required' });
  }
  
  try {
    // Upsert weight log entry
    await db.query(
      `INSERT INTO weight_logs (user_email, date, weight)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_email, date) DO UPDATE SET weight = $3`,
      [email, date, weight]
    );
    
    // Also update user's current weight
    await db.query(
      `UPDATE users SET weight = $1 WHERE email = $2`,
      [weight, email]
    );
    
    res.json({ success: true, date, weight });
  } catch (err) {
    if (handleDbErrorResponse(err, res)) return;
    console.error('Weight log error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
