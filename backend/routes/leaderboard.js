/**
 * Leaderboard Routes
 * Provides aggregated user statistics for the community leaderboard
 * Uses Strategy pattern for different ranking criteria
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// Helper to safely parse JSON
const safeParseJson = (val, fallback) => {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
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
 * Strategy Pattern: Different ranking strategies
 */
const RankingStrategies = {
  level: (a, b) => b.level - a.level || b.totalPoints - a.totalPoints,
  totalPoints: (a, b) => b.totalPoints - a.totalPoints,
  totalCaloriesIn: (a, b) => b.totalCaloriesIn - a.totalCaloriesIn,
  totalCaloriesBurned: (a, b) => b.totalCaloriesBurned - a.totalCaloriesBurned,
  totalWaterIntake: (a, b) => b.totalWaterIntake - a.totalWaterIntake,
  totalFoods: (a, b) => b.totalFoods - a.totalFoods,
  totalExercises: (a, b) => b.totalExercises - a.totalExercises,
  totalProtein: (a, b) => b.totalProtein - a.totalProtein,
  totalCarbs: (a, b) => b.totalCarbs - a.totalCarbs,
  totalFat: (a, b) => b.totalFat - a.totalFat,
  bestStreak: (a, b) => b.bestStreak - a.bestStreak,
  totalNeat: (a, b) => b.totalNeat - a.totalNeat,
};

/**
 * @route   GET /api/leaderboard
 * @desc    Get leaderboard data with all users' stats - ranks ALL users first, then filters by search
 */
