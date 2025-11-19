// const express = require('express');
// const router = express.Router();
// const auth = require('../middleware/auth');
// const db = require('../db');

// // Helper to get or create today's log entry, ensuring camelCase properties
// const getTodaysLog = async (email) => {
//     const todayStr = new Date().toISOString().split('T')[0];
//     const selectQuery = `
//         SELECT id, user_email, date, foods, exercises, 
//                neat_activities AS "neatActivities", 
//                water_intake AS "waterIntake" 
//         FROM daily_logs 
//         WHERE user_email = $1 AND date = $2`;
//     let log = await db.query(selectQuery, [email, todayStr]);

//     if (log.rows.length === 0) {
//         const insertQuery = `
//             INSERT INTO daily_logs (user_email, date, foods, exercises, neat_activities, water_intake) 
//             VALUES ($1, $2, $3, $4, $5, $6) 
//             RETURNING id, user_email, date, foods, exercises, 
//                       neat_activities AS "neatActivities", 
//                       water_intake AS "waterIntake"`;
//         const newLog = await db.query(insertQuery, [email, todayStr, '[]', '[]', '[]', 0]);
//         return newLog.rows[0];
//     }
//     return log.rows[0];
// };

// // @route   GET api/data/user
// // @desc    Get all data for a logged-in user
// router.get('/user', auth, async (req, res) => {
//     try {
//         const email = req.user.email;
//         const userQuery = await db.query('SELECT email, last_name AS "lastName", weight, start_weight AS "startWeight", height, age, gender, country FROM users WHERE email = $1', [email]);
//         const goalsQuery = await db.query('SELECT target_weight AS "targetWeight", weight_goal AS "weightGoal", goal_timeline AS "goalTimeline" FROM user_goals WHERE user_email = $1', [email]);
//         const dailyLogsQuery = await db.query('SELECT date, foods, exercises, neat_activities AS "neatActivities", water_intake AS "waterIntake" FROM daily_logs WHERE user_email = $1 ORDER BY date ASC', [email]);
//         const weightLogQuery = await db.query('SELECT date, weight FROM weight_logs WHERE user_email = $1 ORDER BY date ASC', [email]);

//         res.json({
//             user: userQuery.rows[0],
//             userGoals: goalsQuery.rows[0],
//             dailyLogs: dailyLogsQuery.rows,
//             weightLog: weightLogQuery.rows
//         });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// });


// // @route   PUT api/data/goals
// // @desc    Update user goals
// router.put('/goals', auth, async (req, res) => {
//     const { targetWeight, weightGoal, goalTimeline } = req.body;
//     try {
//         const updatedGoalsQuery = await db.query(
//             'UPDATE user_goals SET target_weight = $1, weight_goal = $2, goal_timeline = $3 WHERE user_email = $4 RETURNING target_weight AS "targetWeight", weight_goal AS "weightGoal", goal_timeline AS "goalTimeline"',
//             [targetWeight, weightGoal, goalTimeline, req.user.email]
//         );
//         res.json(updatedGoalsQuery.rows[0]);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// });

// // @route   POST api/data/food
// // @desc    Add food items to today's log
// router.post('/food', auth, async (req, res) => {
//     const { foods } = req.body; // Expects an array of food objects
//     try {
//         const todayLog = await getTodaysLog(req.user.email);
//         const currentFoods = todayLog.foods || [];
//         const newFoods = [...currentFoods, ...foods];
//         const updatedLog = await db.query(
//             'UPDATE daily_logs SET foods = $1 WHERE id = $2 RETURNING *',
//             [JSON.stringify(newFoods), todayLog.id]
//         );
//         res.json({ success: true });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// });

// // @route   PUT api/data/food/:id
// // @desc    Update a food item in today's log
// router.put('/food/:id', auth, async (req, res) => {
//     const { id } = req.params;
//     const { name, calories } = req.body;
//     try {
//         const todayLog = await getTodaysLog(req.user.email);
//         const updatedFoods = todayLog.foods.map(f => f.id === id ? { ...f, name, calories } : f);
//         await db.query('UPDATE daily_logs SET foods = $1 WHERE id = $2', [JSON.stringify(updatedFoods), todayLog.id]);
//         res.json({ success: true });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// });

// // @route   DELETE api/data/food/:id
// // @desc    Delete a food item from today's log
// router.delete('/food/:id', auth, async (req, res) => {
//     const { id } = req.params;
//     try {
//         const todayLog = await getTodaysLog(req.user.email);
//         const updatedFoods = todayLog.foods.filter(f => f.id !== id);
//         await db.query('UPDATE daily_logs SET foods = $1 WHERE id = $2', [JSON.stringify(updatedFoods), todayLog.id]);
//         res.json({ msg: 'Food item removed' });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// });

