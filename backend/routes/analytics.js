/**
 * Analytics Routes - Enhanced with Visual Analytics & Progress Tracking
 * Provides comprehensive data analysis, visual charts, and milestone tracking
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

const safeParseJson = (val, fallback) => {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
};

// Helper to extract email from user object
const getUserEmail = (req) => {
  const email = req.user && (typeof req.user === 'object' ? req.user.email : req.user);
  if (!email) {
    throw new Error('User email not found in token');
  }
  return email;
};

const calculateBMR = (weight, height, age, gender) => {
  const w = weight || 70, h = height || 170, a = age || 30, g = gender || 'female';
  return Math.round(10 * w + 6.25 * h - 5 * a + (g === 'male' ? 5 : -161));
};

// Helper function to calculate nutrition trends
const calculateTrends = (data, period) => {
  if (data.length < 2) return { trend: 'stable', change: 0 };
  
  const recent = data.slice(-7); // Last 7 days
  const previous = data.slice(-14, -7); // Previous 7 days
  
  const recentAvg = recent.reduce((sum, day) => sum + (day.value || 0), 0) / recent.length;
  const previousAvg = previous.length > 0 ? 
    previous.reduce((sum, day) => sum + (day.value || 0), 0) / previous.length : recentAvg;
  
  const change = ((recentAvg - previousAvg) / previousAvg) * 100;
  
  return {
    trend: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
    change: Math.round(change * 10) / 10,
    recentAvg: Math.round(recentAvg),
    previousAvg: Math.round(previousAvg)
  };
};

/**
 * @route GET /api/analytics/user-stats
 * @desc Get comprehensive user statistics for analysis
 */