router.get('/', auth, async (req, res) => {
  try {
    const { sortBy = 'totalPoints', search = '', limit = 50 } = req.query;
    const currentUserEmail = getUserEmail(req);
    
    // Get ALL users first (no search filter) to calculate correct ranks
    const allUsersQuery = `
      SELECT 
        u.email,
        u.last_name AS "lastName",
        u.country,
        u.weight,
        u.height,
        u.age,
        u.gender,
        COALESCE(uas.total_points, 0) AS "totalPoints",
        COALESCE(uas.level, 1) AS "level"
      FROM users u
      LEFT JOIN user_achievement_stats uas ON u.email = uas.user_email
    `;
    
    const allUsersResult = await db.query(allUsersQuery);
    
    // Helper to calculate BMR
    const calculateBMR = (weight, height, age, gender) => {
      const w = weight || 70;
      const h = height || 170;
      const a = age || 30;
      const g = gender || 'female';
      return Math.round(10 * w + 6.25 * h - 5 * a + (g === 'male' ? 5 : -161));
    };
    
    // Get daily logs for ALL users to calculate stats
    const allLeaderboardData = await Promise.all(
      allUsersResult.rows.map(async (user) => {
        const logsResult = await db.query(
          `SELECT date, foods, exercises, neat_activities AS "neatActivities", water_intake AS "waterIntake" FROM daily_logs WHERE user_email = $1`,
          [user.email]
        );
        
        // Get best streak from achievement stats
        const streakResult = await db.query(
          `SELECT longest_streak AS "longestStreak" FROM user_achievement_stats WHERE user_email = $1`,
          [user.email]
        );
        const bestStreak = parseInt(streakResult.rows[0]?.longestStreak) || 0;
        
        const userBMR = calculateBMR(user.weight, user.height, user.age, user.gender);
        
        let totalCaloriesIn = 0;
        let totalExerciseBurn = 0;
        let totalNeatBurn = 0;
        let totalWaterIntake = 0;
        let totalFoods = 0;
        let totalExercises = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let daysWithActivity = 0;
        const foodTypes = new Set();
        const exerciseTypes = new Set();
        
        logsResult.rows.forEach(log => {
          const foods = safeParseJson(log.foods, []);
          const exercises = safeParseJson(log.exercises, []);
          const neatActivities = safeParseJson(log.neatActivities, []);
          
          if (foods.length > 0 || exercises.length > 0) daysWithActivity++;
          
          // Parse waterIntake as float since it might come as string from DB
          totalWaterIntake += parseFloat(log.waterIntake) || 0;
          
          foods.forEach(food => {
            totalCaloriesIn += food.calories || 0;
            totalFoods++;
            if (food.name) foodTypes.add(food.name);
            
            // Calculate macros
            if (food.nutrients && food.nutrients.macros) {
              food.nutrients.macros.forEach(macro => {
                if (macro.name === 'Protein') totalProtein += macro.amount || 0;
                if (macro.name === 'Carbs') totalCarbs += macro.amount || 0;
                if (macro.name === 'Fat') totalFat += macro.amount || 0;
              });
            }
          });
          
          exercises.forEach(ex => {
            totalExerciseBurn += ex.caloriesBurned || 0;
            totalExercises++;
            if (ex.name) exerciseTypes.add(ex.name);
          });
          
          neatActivities.forEach(neat => {
            totalNeatBurn += neat.calories || 0;
          });
        });
        
        // Calculate total burn: (BMR * days) + Exercise + NEAT + TEF
        const tef = Math.round(totalCaloriesIn * 0.1);
        const totalCaloriesBurned = (userBMR * daysWithActivity) + totalExerciseBurn + totalNeatBurn + tef;
        
        return {
          email: user.email,
          username: user.lastName || user.email.split('@')[0],
          country: user.country || 'Unknown',
          totalPoints: parseInt(user.totalPoints) || 0,
          level: parseInt(user.level) || 1,
          totalCaloriesIn,
          totalCaloriesBurned,
          totalExerciseBurn,
          totalWaterIntake: Math.round(totalWaterIntake),
          totalFoods,
          totalExercises,
          totalProtein: Math.round(totalProtein),
          totalCarbs: Math.round(totalCarbs),
          totalFat: Math.round(totalFat),
          bestStreak,
          totalNeat: Math.round(totalNeatBurn),
          uniqueFoodTypes: foodTypes.size,
          uniqueExerciseTypes: exerciseTypes.size,
          isCurrentUser: user.email === currentUserEmail,
        };
      })
    );
    
    // Sort ALL users to get correct ranks
    const sortFn = RankingStrategies[sortBy] || RankingStrategies.totalPoints;
    allLeaderboardData.sort(sortFn);
    
    // Assign ranks to ALL users
    const rankedData = allLeaderboardData.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));
    
    // Find current user's rank (from full list)
    const currentUserRank = rankedData.find(u => u.isCurrentUser);
    
    // Now filter by search if provided
    let filteredData = rankedData;
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      filteredData = rankedData.filter(u => 
        u.username.toLowerCase().includes(searchLower)
      );
    }
    
    // Limit results for display
    const limitedData = filteredData.slice(0, parseInt(limit));
    
    res.json({
      leaderboard: limitedData,
      currentUser: currentUserRank || null,
      totalUsers: rankedData.length,
      sortBy,
    });
    
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard data' });
  }
});

/**
 * @route   GET /api/leaderboard/stats
 * @desc    Get overall community statistics
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const statsResult = await db.query(`
      SELECT 
        COUNT(DISTINCT u.email) AS "totalUsers",
        COALESCE(SUM(uas.total_points), 0) AS "communityPoints"
      FROM users u
      LEFT JOIN user_achievement_stats uas ON u.email = uas.user_email
    `);
    
    const logsStats = await db.query(`
      SELECT 
        COUNT(*) AS "totalLogs",
        SUM(COALESCE(jsonb_array_length(foods), 0)) AS "totalFoodEntries",
        SUM(COALESCE(jsonb_array_length(exercises), 0)) AS "totalExerciseEntries",
        SUM(COALESCE(water_intake, 0)) AS "totalWaterIntake"
      FROM daily_logs
    `);
    
    res.json({
      totalUsers: parseInt(statsResult.rows[0]?.totalUsers) || 0,
      communityPoints: parseInt(statsResult.rows[0]?.communityPoints) || 0,
      totalLogs: parseInt(logsStats.rows[0]?.totalLogs) || 0,
      totalFoodEntries: parseInt(logsStats.rows[0]?.totalFoodEntries) || 0,
      totalExerciseEntries: parseInt(logsStats.rows[0]?.totalExerciseEntries) || 0,
      totalWaterIntake: Math.round(parseFloat(logsStats.rows[0]?.totalWaterIntake) || 0),
    });
    
  } catch (err) {
    console.error('Leaderboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch community stats' });
  }
});

/**
 * @route   GET /api/leaderboard/profile/:email
 * @desc    Get detailed profile for a specific user
 */