// // @route   POST api/data/exercise
// // @desc    Add an exercise to today's log
// router.post('/exercise', auth, async (req, res) => {
//     const { exercise } = req.body;
//     try {
//         const todayLog = await getTodaysLog(req.user.email);
//         const currentExercises = todayLog.exercises || [];
//         const newExercises = [...currentExercises, exercise];
//         const updatedLog = await db.query(
//             'UPDATE daily_logs SET exercises = $1 WHERE id = $2 RETURNING *',
//             [JSON.stringify(newExercises), todayLog.id]
//         );
//         res.json({ success: true });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// });

// // @route   PUT api/data/exercise/:id
// // @desc    Update an exercise in today's log
// router.put('/exercise/:id', auth, async (req, res) => {
//     const { id } = req.params;
//     const { name, caloriesBurned } = req.body;
//     try {
//         const todayLog = await getTodaysLog(req.user.email);
//         const updatedExercises = todayLog.exercises.map(e => e.id === id ? { ...e, name, caloriesBurned } : e);
//         await db.query('UPDATE daily_logs SET exercises = $1 WHERE id = $2', [JSON.stringify(updatedExercises), todayLog.id]);
//         res.json({ success: true });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// });

// // @route   DELETE api/data/exercise/:id
// // @desc    Delete an exercise from today's log
// router.delete('/exercise/:id', auth, async (req, res) => {
//     const { id } = req.params;
//     try {
//         const todayLog = await getTodaysLog(req.user.email);
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
//         const todayLog = await getTodaysLog(req.user.email);
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
//         const todayLog = await getTodaysLog(req.user.email);
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
//         const todayLog = await getTodaysLog(req.user.email);
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
//         const todayLog = await getTodaysLog(req.user.email);
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


// module.exports = router;

// routes/data.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// Helper to parse stored JSON safely
const safeParseJson = (val, fallback) => {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
};

// Helper to get or create today's log entry, ensuring camelCase properties
const getTodaysLog = async (email) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const selectQuery = `
    SELECT id, user_email, date, foods, exercises, 
           neat_activities AS "neatActivities", 
           water_intake AS "waterIntake" 
    FROM daily_logs 
    WHERE user_email = $1 AND date = $2`;
  let log = await db.query(selectQuery, [email, todayStr]);

  if (log.rows.length === 0) {
    const insertQuery = `
      INSERT INTO daily_logs (user_email, date, foods, exercises, neat_activities, water_intake) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, user_email, date, foods, exercises, 
                neat_activities AS "neatActivities", 
                water_intake AS "waterIntake"`;
    const newLog = await db.query(insertQuery, [email, todayStr, JSON.stringify([]), JSON.stringify([]), JSON.stringify([]), 0]);
    // parse json columns if necessary
    const row = newLog.rows[0];
    row.foods = safeParseJson(row.foods, []);
    row.exercises = safeParseJson(row.exercises, []);
    row.neatActivities = safeParseJson(row.neatActivities, []);
    return row;
  }
  const existing = log.rows[0];
  existing.foods = safeParseJson(existing.foods, []);
  existing.exercises = safeParseJson(existing.exercises, []);
  existing.neatActivities = safeParseJson(existing.neatActivities, []);
  return existing;
};

// allow preflight for this router explicitly
router.options('*', (req, res) => res.sendStatus(204));