router.get('/user-stats', auth, async (req, res) => {
  try {
    const email = getUserEmail(req);
    const { days = 30 } = req.query;
    
    const userResult = await db.query(
      `SELECT weight, height, age, gender, created_at FROM users WHERE email = $1`, [email]
    );
    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found' });
    
    const user = userResult.rows[0];
    const bmr = calculateBMR(user.weight, user.height, user.age, user.gender);
    
    const logsResult = await db.query(
      `SELECT date, foods, exercises, neat_activities, water_intake 
       FROM daily_logs WHERE user_email = $1 AND date >= CURRENT_DATE - $2::int ORDER BY date`,
      [email, days]
    );
    
    const dailyData = [];
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, exercise: 0, neat: 0 };
    const mealTypeBreakdown = { Breakfast: 0, Lunch: 0, Dinner: 0, Snacks: 0 };
    const mealTypeCount = { Breakfast: 0, Lunch: 0, Dinner: 0, Snacks: 0 };
    
    // Detailed food tracking
    const foodDetails = {};
    const calorieRanges = { low: 0, medium: 0, high: 0, veryHigh: 0 }; // <200, 200-400, 400-600, >600
    const proteinFoods = [];
    const carbFoods = [];
    const fatFoods = [];
    
    logsResult.rows.forEach(log => {
      const foods = safeParseJson(log.foods, []);
      const exercises = safeParseJson(log.exercises, []);
      const neat = safeParseJson(log.neat_activities, []);
      const water = parseFloat(log.water_intake) || 0;
      
      let dayCalories = 0, dayProtein = 0, dayCarbs = 0, dayFat = 0, dayExercise = 0, dayNeat = 0;
      
      foods.forEach(f => {
        const cal = f.calories || 0;
        dayCalories += cal;
        mealTypeBreakdown[f.mealType] = (mealTypeBreakdown[f.mealType] || 0) + cal;
        mealTypeCount[f.mealType] = (mealTypeCount[f.mealType] || 0) + 1;
        
        // Calorie range categorization
        if (cal < 200) calorieRanges.low++;
        else if (cal < 400) calorieRanges.medium++;
        else if (cal < 600) calorieRanges.high++;
        else calorieRanges.veryHigh++;
        
        // Track food details
        if (f.name) {
          if (!foodDetails[f.name]) {
            foodDetails[f.name] = { count: 0, totalCal: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };
          }
          foodDetails[f.name].count++;
          foodDetails[f.name].totalCal += cal;
        }
        
        if (f.nutrients?.macros) {
          let prot = 0, carb = 0, fat = 0;
          f.nutrients.macros.forEach(m => {
            if (m.name === 'Protein') { prot = m.amount || 0; dayProtein += prot; }
            if (m.name === 'Carbs') { carb = m.amount || 0; dayCarbs += carb; }
            if (m.name === 'Fat') { fat = m.amount || 0; dayFat += fat; }
          });
          if (f.name) {
            foodDetails[f.name].totalProtein += prot;
            foodDetails[f.name].totalCarbs += carb;
            foodDetails[f.name].totalFat += fat;
          }
        }
      });
      
      exercises.forEach(e => { dayExercise += e.caloriesBurned || 0; });
      neat.forEach(n => { dayNeat += n.calories || 0; });
      
      totals.calories += dayCalories;
      totals.protein += dayProtein;
      totals.carbs += dayCarbs;
      totals.fat += dayFat;
      totals.water += water;
      totals.exercise += dayExercise;
      totals.neat += dayNeat;
      
      dailyData.push({
        date: log.date,
        calories: dayCalories,
        protein: Math.round(dayProtein),
        carbs: Math.round(dayCarbs),
        fat: Math.round(dayFat),
        water,
        exercise: dayExercise,
        neat: dayNeat,
        netCalories: dayCalories - bmr - dayExercise - dayNeat - Math.round(dayCalories * 0.1)
      });
    });
    
    const daysLogged = logsResult.rows.length || 1;
    const averages = {
      calories: Math.round(totals.calories / daysLogged),
      protein: Math.round(totals.protein / daysLogged),
      carbs: Math.round(totals.carbs / daysLogged),
      fat: Math.round(totals.fat / daysLogged),
      water: Math.round(totals.water / daysLogged),
      exercise: Math.round(totals.exercise / daysLogged),
      neat: Math.round(totals.neat / daysLogged)
    };
    
    // Process food details for analysis
    const foodAnalysis = Object.entries(foodDetails).map(([name, data]) => ({
      name,
      count: data.count,
      avgCalories: Math.round(data.totalCal / data.count),
      avgProtein: Math.round(data.totalProtein / data.count),
      avgCarbs: Math.round(data.totalCarbs / data.count),
      avgFat: Math.round(data.totalFat / data.count),
      totalCalories: data.totalCal,
      proteinRatio: data.totalCal > 0 ? Math.round((data.totalProtein * 4 / data.totalCal) * 100) : 0
    }));
    
    // Categorize foods by dominant macro
    const highProteinFoods = foodAnalysis.filter(f => f.proteinRatio > 30).sort((a, b) => b.avgProtein - a.avgProtein).slice(0, 5);
    const highCalorieFoods = foodAnalysis.sort((a, b) => b.avgCalories - a.avgCalories).slice(0, 5);
    const frequentFoods = foodAnalysis.sort((a, b) => b.count - a.count).slice(0, 5);
    
    // Meal timing analysis
    const mealAvgCalories = {};
    Object.keys(mealTypeBreakdown).forEach(meal => {
      mealAvgCalories[meal] = mealTypeCount[meal] > 0 ? Math.round(mealTypeBreakdown[meal] / mealTypeCount[meal]) : 0;
    });
    
    res.json({
      dailyData,
      totals,
      averages,
      mealTypeBreakdown,
      mealTypeCount,
      mealAvgCalories,
      calorieRanges,
      foodAnalysis: {
        highProteinFoods,
        highCalorieFoods,
        frequentFoods,
        totalUniqueFoods: Object.keys(foodDetails).length,
        totalFoodItems: Object.values(foodDetails).reduce((sum, f) => sum + f.count, 0)
      },
      bmr,
      daysLogged
    });
  } catch (err) {
    console.error('Analytics user-stats error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * @route GET /api/analytics/comparison
 * @desc Compare user stats with community averages and percentiles
 */
router.get('/comparison', auth, async (req, res) => {
  try {
    const email = getUserEmail(req);
    const { days = 30 } = req.query;
    
    const allUsersResult = await db.query(`SELECT u.email, u.weight, u.height, u.age, u.gender FROM users u`);
    const userStats = [];
    
    for (const user of allUsersResult.rows) {
      const logsResult = await db.query(
        `SELECT foods, exercises, neat_activities, water_intake 
         FROM daily_logs WHERE user_email = $1 AND date >= CURRENT_DATE - $2::int`,
        [user.email, days]
      );
      
      let calories = 0, protein = 0, carbs = 0, fat = 0, water = 0, exercise = 0;
      const daysCount = logsResult.rows.length || 1;
      
      logsResult.rows.forEach(log => {
        const foods = safeParseJson(log.foods, []);
        const exercises = safeParseJson(log.exercises, []);
        water += parseFloat(log.water_intake) || 0;
        
        foods.forEach(f => {
          calories += f.calories || 0;
          if (f.nutrients?.macros) {
            f.nutrients.macros.forEach(m => {
              if (m.name === 'Protein') protein += m.amount || 0;
              if (m.name === 'Carbs') carbs += m.amount || 0;
              if (m.name === 'Fat') fat += m.amount || 0;
            });
          }
        });
        exercises.forEach(e => { exercise += e.caloriesBurned || 0; });
      });
      
      userStats.push({
        email: user.email,
        avgCalories: Math.round(calories / daysCount),
        avgProtein: Math.round(protein / daysCount),
        avgCarbs: Math.round(carbs / daysCount),
        avgFat: Math.round(fat / daysCount),
        avgWater: Math.round(water / daysCount),
        avgExercise: Math.round(exercise / daysCount),
        daysLogged: logsResult.rows.length
      });
    }
    
    const currentUser = userStats.find(u => u.email === email) || {
      avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0, avgWater: 0, avgExercise: 0, daysLogged: 0
    };
    
    const calcPercentile = (arr, value) => {
      const sorted = arr.sort((a, b) => a - b);
      const idx = sorted.findIndex(v => v >= value);
      return idx === -1 ? 100 : Math.round((idx / sorted.length) * 100);
    };
    
    const calcAvg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    
    const metrics = ['avgCalories', 'avgProtein', 'avgCarbs', 'avgFat', 'avgWater', 'avgExercise', 'daysLogged'];
    const comparison = {};
    
    metrics.forEach(metric => {
      const values = userStats.map(u => u[metric]).filter(v => v > 0);
      comparison[metric] = {
        user: currentUser[metric],
        communityAvg: calcAvg(values),
        communityMin: Math.min(...values, 0),
        communityMax: Math.max(...values, 0),
        percentile: calcPercentile(values, currentUser[metric])
      };
    });
    
    res.json({ comparison, totalUsers: userStats.length });
  } catch (err) {
    console.error('Analytics comparison error:', err);
    res.status(500).json({ error: 'Failed to fetch comparison data' });
  }
});

/**
 * @route GET /api/analytics/trends
 * @desc Get enhanced trend analysis with detailed patterns
 */
router.get('/trends', auth, async (req, res) => {
  try {
    const email = getUserEmail(req);
    
    const logsResult = await db.query(
      `SELECT date, foods, exercises, water_intake, neat_activities
       FROM daily_logs WHERE user_email = $1 ORDER BY date DESC LIMIT 90`,
      [email]
    );
    
    const weekdayStats = Array(7).fill(null).map(() => ({ 
      calories: 0, protein: 0, carbs: 0, fat: 0, exercise: 0, water: 0, count: 0 
    }));
    const weeklyTotals = {};
    const hourlyMealPattern = Array(24).fill(0); // Simplified - track meal counts by meal type timing
    const mealTimingByDay = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
    
    // Consistency tracking
    const dailyCalories = [];
    const dailyProtein = [];
    let streakDays = 0;
    let maxStreak = 0;
    let currentStreak = 0;
    let prevDate = null;
    
    // Macro balance tracking per day
    const macroBalanceData = [];
    
    logsResult.rows.forEach(log => {
      const d = new Date(log.date);
      const dayOfWeek = d.getDay();
      const weekNum = getWeekNumber(d);
      const weekKey = `${d.getFullYear()}-W${weekNum}`;
      
      const foods = safeParseJson(log.foods, []);
      const exercises = safeParseJson(log.exercises, []);
      const water = parseFloat(log.water_intake) || 0;
      
      let dayCalories = 0, dayProtein = 0, dayCarbs = 0, dayFat = 0, dayExercise = 0;
      
      // Track meal types for timing patterns
      const mealCounts = { Breakfast: 0, Lunch: 0, Dinner: 0, Snacks: 0 };
      
      foods.forEach(f => {
        dayCalories += f.calories || 0;
        mealCounts[f.mealType] = (mealCounts[f.mealType] || 0) + 1;
        if (f.nutrients?.macros) {
          f.nutrients.macros.forEach(m => {
            if (m.name === 'Protein') dayProtein += m.amount || 0;
            if (m.name === 'Carbs') dayCarbs += m.amount || 0;
            if (m.name === 'Fat') dayFat += m.amount || 0;
          });
        }
      });
      
      exercises.forEach(e => { dayExercise += e.caloriesBurned || 0; });
      
      // Weekday stats
      weekdayStats[dayOfWeek].calories += dayCalories;
      weekdayStats[dayOfWeek].protein += dayProtein;
      weekdayStats[dayOfWeek].carbs += dayCarbs;
      weekdayStats[dayOfWeek].fat += dayFat;
      weekdayStats[dayOfWeek].exercise += dayExercise;
      weekdayStats[dayOfWeek].water += water;
      weekdayStats[dayOfWeek].count++;
      
      // Weekly totals
      if (!weeklyTotals[weekKey]) {
        weeklyTotals[weekKey] = { calories: 0, protein: 0, carbs: 0, fat: 0, exercise: 0, water: 0, days: 0 };
      }
      weeklyTotals[weekKey].calories += dayCalories;
      weeklyTotals[weekKey].protein += dayProtein;
      weeklyTotals[weekKey].carbs += dayCarbs;
      weeklyTotals[weekKey].fat += dayFat;
      weeklyTotals[weekKey].exercise += dayExercise;
      weeklyTotals[weekKey].water += water;
      weeklyTotals[weekKey].days++;
      
      // Track for consistency
      dailyCalories.push(dayCalories);
      dailyProtein.push(dayProtein);
      
      // Macro balance for the day
      const totalMacrosCal = (dayProtein * 4) + (dayCarbs * 4) + (dayFat * 9);
      if (totalMacrosCal > 0) {
        macroBalanceData.push({
          date: log.date,
          proteinPct: Math.round((dayProtein * 4 / totalMacrosCal) * 100),
          carbsPct: Math.round((dayCarbs * 4 / totalMacrosCal) * 100),
          fatPct: Math.round((dayFat * 9 / totalMacrosCal) * 100)
        });
      }
      
      // Streak tracking
      if (foods.length > 0 || exercises.length > 0) {
        if (prevDate) {
          const diff = (prevDate - d) / (1000 * 60 * 60 * 24);
          if (diff <= 1.5) currentStreak++;
          else { maxStreak = Math.max(maxStreak, currentStreak); currentStreak = 1; }
        } else {
          currentStreak = 1;
        }
        prevDate = d;
      }
    });
    
    maxStreak = Math.max(maxStreak, currentStreak);
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdayAverages = weekdayStats.map((stat, i) => ({
      day: dayNames[i],
      fullDay: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i],
      avgCalories: stat.count ? Math.round(stat.calories / stat.count) : 0,
      avgProtein: stat.count ? Math.round(stat.protein / stat.count) : 0,
      avgCarbs: stat.count ? Math.round(stat.carbs / stat.count) : 0,
      avgFat: stat.count ? Math.round(stat.fat / stat.count) : 0,
      avgExercise: stat.count ? Math.round(stat.exercise / stat.count) : 0,
      avgWater: stat.count ? Math.round(stat.water / stat.count) : 0,
      daysLogged: stat.count
    }));
    
    const weeklyData = Object.entries(weeklyTotals)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([week, data]) => ({
        week,
        avgCalories: data.days ? Math.round(data.calories / data.days) : 0,
        avgProtein: data.days ? Math.round(data.protein / data.days) : 0,
        avgCarbs: data.days ? Math.round(data.carbs / data.days) : 0,
        avgFat: data.days ? Math.round(data.fat / data.days) : 0,
        totalExercise: data.exercise,
        avgWater: data.days ? Math.round(data.water / data.days) : 0,
        daysLogged: data.days
      }));
    
    // Calculate consistency score (coefficient of variation - lower is more consistent)
    const calcCV = (arr) => {
      if (arr.length < 2) return 0;
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      if (mean === 0) return 0;
      const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
      return Math.round((Math.sqrt(variance) / mean) * 100);
    };
    
    const calorieCV = calcCV(dailyCalories);
    const proteinCV = calcCV(dailyProtein);
    
    // Find best/worst days
    const bestCalorieDay = weekdayAverages.reduce((a, b) => a.avgCalories > b.avgCalories ? a : b);
    const worstCalorieDay = weekdayAverages.filter(d => d.avgCalories > 0).reduce((a, b) => a.avgCalories < b.avgCalories ? a : b, weekdayAverages[0]);
    const bestExerciseDay = weekdayAverages.reduce((a, b) => a.avgExercise > b.avgExercise ? a : b);
    
    // Weekend vs Weekday comparison
    const weekdayAvg = weekdayAverages.slice(1, 6).reduce((sum, d) => sum + d.avgCalories, 0) / 5;
    const weekendAvg = (weekdayAverages[0].avgCalories + weekdayAverages[6].avgCalories) / 2;
    
    res.json({
      weekdayAverages,
      weeklyData,
      macroBalanceData: macroBalanceData.slice(-30),
      insights: {
        calorieConsistency: calorieCV < 20 ? 'Very Consistent' : calorieCV < 35 ? 'Moderately Consistent' : 'Variable',
        calorieCV,
        proteinConsistency: proteinCV < 25 ? 'Very Consistent' : proteinCV < 40 ? 'Moderately Consistent' : 'Variable',
        proteinCV,
        bestCalorieDay: bestCalorieDay.fullDay,
        worstCalorieDay: worstCalorieDay.fullDay,
        bestExerciseDay: bestExerciseDay.fullDay,
        weekendVsWeekday: weekendAvg > weekdayAvg * 1.1 ? 'Higher on weekends' : weekendAvg < weekdayAvg * 0.9 ? 'Lower on weekends' : 'Similar',
        weekendAvg: Math.round(weekendAvg),
        weekdayAvg: Math.round(weekdayAvg),
        maxStreak,
        totalDaysLogged: logsResult.rows.length
      }
    });
  } catch (err) {
    console.error('Analytics trends error:', err);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Helper to get ISO week number
function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

/**
 * @route GET /api/analytics/nutrition-trends
 * @desc Get nutrition trends data for visual charts
 */
router.get('/nutrition-trends', auth, async (req, res) => {
  try {
    const email = getUserEmail(req);
    const { days = 30 } = req.query;
    
    const query = `
      SELECT date, 
             COALESCE(water_intake, 0) as water,
             (SELECT COALESCE(SUM(calories), 0) FROM jsonb_array_elements(foods) ->> 'calories'::numeric) as calories,
             (SELECT COALESCE(SUM(protein), 0) FROM jsonb_array_elements(foods) ->> 'protein'::numeric) as protein,
             (SELECT COALESCE(SUM(carbohydrates), 0) FROM jsonb_array_elements(foods) ->> 'carbohydrates'::numeric) as carbs,
             (SELECT COALESCE(SUM(fat), 0) FROM jsonb_array_elements(foods) ->> 'fat'::numeric) as fat
      FROM daily_logs 
      WHERE user_email = $1 AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date ASC
    `;
    
    const result = await db.query(query, [email]);
    
    const chartData = result.rows.map(row => ({
      date: row.date,
      calories: Math.round(row.calories),
      protein: Math.round(row.protein),
      carbs: Math.round(row.carbs),
      fat: Math.round(row.fat),
      water: row.water
    }));
    
    // Calculate trends
    const trends = {
      calories: calculateTrends(chartData.map(d => ({ value: d.calories }))),
      protein: calculateTrends(chartData.map(d => ({ value: d.protein }))),
      water: calculateTrends(chartData.map(d => ({ value: d.water })))
    };
    
    res.json({
      chartData,
      trends,
      period: days
    });
  } catch (error) {
    console.error('Error getting nutrition trends:', error);
    res.status(500).json({ error: 'Failed to get nutrition trends' });
  }
});

/**
 * @route GET /api/analytics/progress-milestones
 * @desc Get user progress milestones and achievements
 */
router.get('/progress-milestones', auth, async (req, res) => {
  try {
    const email = getUserEmail(req);
    
    // Get user's current stats
    const userQuery = await db.query(
      'SELECT weight, start_weight, created_at FROM users WHERE email = $1',
      [email]
    );
    
    const user = userQuery.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Get weight history
    const weightQuery = await db.query(
      'SELECT date, weight FROM weight_logs WHERE user_email = $1 ORDER BY date ASC',
      [email]
    );
    
    // Get nutrition consistency
    const nutritionQuery = await db.query(
      `SELECT date, 
              (SELECT COUNT(*) FROM jsonb_array_elements(foods)) as meal_count
       FROM daily_logs 
       WHERE user_email = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY date ASC`,
      [email]
    );
    
    const weightHistory = weightQuery.rows;
    const nutritionHistory = nutritionQuery.rows;
    
    // Calculate milestones
    const milestones = [];
    
    // Weight loss milestone
    if (user.start_weight && user.weight) {
      const weightLoss = user.start_weight - user.weight;
      const weightLossPercent = (weightLoss / user.start_weight) * 100;
      
      if (weightLoss >= 5) milestones.push({
        type: 'weight_loss',
        title: '5 kg Weight Loss',
        achieved: true,
        value: Math.round(weightLoss * 10) / 10,
        unit: 'kg',
        date: weightHistory.find(w => w.weight <= (user.start_weight - 5))?.date
      });
      
      if (weightLossPercent >= 5) milestones.push({
        type: 'weight_loss_percent',
        title: '5% Body Weight Loss',
        achieved: true,
        value: Math.round(weightLossPercent * 10) / 10,
        unit: '%',
        date: weightHistory.find(w => w.weight <= (user.start_weight * 0.95))?.date
      });
    }
    
    // Consistency milestones
    const consistentDays = nutritionHistory.filter(day => day.meal_count >= 3).length;
    if (consistentDays >= 7) milestones.push({
      type: 'consistency',
      title: '1 Week Consistency',
      achieved: true,
      value: consistentDays,
      unit: 'days'
    });
    
    if (consistentDays >= 30) milestones.push({
      type: 'consistency',
      title: '30 Day Consistency',
      achieved: true,
      value: consistentDays,
      unit: 'days'
    });
    
    // Next milestones
    const nextMilestones = [];
    
    if (user.start_weight && user.weight) {
      const weightLoss = user.start_weight - user.weight;
      if (weightLoss < 5) {
        nextMilestones.push({
          type: 'weight_loss',
          title: '5 kg Weight Loss',
          progress: (weightLoss / 5) * 100,
          remaining: Math.round((5 - weightLoss) * 10) / 10,
          unit: 'kg'
        });
      }
    }
    
    if (consistentDays < 30) {
      nextMilestones.push({
        type: 'consistency',
        title: '30 Day Consistency',
        progress: (consistentDays / 30) * 100,
        remaining: 30 - consistentDays,
        unit: 'days'
      });
    }
    
    res.json({
      currentWeight: user.weight,
      startWeight: user.start_weight,
      totalWeightLoss: user.start_weight ? Math.round((user.start_weight - user.weight) * 10) / 10 : 0,
      consistentDays,
      milestones: milestones.filter(m => m.achieved),
      nextMilestones,
      weightHistory: weightHistory.slice(-30) // Last 30 days
    });
  } catch (error) {
    console.error('Error getting progress milestones:', error);
    res.status(500).json({ error: 'Failed to get progress milestones' });
  }
});

/**
 * @route GET /api/analytics/export-data
 * @desc Export user data for nutritionists/doctors
 */
router.get('/export-data', auth, async (req, res) => {
  try {
    const email = getUserEmail(req);
    const { format = 'json', days = 90 } = req.query;
    
    // Get comprehensive user data
    const userQuery = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    const goalsQuery = await db.query(
      'SELECT * FROM user_goals WHERE user_email = $1',
      [email]
    );
    
    const logsQuery = await db.query(
      `SELECT date, foods, exercises, water_intake, created_at
       FROM daily_logs 
       WHERE user_email = $1 AND date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY date DESC`,
      [email]
    );
    
    const weightQuery = await db.query(
      `SELECT date, weight, created_at
       FROM weight_logs 
       WHERE user_email = $1 AND date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY date DESC`,
      [email]
    );
    
    const exportData = {
      user: userQuery.rows[0],
      goals: goalsQuery.rows[0],
      dailyLogs: logsQuery.rows,
      weightLogs: weightQuery.rows,
      exportDate: new Date().toISOString(),
      period: `${days} days`
    };
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="nutrimind-export-${email}.csv"`);
      res.send(csv);
    } else {
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Helper function to convert to CSV
const convertToCSV = (data) => {
  const headers = ['Date', 'Weight', 'Calories', 'Protein', 'Carbs', 'Fat', 'Water', 'Exercise'];
  const rows = data.dailyLogs.map(log => {
    const foods = safeParseJson(log.foods, []);
    const exercises = safeParseJson(log.exercises, []);
    
    const totalCalories = foods.reduce((sum, food) => sum + (food.calories || 0), 0);
    const totalProtein = foods.reduce((sum, food) => sum + (food.protein || 0), 0);
    const totalCarbs = foods.reduce((sum, food) => sum + (food.carbohydrates || 0), 0);
    const totalFat = foods.reduce((sum, food) => sum + (food.fat || 0), 0);
    
    return [
      log.date,
      data.weightLogs.find(w => w.date === log.date)?.weight || '',
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      log.water_intake || 0,
      exercises.length
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
};

module.exports = router;