router.get('/profile/:email', auth, async (req, res) => {
  try {
    const { email } = req.params;
    
    // Get user info
    const userResult = await db.query(
      `SELECT email, last_name AS "lastName", country, created_at AS "createdAt"
       FROM users WHERE email = $1`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get achievement stats
    const statsResult = await db.query(
      `SELECT total_points AS "totalPoints", level, current_streak AS "currentStreak", 
              longest_streak AS "longestStreak"
       FROM user_achievement_stats WHERE user_email = $1`,
      [email]
    );
    
    const stats = statsResult.rows[0] || { totalPoints: 0, level: 1, currentStreak: 0, longestStreak: 0 };
    
    // Get daily logs for detailed stats
    const logsResult = await db.query(
      `SELECT date, foods, exercises, water_intake AS "waterIntake" 
       FROM daily_logs WHERE user_email = $1 ORDER BY date DESC`,
      [email]
    );
    
    let totalCaloriesIn = 0;
    let totalCaloriesBurned = 0;
    let totalWaterIntake = 0;
    let totalFoods = 0;
    let totalExercises = 0;
    let daysLogged = 0;
    const foodNames = {};
    const exerciseNames = {};
    
    logsResult.rows.forEach(log => {
      const foods = safeParseJson(log.foods, []);
      const exercises = safeParseJson(log.exercises, []);
      
      if (foods.length > 0 || exercises.length > 0) daysLogged++;
      // Parse waterIntake as float since it might come as string from DB
      totalWaterIntake += parseFloat(log.waterIntake) || 0;
      
      foods.forEach(food => {
        totalCaloriesIn += food.calories || 0;
        totalFoods++;
        if (food.name) {
          foodNames[food.name] = (foodNames[food.name] || 0) + 1;
        }
      });
      
      exercises.forEach(ex => {
        totalCaloriesBurned += ex.caloriesBurned || 0;
        totalExercises++;
        if (ex.name) {
          exerciseNames[ex.name] = (exerciseNames[ex.name] || 0) + 1;
        }
      });
    });
    
    // Get top foods and exercises
    const topFoods = Object.entries(foodNames)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    
    const topExercises = Object.entries(exerciseNames)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    
    // Get unlocked achievements count
    const achievementsResult = await db.query(
      `SELECT COUNT(*) AS count FROM user_achievements WHERE user_email = $1`,
      [email]
    );
    
    res.json({
      user: {
        email: user.email,
        username: user.lastName || user.email.split('@')[0],
        country: user.country || 'Unknown',
        joinedAt: user.createdAt,
      },
      stats: {
        totalPoints: parseInt(stats.totalPoints) || 0,
        level: parseInt(stats.level) || 1,
        currentStreak: parseInt(stats.currentStreak) || 0,
        longestStreak: parseInt(stats.longestStreak) || 0,
        totalCaloriesIn,
        totalCaloriesBurned,
        totalWaterIntake: Math.round(totalWaterIntake),
        totalFoods,
        totalExercises,
        daysLogged,
        uniqueFoodTypes: Object.keys(foodNames).length,
        uniqueExerciseTypes: Object.keys(exerciseNames).length,
        achievementsUnlocked: parseInt(achievementsResult.rows[0]?.count) || 0,
      },
      topFoods,
      topExercises,
    });
    
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile data' });
  }
});

module.exports = router;