// @route   GET api/data/user
// @desc    Get all data for a logged-in user
router.get('/user', auth, async (req, res) => {
  try {
    const email = req.user.email;
    const userQuery = await db.query('SELECT email, last_name AS "lastName", weight, start_weight AS "startWeight", height, age, gender, country FROM users WHERE email = $1', [email]);
    const goalsQuery = await db.query('SELECT target_weight AS "targetWeight", weight_goal AS "weightGoal", goal_timeline AS "goalTimeline" FROM user_goals WHERE user_email = $1', [email]);
    const dailyLogsQuery = await db.query('SELECT date, foods, exercises, neat_activities AS "neatActivities", water_intake AS "waterIntake" FROM daily_logs WHERE user_email = $1 ORDER BY date ASC', [email]);
    const weightLogQuery = await db.query('SELECT date, weight FROM weight_logs WHERE user_email = $1 ORDER BY date ASC', [email]);

    // parse JSON columns
    const parsedDailyLogs = dailyLogsQuery.rows.map(r => ({
      ...r,
      foods: safeParseJson(r.foods, []),
      exercises: safeParseJson(r.exercises, []),
      neatActivities: safeParseJson(r.neatActivities, []),
    }));

    res.json({
      user: userQuery.rows[0],
      userGoals: goalsQuery.rows[0],
      dailyLogs: parsedDailyLogs,
      weightLog: weightLogQuery.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// other routes (goals, food, exercise, neat, water, search) remain the same but with safer JSON usage
// (I will include the same implementations you provided but using safeParseJson when reading)

router.put('/goals', auth, async (req, res) => {
  const { targetWeight, weightGoal, goalTimeline } = req.body;
  try {
    const updatedGoalsQuery = await db.query(
      'UPDATE user_goals SET target_weight = $1, weight_goal = $2, goal_timeline = $3 WHERE user_email = $4 RETURNING target_weight AS "targetWeight", weight_goal AS "weightGoal", goal_timeline AS "goalTimeline"',
      [targetWeight, weightGoal, goalTimeline, req.user.email]
    );
    res.json(updatedGoalsQuery.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add food
router.post('/food', auth, async (req, res) => {
  const { foods } = req.body; // Expects an array of food objects
  try {
    const todayLog = await getTodaysLog(req.user.email);
    const currentFoods = Array.isArray(todayLog.foods) ? todayLog.foods : [];
    const newFoods = [...currentFoods, ...foods];
    await db.query('UPDATE daily_logs SET foods = $1 WHERE id = $2', [JSON.stringify(newFoods), todayLog.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update food
router.put('/food/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { name, calories } = req.body;
  try {
    const todayLog = await getTodaysLog(req.user.email);
    const updatedFoods = (todayLog.foods || []).map(f => f.id === id ? { ...f, name, calories } : f);
    await db.query('UPDATE daily_logs SET foods = $1 WHERE id = $2', [JSON.stringify(updatedFoods), todayLog.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete food
router.delete('/food/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const todayLog = await getTodaysLog(req.user.email);
    const updatedFoods = (todayLog.foods || []).filter(f => f.id !== id);
    await db.query('UPDATE daily_logs SET foods = $1 WHERE id = $2', [JSON.stringify(updatedFoods), todayLog.id]);
    res.json({ msg: 'Food item removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Exercises and NEAT routes kept similar but using safe parsing and JSON updates
router.post('/exercise', auth, async (req, res) => {
  const { exercise } = req.body;
  try {
    const todayLog = await getTodaysLog(req.user.email);
    const currentExercises = Array.isArray(todayLog.exercises) ? todayLog.exercises : [];
    const newExercises = [...currentExercises, exercise];
    await db.query('UPDATE daily_logs SET exercises = $1 WHERE id = $2', [JSON.stringify(newExercises), todayLog.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/exercise/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { name, caloriesBurned } = req.body;
  try {
    const todayLog = await getTodaysLog(req.user.email);
    const updatedExercises = (todayLog.exercises || []).map(e => e.id === id ? { ...e, name, caloriesBurned } : e);
    await db.query('UPDATE daily_logs SET exercises = $1 WHERE id = $2', [JSON.stringify(updatedExercises), todayLog.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/exercise/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const todayLog = await getTodaysLog(req.user.email);
    const updatedExercises = (todayLog.exercises || []).filter(ex => ex.id !== id);
    await db.query('UPDATE daily_logs SET exercises = $1 WHERE id = $2', [JSON.stringify(updatedExercises), todayLog.id]);
    res.json({ msg: 'Exercise item removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/neat', auth, async (req, res) => {
  const newActivity = req.body;
  try {
    const todayLog = await getTodaysLog(req.user.email);
    const updatedActivities = [...(todayLog.neatActivities || []), newActivity];
    await db.query('UPDATE daily_logs SET neat_activities = $1 WHERE id = $2', [JSON.stringify(updatedActivities), todayLog.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/neat/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { calories } = req.body;
  try {
    const todayLog = await getTodaysLog(req.user.email);
    const updatedActivities = (todayLog.neatActivities || []).map(a => a.id === id ? { ...a, calories } : a);
    await db.query('UPDATE daily_logs SET neat_activities = $1 WHERE id = $2', [JSON.stringify(updatedActivities), todayLog.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/neat/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const todayLog = await getTodaysLog(req.user.email);
    const updatedActivities = (todayLog.neatActivities || []).filter(a => a.id !== id);
    await db.query('UPDATE daily_logs SET neat_activities = $1 WHERE id = $2', [JSON.stringify(updatedActivities), todayLog.id]);
    res.json({ msg: 'NEAT activity removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/water', auth, async (req, res) => {
  const { amount } = req.body;
  try {
    const todayLog = await getTodaysLog(req.user.email);
    const newTotal = (todayLog.waterIntake || 0) + amount;
    await db.query('UPDATE daily_logs SET water_intake = $1 WHERE id = $2', [newTotal, todayLog.id]);
    res.json({ waterIntake: newTotal });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/search/foods', auth, async (req, res) => {
  const { q } = req.query;
  try {
    const results = await db.query(
      `SELECT name, serving_size AS "servingUnit", calories, protein, carbohydrates, fat, sodium, sugar, fiber 
       FROM food_database 
       WHERE name ILIKE $1 LIMIT 10`,
      [`%${q}%`]
    );
    const formattedResults = results.rows.map(item => ({
      name: item.name,
      servingQuantity: 1,
      servingUnit: item.servingUnit,
      calories: item.calories,
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
    res.json(formattedResults);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/search/exercises', auth, async (req, res) => {
  const { q } = req.query;
  try {
    const results = await db.query(
      `SELECT name, calories_burned_per_30_min AS "caloriesBurned" 
       FROM exercise_database 
       WHERE name ILIKE $1 LIMIT 10`,
      [`%${q}%`]
    );
    const formattedResults = results.rows.map(item => ({
      name: item.name,
      caloriesBurned: item.caloriesBurned,
      duration: 30
    }));
    res.json(formattedResults);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
