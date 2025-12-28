/**
 * AI Coach Service - Simplified to use only Gemini 2.5 Flash
 * Personalized Nutritionist using Gemini AI
 */

const db = require('../db');
const geminiAdapter = require('./geminiAdapter');
const { getCountryMeals } = require('./comprehensiveMealDatabase');

/* ------------------ CONFIG ------------------ */

const CONFIG = {
  // Force Gemini 2.5 flash for AI Coach as requested
  modelName: 'gemini-2.5-flash',
  maxRetries: 2,
  retryDelay: 1000,
  defaultCountry: 'United States',
  defaultMealTime: 'lunch',
  defaultCalories: 600
};

/* ------------------ HELPERS ------------------ */

function safeParseJson(text = '') {
  try {
    let clean = text.trim();
    if (clean.startsWith('```')) clean = clean.replace(/^```json|```/g, '');
    if (clean.endsWith('```')) clean = clean.slice(0, -3);
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

function getBmiCategory(weight, height) {
  const bmi = weight / ((height / 100) ** 2);
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/* ------------------ PERSONALIZED FOOD RECOMMENDATIONS ------------------ */

function generatePersonalizedFoodRecommendations(profile, analysis, loggedFoods) {
  const country = profile.country || CONFIG.defaultCountry;
  const economicClass = profile.economic_class || 'standard';
  
  // Map economic class to budget class
  let budgetClass = 'moderate';
  if (economicClass === 'budget' || economicClass === 'low') {
    budgetClass = 'budget';
  } else if (economicClass === 'premium' || economicClass === 'high') {
    budgetClass = 'premium';
  }
  
  // Get appropriate meal type based on current time
  const hour = new Date().getHours();
  let mealType = 'lunch';
  if (hour < 10) mealType = 'breakfast';
  else if (hour < 14) mealType = 'lunch';
  else if (hour < 18) mealType = 'snacks';
  else mealType = 'dinner';
  
  // Get meals from comprehensive database
  const availableMeals = getCountryMeals(country, mealType, budgetClass) || [];
  
  // Filter out already eaten foods (by name similarity)
  const loggedFoodNames = loggedFoods.map(f => f.name.toLowerCase());
  const filteredMeals = availableMeals.filter(meal => {
    const mealName = meal.name.toLowerCase();
    return !loggedFoodNames.some(logged => 
      logged.includes(mealName.split(' ')[0]) || mealName.includes(logged.split(' ')[0])
    );
  });
  
  const recommendations = [];
  
  // High protein recommendations if protein is low
  if (analysis.proteinPercent < 80) {
    const highProteinMeals = filteredMeals
      .filter(meal => meal.protein >= 15)
      .sort((a, b) => b.protein - a.protein)
      .slice(0, 3);
    
    highProteinMeals.forEach(meal => {
      recommendations.push({
        name: meal.name,
        reason: `High in protein (${meal.protein}g per serving) - helps reach your daily protein target`,
        calories: meal.calories,
        protein: meal.protein,
        portion: meal.portionSize || '1 serving',
        price: `${budgetClass} option`,
        fiber: meal.fiber,
        sodium: meal.sodium
      });
    });
  }
  
  // Calorie-appropriate recommendations
  if (analysis.caloriePercent < 85) {
    const calorieDenseMeals = filteredMeals
      .filter(meal => meal.calories >= 200 && meal.calories <= 400)
      .sort((a, b) => b.calories - a.calories)
      .slice(0, 2);
    
    calorieDenseMeals.forEach(meal => {
      recommendations.push({
        name: meal.name,
        reason: `Good energy source (${meal.calories} calories per serving) to meet your calorie goals`,
        calories: meal.calories,
        protein: meal.protein,
        portion: meal.portionSize || '1 serving',
        price: `${budgetClass} option`,
        fiber: meal.fiber,
        sodium: meal.sodium
      });
    });
  } else if (analysis.caloriePercent > 105) {
    const lowCalorieMeals = filteredMeals
      .filter(meal => meal.calories <= 250 && meal.protein >= 10)
      .sort((a, b) => b.protein - a.protein)
      .slice(0, 2);
    
    lowCalorieMeals.forEach(meal => {
      recommendations.push({
        name: meal.name,
        reason: `Low in calories but satisfying (${meal.calories} calories, ${meal.protein}g protein per serving)`,
        calories: meal.calories,
        protein: meal.protein,
        portion: meal.portionSize || '1 serving',
        price: `${budgetClass} option`,
        fiber: meal.fiber,
        sodium: meal.sodium
      });
    });
  }
  
  // Add balanced options if no specific recommendations
  if (recommendations.length === 0) {
    const balancedMeals = filteredMeals
      .filter(meal => meal.calories >= 150 && meal.calories <= 350 && meal.protein >= 8)
      .sort((a, b) => (b.protein / b.calories) - (a.protein / a.calories))
      .slice(0, 3);
    
    balancedMeals.forEach(meal => {
      recommendations.push({
        name: meal.name,
        reason: `Well-balanced option (${meal.calories} calories, ${meal.protein}g protein per serving)`,
        calories: meal.calories,
        protein: meal.protein,
        portion: meal.portionSize || '1 serving',
        price: `${budgetClass} option`,
        fiber: meal.fiber,
        sodium: meal.sodium
      });
    });
  }
  
  return recommendations.slice(0, 5); // Return top 5 recommendations
}

function generatePersonalizedAvoidList(profile, loggedFoods) {
  const country = profile.country || CONFIG.defaultCountry;
  const avoidRecommendations = [];
  
  // Analyze logged foods for issues
  loggedFoods.forEach(food => {
    const calories = food.calories || 0;
    const protein = food.nutrients?.macros?.find(m => m.name === 'Protein')?.amount || 0;
    const sodium = food.nutrients?.micros?.find(m => m.name === 'sodium')?.amount || 0;
    const sugar = food.nutrients?.micros?.find(m => m.name === 'sugar')?.amount || 0;
    
    // High calorie, low protein foods
    if (calories > 400 && protein < 15) {
      avoidRecommendations.push({
        food: food.name,
        reason: `High calorie (${calories} cal) but low protein (${protein}g) - may leave you hungry`,
        alternative: suggestAlternativeFromDatabase(profile, 'high_protein', calories)
      });
    }
    
    // High sodium foods
    if (sodium > 800) {
      avoidRecommendations.push({
        food: food.name,
        reason: `Very high sodium (${sodium}mg) - can cause bloating and high blood pressure`,
        alternative: suggestAlternativeFromDatabase(profile, 'low_sodium', calories)
      });
    }
    
    // High sugar foods
    if (sugar > 25) {
      avoidRecommendations.push({
        food: food.name,
        reason: `High sugar (${sugar}g) - causes energy spikes and weight gain`,
        alternative: suggestAlternativeFromDatabase(profile, 'low_sugar', calories)
      });
    }
  });
  
  // Add country-specific common problematic foods
  const commonProblematicFoods = getCountrySpecificProblematicFoods(country);
  
  commonProblematicFoods.forEach(problemFood => {
    if (!loggedFoods.some(f => f.name.toLowerCase().includes(problemFood.name.toLowerCase()))) {
      avoidRecommendations.push({
        food: problemFood.name,
        reason: problemFood.reason,
        alternative: problemFood.alternative
      });
    }
  });
  
  return avoidRecommendations.slice(0, 4);
}

function suggestAlternativeFromDatabase(profile, type, targetCalories) {
  const country = profile.country || CONFIG.defaultCountry;
  const economicClass = profile.economic_class || 'standard';
  
  // Map economic class to budget class
  let budgetClass = 'moderate';
  if (economicClass === 'budget' || economicClass === 'low') {
    budgetClass = 'budget';
  } else if (economicClass === 'premium' || economicClass === 'high') {
    budgetClass = 'premium';
  }
  
  // Get appropriate meal type
  const hour = new Date().getHours();
  let mealType = 'lunch';
  if (hour < 10) mealType = 'breakfast';
  else if (hour < 14) mealType = 'lunch';
  else if (hour < 18) mealType = 'snacks';
  else mealType = 'dinner';
  
  const availableMeals = getCountryMeals(country, mealType, budgetClass) || [];
  
  let alternatives = [];
  
  switch(type) {
    case 'high_protein':
      alternatives = availableMeals
        .filter(meal => meal.protein >= 20 && meal.calories <= targetCalories + 100)
        .sort((a, b) => b.protein - a.protein);
      break;
    case 'low_sodium':
      alternatives = availableMeals
        .filter(meal => meal.calories <= targetCalories && meal.sodium <= 600)
        .sort((a, b) => b.protein - a.protein);
      break;
    case 'low_sugar':
      alternatives = availableMeals
        .filter(meal => meal.calories <= targetCalories && meal.sugar <= 15)
        .sort((a, b) => b.protein - a.protein);
      break;
  }
  
  return alternatives.length > 0 ? alternatives[0].name : 'fresh vegetables and lean protein';
}

function getCountrySpecificProblematicFoods(country) {
  const problematicFoods = {
    'Bangladesh': [
      { name: 'Puffed Rice (Muri) for meals', reason: 'Very low protein, won\'t keep you full', alternative: 'Add eggs or dal with muri' },
      { name: 'Fried snacks', reason: 'High in unhealthy fats and calories', alternative: 'Roasted nuts or boiled snacks' }
    ],
    'India': [
      { name: 'White bread daily', reason: 'Low fiber and nutrients', alternative: 'Whole wheat roti or multigrain bread' },
      { name: 'Sugary chai multiple times', reason: 'Added sugar leads to weight gain', alternative: 'Herbal tea or unsweetened chai' }
    ],
    'Pakistan': [
      { name: 'Naan with every meal', reason: 'High refined carbs', alternative: 'Roti or limit to one naan' },
      { name: 'Sugary drinks', reason: 'Empty calories', alternative: 'Lassi without sugar or water' }
    ],
    'United States': [
      { name: 'Fast food burgers', reason: 'High calories, saturated fat, sodium', alternative: 'Grilled chicken sandwich or homemade burger' },
      { name: 'Soda drinks', reason: 'High sugar, no nutrition', alternative: 'Sparkling water or unsweetened tea' }
    ],
    'United Kingdom': [
      { name: 'Potato chips daily', reason: 'High fat, salt, and calories', alternative: 'Nuts or fruits' },
      { name: 'Processed meats', reason: 'High sodium and preservatives', alternative: 'Fresh meat or fish' }
    ],
    'Saint Lucia': [
      { name: 'Fried plantains daily', reason: 'High in calories and fat', alternative: 'Boiled plantains or breadfruit' },
      { name: 'Sugary drinks', reason: 'Empty calories leading to weight gain', alternative: 'Coconut water or fresh fruit juice' },
      { name: 'Processed snacks', reason: 'High sodium and preservatives', alternative: 'Fresh local fruits or nuts' }
    ]
  };
  
  return problematicFoods[country] || [
    { name: 'Sugary processed foods', reason: 'High in empty calories', alternative: 'Whole foods and fresh ingredients' }
  ];
}

/* ------------------ ANALYSIS ------------------ */

function analyzeNutritionStatus(dailyProgress = {}) {
  const {
    calories = 0,
    protein = 0,
    carbs = 0,
    fat = 0,
    goalCalories = 2000,
    proteinTarget = 100
  } = dailyProgress;

  // Normalize numeric inputs: callers may provide objects like { achieved: X } or nested shapes from frontend
  const consumed = (function getConsumed(val) {
    if (val && typeof val === 'object') return Number(val.achieved || val.total || 0) || 0;
    return Number(val) || 0;
  })(calories);

  const proteinConsumed = (function getProtein(val) {
    if (val && typeof val === 'object') return Number(val.achieved || val.total || 0) || 0;
    return Number(val) || 0;
  })(protein);

  const carbsConsumed = (function getCarbs(val) {
    if (val && typeof val === 'object') return Number(val.achieved || val.total || 0) || 0;
    return Number(val) || 0;
  })(carbs);

  const fatConsumed = (function getFat(val) {
    if (val && typeof val === 'object') return Number(val.achieved || val.total || 0) || 0;
    return Number(val) || 0;
  })(fat);

  const goalCals = Number(goalCalories) || 2000;
  const proteinT = Number(proteinTarget) || 100;

  const remaining = Math.max(0, goalCals - consumed);
  const proteinRemaining = Math.max(0, proteinT - proteinConsumed);

  const caloriePercent = goalCals > 0 ? Math.round((consumed / goalCals) * 100) : 0;
  const proteinPercent = proteinT > 0 ? Math.round((proteinConsumed / proteinT) * 100) : 0;

  const hour = new Date().getHours();
  let mealTimeLabel = 'Snack';
  let mealsLeft = 2;

  if (hour < 10) { mealTimeLabel = 'Breakfast'; mealsLeft = 4; }
  else if (hour < 14) { mealTimeLabel = 'Lunch'; mealsLeft = 3; }
  else if (hour < 18) { mealTimeLabel = 'Snack'; mealsLeft = 2; }
  else if (hour < 22) { mealTimeLabel = 'Dinner'; mealsLeft = 1; }

  // Ensure mealsLeft is at least 1 to avoid division by zero
  const safeMeals = Math.max(1, mealsLeft);

  let caloriesPerMeal = Math.round(remaining / safeMeals);
  if (!Number.isFinite(caloriesPerMeal) || Number.isNaN(caloriesPerMeal)) caloriesPerMeal = Math.round(remaining) || 0;

  let proteinPerMeal = Math.round(proteinRemaining / safeMeals);
  if (!Number.isFinite(proteinPerMeal) || Number.isNaN(proteinPerMeal)) proteinPerMeal = Math.round(proteinRemaining) || 0;

  let grade = 'C';
  if (caloriePercent >= 85 && caloriePercent <= 105 && proteinPercent >= 80) grade = 'A';
  else if (caloriePercent >= 70 && proteinPercent >= 60) grade = 'B';
  else if (proteinPercent < 40) grade = 'D';

  return {
    consumed,
    remaining,
    caloriePercent,
    proteinConsumed,
    proteinRemaining,
    proteinPercent,
    carbsConsumed,
    fatConsumed,
    mealTimeLabel,
    mealsLeft: safeMeals,
    caloriesPerMeal,
    proteinPerMeal,
    goalCalories: goalCals,
    proteinTarget: proteinT,
    grade
  };
}

/* ------------------ VALIDATION ------------------ */

function normalizeUserProfile(profile = {}) {
  return {
    country: profile.country || CONFIG.defaultCountry,
    weightGoal: profile.weightGoal || 'maintain',
    weight: Number(profile.weight) || 70,
    height: Number(profile.height) || 170,
    age: Number(profile.age) || 30,
    gender: profile.gender || 'male',
    economic_class: profile.economic_class || 'standard',
    dietary_preferences: Array.isArray(profile.dietary_preferences) ? profile.dietary_preferences : [],
    cuisine_preferences: Array.isArray(profile.cuisine_preferences) ? profile.cuisine_preferences : [],
    email: profile.email || ''
  };
}

function normalizeLog(log = {}) {
  return {
    foods: Array.isArray(log.foods) ? log.foods : [],
    exercises: Array.isArray(log.exercises) ? log.exercises : []
  };
}

/* ------------------ DETAILED ANALYSIS ------------------ */

async function generateDetailedAnalysis(userProfile, email) {
  const profile = normalizeUserProfile(userProfile);
  
  try {
    // Fetch user's complete daily history (last 30 days)
    const dailyHistoryQuery = await db.query(
      `SELECT date, foods, exercises, water_intake 
       FROM daily_logs 
       WHERE user_email = $1 
       ORDER BY date DESC 
       LIMIT 30`,
      [email]
    );
    
    const dailyHistory = dailyHistoryQuery.rows.map(row => ({
      date: row.date,
      foods: safeParseJson(row.foods, []),
      exercises: safeParseJson(row.exercises, []),
      waterIntake: row.water_intake || 0
    }));
    
    // Analyze each day's data
    const dailyAnalyses = [];
    let totalCalories = 0, totalProtein = 0, totalWater = 0;
    let totalExerciseCalories = 0;
    const foodFrequency = {};
    const exerciseFrequency = {};
    
    dailyHistory.forEach(day => {
      const dayAnalysis = analyzeDayData(day, profile);
      dailyAnalyses.push(dayAnalysis);
      
      // Aggregate totals
      totalCalories += dayAnalysis.totalCalories;
      totalProtein += dayAnalysis.totalProtein;
      totalWater += dayAnalysis.waterIntake;
      totalExerciseCalories += dayAnalysis.totalExerciseCalories;
      
      // Track food frequency
      const safeDayFoods = Array.isArray(day.foods) ? day.foods : [];
      safeDayFoods.forEach(food => {
        const name = food.name.toLowerCase();
        foodFrequency[name] = (foodFrequency[name] || 0) + 1;
      });
      
      // Track exercise frequency
      const safeDayExercises = Array.isArray(day.exercises) ? day.exercises : [];
      safeDayExercises.forEach(exercise => {
        const name = exercise.name.toLowerCase();
        exerciseFrequency[name] = (exerciseFrequency[name] || 0) + 1;
      });
    });
    
    const daysAnalyzed = dailyHistory.length;
    const safeDaysAnalyzed = Math.max(1, daysAnalyzed); // Avoid division by zero
    const averages = {
      calories: Math.round(totalCalories / safeDaysAnalyzed),
      protein: Math.round(totalProtein / safeDaysAnalyzed),
      water: Math.round(totalWater / safeDaysAnalyzed),
      exerciseCalories: Math.round(totalExerciseCalories / safeDaysAnalyzed)
    };
    
    // Identify patterns and issues
    const patterns = identifyPatterns(dailyAnalyses, foodFrequency, exerciseFrequency, averages);
    const recommendations = generateDetailedRecommendations(patterns, profile, foodFrequency);
    
    return {
      summary: {
        daysAnalyzed,
        averages,
        totalDays: dailyHistory.length,
        analysisPeriod: {
          start: dailyHistory[dailyHistory.length - 1]?.date,
          end: dailyHistory[0]?.date
        }
      },
      dailyAnalyses: dailyAnalyses.slice(0, 7), // Last 7 days detailed
      patterns,
      recommendations,
      foodFrequency: Object.entries(foodFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([food, count]) => ({ food, count })),
      exerciseFrequency: Object.entries(exerciseFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([exercise, count]) => ({ exercise, count }))
    };
  } catch (error) {
    console.error('Detailed analysis error:', error);
    throw error;
  }
}

function analyzeDayData(dayData, profile) {
  const { foods, exercises, waterIntake, date } = dayData;
  
  // Ensure foods and exercises are arrays
  const safeFoods = Array.isArray(foods) ? foods : [];
  const safeExercises = Array.isArray(exercises) ? exercises : [];
  
  // Calculate nutrition totals
  const totalCalories = safeFoods.reduce((sum, food) => sum + (food.calories || 0), 0);
  const totalProtein = safeFoods.reduce((sum, food) => {
    const protein = food.nutrients?.macros?.find(m => m.name === 'Protein');
    return sum + (protein?.amount || 0);
  }, 0);
  const totalCarbs = safeFoods.reduce((sum, food) => {
    const carbs = food.nutrients?.macros?.find(m => m.name === 'Carbs');
    return sum + (carbs?.amount || 0);
  }, 0);
  const totalFat = safeFoods.reduce((sum, food) => {
    const fat = food.nutrients?.macros?.find(m => m.name === 'Fat');
    return sum + (fat?.amount || 0);
  }, 0);
  
  const totalExerciseCalories = safeExercises.reduce((sum, exercise) => sum + (exercise.caloriesBurned || 0), 0);
  
  // Analyze individual foods
  const foodAnalyses = safeFoods.map(food => analyzeSingleFood(food));
  const exerciseAnalyses = safeExercises.map(exercise => analyzeSingleExercise(exercise));
  
  // Grade the day
  const grade = gradeDayPerformance(totalCalories, totalProtein, waterIntake, safeExercises.length, profile);
  
  return {
    date,
    nutrition: {
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      foodCount: safeFoods.length
    },
    exercise: {
      totalExerciseCalories,
      exerciseCount: safeExercises.length
    },
    hydration: {
      waterIntake,
      waterGoal: 8 // Standard 8 glasses goal
    },
    foodAnalyses,
    exerciseAnalyses,
    grade,
    issues: identifyDayIssues(foodAnalyses, exerciseAnalyses, waterIntake)
  };
}

function analyzeSingleFood(food) {
  const calories = food.calories || 0;
  const protein = food.nutrients?.macros?.find(m => m.name === 'Protein')?.amount || 0;
  const sodium = food.nutrients?.micros?.find(m => m.name === 'sodium')?.amount || 0;
  const sugar = food.nutrients?.micros?.find(m => m.name === 'sugar')?.amount || 0;
  const fiber = food.nutrients?.micros?.find(m => m.name === 'fiber')?.amount || 0;
  
  const issues = [];
  const benefits = [];
  
  // Analyze food quality
  if (calories > 500 && protein < 15) {
    issues.push('High calorie, low protein');
  }
  if (sodium > 800) {
    issues.push('High sodium');
  }
  if (sugar > 25) {
    issues.push('High sugar');
  }
  if (fiber > 8) {
    benefits.push('High fiber');
  }
  if (protein > 25 && calories < 400) {
    benefits.push('High protein, moderate calories');
  }
  
  return {
    name: food.name,
    calories,
    protein,
    sodium,
    sugar,
    fiber,
    issues,
    benefits,
    rating: calculateFoodRating(issues, benefits)
  };
}

function analyzeSingleExercise(exercise) {
  const caloriesBurned = exercise.caloriesBurned || 0;
  const duration = exercise.duration || 0;
  const intensity = exercise.intensity || 'moderate';
  
  const benefits = [];
  if (caloriesBurned > 300) {
    benefits.push('High calorie burn');
  }
  if (duration > 45) {
    benefits.push('Good duration');
  }
  if (intensity === 'high') {
    benefits.push('High intensity');
  }
  
  return {
    name: exercise.name,
    caloriesBurned,
    duration,
    intensity,
    benefits,
    rating: calculateExerciseRating(caloriesBurned, duration, intensity)
  };
}

function calculateFoodRating(issues, benefits) {
  const score = benefits.length - issues.length;
  if (score >= 2) return 'excellent';
  if (score === 1) return 'good';
  if (score === 0) return 'neutral';
  return 'poor';
}

function calculateExerciseRating(calories, duration, intensity) {
  let score = 0;
  if (calories > 300) score += 2;
  else if (calories > 200) score += 1;
  
  if (duration > 45) score += 1;
  if (intensity === 'high') score += 1;
  
  if (score >= 3) return 'excellent';
  if (score >= 2) return 'good';
  if (score >= 1) return 'moderate';
  return 'light';
}

function gradeDayPerformance(calories, protein, water, exerciseCount, profile) {
  let score = 0;
  
  // Calorie scoring
  const targetCalories = 2000; // Simplified target
  if (Math.abs(calories - targetCalories) <= 200) score += 2;
  else if (Math.abs(calories - targetCalories) <= 400) score += 1;
  
  // Protein scoring
  const targetProtein = profile.weight * 1.6;
  if (protein >= targetProtein) score += 2;
  else if (protein >= targetProtein * 0.8) score += 1;
  
  // Hydration scoring
  if (water >= 8) score += 2;
  else if (water >= 6) score += 1;
  
  // Exercise scoring
  if (exerciseCount >= 2) score += 2;
  else if (exerciseCount >= 1) score += 1;
  
  if (score >= 7) return 'A';
  if (score >= 5) return 'B';
  if (score >= 3) return 'C';
  if (score >= 1) return 'D';
  return 'F';
}

function identifyDayIssues(foodAnalyses, exerciseAnalyses, waterIntake) {
  const issues = [];
  
  const problematicFoods = foodAnalyses.filter(f => f.rating === 'poor');
  if (problematicFoods.length > 0) {
    issues.push(`${problematicFoods.length} problematic foods: ${problematicFoods.map(f => f.name).join(', ')}`);
  }
  
  if (waterIntake < 6) {
    issues.push('Low hydration');
  }
  
  if (exerciseAnalyses.length === 0) {
    issues.push('No exercise logged');
  }
  
  return issues;
}

function identifyPatterns(dailyAnalyses, foodFreq, exerciseFreq, averages) {
  const patterns = {
    nutrition: [],
    exercise: [],
    hydration: [],
    habits: []
  };
  
  // Nutrition patterns
  if (averages.calories < 1800) {
    patterns.nutrition.push('Consistently low calorie intake');
  } else if (averages.calories > 2500) {
    patterns.nutrition.push('Consistently high calorie intake');
  }
  
  if (averages.protein < (averages.calories * 0.15 / 4)) {
    patterns.nutrition.push('Low protein intake relative to calories');
  }
  
  // Exercise patterns
  const exerciseDays = dailyAnalyses.filter(day => day.exercise.exerciseCount > 0).length;
  if (exerciseDays < dailyAnalyses.length * 0.5) {
    patterns.exercise.push('Inconsistent exercise routine');
  } else if (exerciseDays >= dailyAnalyses.length * 0.8) {
    patterns.exercise.push('Consistent exercise routine');
  }
  
  // Hydration patterns
  if (averages.water < 6) {
    patterns.hydration.push('Consistently low water intake');
  } else if (averages.water >= 8) {
    patterns.hydration.push('Good hydration habits');
  }
  
  // Habit patterns
  const mostFrequentFoods = Object.entries(foodFreq).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (mostFrequentFoods.length > 0) {
    patterns.habits.push(`Frequently eats: ${mostFrequentFoods.map(([food]) => food).join(', ')}`);
  }
  
  return patterns;
}

function generateDetailedRecommendations(patterns, profile, foodFrequency) {
  const recommendations = {
    foods: [],
    exercises: [],
    habits: [],
    avoid: []
  };
  
  // Food recommendations based on patterns
  if (patterns.nutrition.includes('Low protein intake relative to calories')) {
    const proteinRecommendations = generatePersonalizedFoodRecommendations(
      profile, 
      { proteinPercent: 60, caloriePercent: 100 }, 
      []
    );
    recommendations.foods.push(...proteinRecommendations.slice(0, 3).map(r => r.name));
  }
  
  // Exercise recommendations
  if (patterns.exercise.includes('Inconsistent exercise routine')) {
    recommendations.exercises.push('Start with 20-30 minute walks 3 times per week');
    recommendations.exercises.push('Try bodyweight exercises at home');
  }
  
  // Habit recommendations
  if (patterns.hydration.includes('Consistently low water intake')) {
    recommendations.habits.push('Set hourly reminders to drink water');
    recommendations.habits.push('Keep a water bottle visible at all times');
  }
  
  // Foods to avoid based on frequency
  const highFrequencyFoods = Object.entries(foodFrequency)
    .filter(([food, count]) => count >= 10)
    .map(([food]) => food);
  
  if (highFrequencyFoods.length > 0) {
    recommendations.avoid.push(`Limit frequency of: ${highFrequencyFoods.join(', ')}`);
  }
  
  return recommendations;
}

/* ------------------ MAIN FUNCTION ------------------ */

async function generateCoachSuggestions(userProfile, todayLog, dailyProgress) {
  const profile = normalizeUserProfile(userProfile);
  const log = normalizeLog(todayLog);
  const analysis = analyzeNutritionStatus(dailyProgress);

  const totalBurned = log.exercises.reduce(
    (s, e) => s + (Number(e.caloriesBurned) || 0), 0
  );

  /* ---------- FOOD SOURCES ---------- */

  // Per user request: AI Coach should use Gemini (gemini-2.5-flash) only for suggestion generation and not require external food DBs.
  let apiFoods = []; // intentionally empty; we will not fetch from foodApi here


  /* ---------- PROMPT ---------- */

  const prompt = `
You are a professional nutritionist.

User:
- Country: ${profile.country}
- Goal: ${profile.weightGoal}
- BMI: ${(profile.weight / ((profile.height / 100) ** 2)).toFixed(1)} (${getBmiCategory(profile.weight, profile.height)})

Today:
- Calories: ${analysis.consumed}/${analysis.goalCalories}
- Protein: ${analysis.proteinConsumed}/${analysis.proteinTarget}g

Respond ONLY in JSON:
{
  "summary": "",
  "foodRecommendations": [],
  "mealPlan": "",
  "exerciseTip": "",
  "hydrationTip": ""
}
`;

  /* ---------- AI ---------- */
  
  try {
    const response = await geminiAdapter.generateSuggestion(prompt, CONFIG.modelName);
    const suggestions = safeParseJson(response);
    
    if (suggestions && typeof suggestions === 'object') {
      return suggestions;
    }
  } catch (error) {
    console.error('Gemini AI coach failed:', error.message || error);
    // Check if it's a rate limit error
    if (error.message && error.message.includes('RESOURCE_EXHAUSTED')) {
      console.log('Gemini rate limit reached, using enhanced fallback');
    }
  }

  /* ---------- ENHANCED FALLBACK - NUTRITIONIST LEVEL ANALYSIS ---------- */
  
  // Detailed food analysis
  const analyzeSpecificFoods = (foods) => {
    const problematicFoods = [];
    const goodFoods = [];
    const nutritionalIssues = [];
    
    foods.forEach(food => {
      const calories = food.calories || 0;
      const protein = food.nutrients?.macros?.find(m => m.name === 'Protein')?.amount || 0;
      const fiber = food.nutrients?.micros?.find(m => m.name === 'fiber')?.amount || 0;
      const sodium = food.nutrients?.micros?.find(m => m.name === 'sodium')?.amount || 0;
      const sugar = food.nutrients?.micros?.find(m => m.name === 'sugar')?.amount || 0;
      
      // Analyze food quality
      if (calories > 500 && protein < 20) {
        problematicFoods.push({
          name: food.name,
          issue: 'High calorie, low protein',
          reason: `${food.name} is calorie-dense but lacks adequate protein, which may leave you hungry soon`,
          alternative: 'Choose lean protein sources or add vegetables to increase satiety'
        });
      }
      
      if (sodium > 800) {
        problematicFoods.push({
          name: food.name,
          issue: 'High sodium',
          reason: `Excessive sodium can lead to bloating and increased blood pressure`,
          alternative: 'Opt for low-sodium seasonings and fresh ingredients'
        });
      }
      
      if (sugar > 30) {
        problematicFoods.push({
          name: food.name,
          issue: 'High sugar',
          reason: `High sugar foods cause energy spikes and crashes, and can lead to weight gain`,
          alternative: 'Choose whole fruits or natural sweeteners instead'
        });
      }
      
      // Identify good foods
      if (protein > 25 && calories < 400) {
        goodFoods.push({
          name: food.name,
          benefit: 'High protein, moderate calories',
          reason: `Excellent protein source that supports muscle maintenance and satiety`,
          nutrients: `Protein: ${protein}g, Calories: ${calories}`
        });
      }
      
      if (fiber > 8) {
        goodFoods.push({
          name: food.name,
          benefit: 'High fiber',
          reason: `Promotes digestive health and helps maintain stable blood sugar levels`,
          nutrients: `Fiber: ${fiber}g`
        });
      }
      
      // Nutritional patterns
      if (foods.filter(f => f.name.toLowerCase().includes('rice') || f.name.toLowerCase().includes('bread')).length > 2) {
        nutritionalIssues.push('High refined carbohydrate intake - consider whole grains');
      }
      
      if (foods.filter(f => f.name.toLowerCase().includes('fried') || f.name.toLowerCase().includes('oil')).length > 1) {
        nutritionalIssues.push('Multiple fried items - opt for grilled or steamed options');
      }
    });
    
    return { problematicFoods, goodFoods, nutritionalIssues };
  };
  
  // Enhanced fallback with detailed nutritionist analysis
  const grade = analysis.grade || 'C';
  const calorieStatus = analysis.caloriePercent > 105 ? 'exceeding' : 
                       analysis.caloriePercent < 85 ? 'below' : 'on track';
  const proteinStatus = analysis.proteinPercent > 100 ? 'exceeding' : 
                        analysis.proteinPercent < 80 ? 'below' : 'on track';
  
  // Analyze specific foods eaten today
  const { problematicFoods, goodFoods, nutritionalIssues } = analyzeSpecificFoods(log.foods);
  
  // Generate personalized food recommendations
  const personalizedRecommendations = generatePersonalizedFoodRecommendations(profile, analysis, log.foods);
  const avoidList = generatePersonalizedAvoidList(profile, log.foods);
  
  console.log('AI Coach: Generated personalized recommendations:', personalizedRecommendations?.length || 0);
  console.log('AI Coach: Generated avoid list:', avoidList?.length || 0);
  
  // Convert personalized recommendations to the expected format
  const safeRecommendations = Array.isArray(personalizedRecommendations) ? personalizedRecommendations : [];
  const safeAvoidList = Array.isArray(avoidList) ? avoidList : [];
  const safeProblematicFoods = Array.isArray(problematicFoods) ? problematicFoods : [];
  const safeGoodFoods = Array.isArray(goodFoods) ? goodFoods : [];
  const safeNutritionalIssues = Array.isArray(nutritionalIssues) ? nutritionalIssues : [];
  
  // Return the full recommendation objects, not just names
  let foodRecommendations = safeRecommendations;
  let whyEatThis = safeRecommendations.map(rec => `${rec.name || 'Food'}: ${rec.reason || 'Good for health'}`);
  let whyAvoidThat = safeAvoidList.map(item => `${item.food || 'Food'}: ${item.reason || 'Limit intake'}. Try: ${item.alternative || 'Healthier alternative'}`);
  
  // Add detailed food analysis from logged foods
  if (safeProblematicFoods.length > 0) {
    safeProblematicFoods.forEach(food => {
      whyAvoidThat.push(`${food.name || 'Food'}: ${food.reason || 'Avoid this food'}. Alternative: ${food.alternative || 'Choose healthier option'}`);
    });
  }
  
  if (safeGoodFoods.length > 0) {
    safeGoodFoods.forEach(food => {
      whyEatThis.push(`${food.name || 'Food'}: ${food.reason || 'Good for health'}. ${food.nutrients || 'Nutritious'}`);
    });
  }
  
  if (safeNutritionalIssues.length > 0) {
    safeNutritionalIssues.forEach(issue => {
      foodRecommendations.push(issue);
    });
  }
  
  // If still no specific recommendations, add defaults
  if (foodRecommendations.length === 0) {
    foodRecommendations.push('Continue your balanced eating pattern with variety');
    whyEatThis.push('Variety ensures you get all essential nutrients for optimal health');
  }
  
  let mealPlan = '';
  if (analysis.mealTimeLabel && analysis.caloriesPerMeal) {
    // Get personalized meal suggestions
    const mealSuggestions = safeRecommendations
      .filter(rec => (rec.calories || 0) <= (analysis.caloriesPerMeal || 500) + 100)
      .slice(0, 2);
    
    if (mealSuggestions.length > 0) {
      const suggestionText = mealSuggestions.map(s => `${s.name || 'Healthy meal'} (${s.portion || '1 serving'})`).join(' or ');
      mealPlan = `For ${analysis.mealTimeLabel}, aim for ~${analysis.caloriesPerMeal || 500} calories and ${analysis.proteinPerMeal || 20}g protein. Try: ${suggestionText}.`;
    } else {
      mealPlan = `For ${analysis.mealTimeLabel}, aim for ~${analysis.caloriesPerMeal || 500} calories and ${analysis.proteinPerMeal || 20}g protein.`;
    }
  } else {
    mealPlan = 'Focus on balanced meals with whole foods.';
  }
  
  return {
    summary: `Today's Nutrition Analysis: Grade ${grade || 'C'}. You've consumed ${analysis.consumed || 0} of ${analysis.goalCalories || 2000} calories (${analysis.caloriePercent || 0}%). Protein: ${analysis.proteinConsumed || 0}/${analysis.proteinTarget || 100}g (${analysis.proteinPercent || 0}%). ${safeRecommendations.length > 0 ? `Recommended: ${safeRecommendations[0].name || 'Healthy food'}` : 'Continue balanced eating.'}. ${safeAvoidList.length > 0 ? `${safeAvoidList.length} foods to limit.` : ''}`,
    
    foodRecommendations,
    
    // Detailed explanations
    whyEatThis,
    whyAvoidThat,
    
    // Specific food analysis
    problematicFoods: safeProblematicFoods.map(f => ({
      name: f.name || 'Food',
      issue: f.issue || 'Issue',
      reason: f.reason || 'Reason',
      alternative: f.alternative || 'Alternative'
    })),
    
    goodFoods: safeGoodFoods.map(f => ({
      name: f.name || 'Food',
      benefit: f.benefit || 'Benefit',
      reason: f.reason || 'Reason',
      nutrients: f.nutrients || 'Nutritious'
    })),
    
    nutritionalIssues: safeNutritionalIssues,
    
    mealPlan: `${mealPlan} ${safeNutritionalIssues.length > 0 ? 'Priority: ' + (safeNutritionalIssues[0] || 'Focus on balance') : ''}`,
    
    exerciseTip: (totalBurned || 0) > 0 
      ? `Excellent work burning ${totalBurned} calories! For optimal recovery, consume 20g of protein within 30 minutes of exercise.`
      : `Your body needs movement! Just 20 minutes of brisk walking can improve insulin sensitivity, boost metabolism, and enhance mood for hours.`,
    
    hydrationTip: `You've had ${(log.foods || []).length} food items today. Aim for 8-10 glasses of water. Proper hydration helps: digest your food, transport nutrients, maintain energy levels, and prevent false hunger signals.`,
    
    // Personalized cautions
    cautionFood: safeAvoidList.map(item => item.food || 'Food'),
    
    // Nutritional education
    nutritionalInsights: {
      calorieExplanation: calorieStatus === 'exceeding' 
        ? 'Excess calories are converted to fat through lipogenesis. Consistent surplus leads to weight gain.'
        : calorieStatus === 'below'
        ? 'Calorie deficit forces your body to use stored fat for energy, leading to weight loss.'
        : 'Perfect calorie balance maintains your current weight while providing optimal energy.',
      
      proteinExplanation: proteinStatus === 'below'
        ? 'Insufficient protein can cause muscle loss, weakened immunity, and increased hunger.'
        : proteinStatus === 'exceeding'
        ? 'Excess protein won\'t build more muscle but can stress kidneys and cause dehydration.'
        : 'Optimal protein intake supports muscle maintenance and satiety.',
      
      overallGrade: grade || 'C',
      nextSteps: grade === 'A' 
        ? 'Maintain this excellent pattern! Consider adding more variety.'
        : grade === 'B'
        ? 'Good progress! Focus on the specific recommendations above.'
        : grade === 'C'
        ? 'Room for improvement. Prioritize protein and portion control.'
        : 'Significant changes needed. Start with small, consistent improvements.'
    }
  };
}

/* ------------------ QUICK TIPS ------------------ */

async function getQuickFoodSuggestion(_, foodLogged, dailyProgress) {
  const analysis = analyzeNutritionStatus(dailyProgress);
  return {
    quickTip: `${foodLogged.name}: ${analysis.caloriePercent}% calories used, protein ${analysis.proteinPercent}%.`,
    progress: analysis
  };
}

async function getQuickExerciseSuggestion(_, exerciseLogged) {
  return {
    quickTip: `Burned ${exerciseLogged.caloriesBurned} kcal. Refuel with protein.`
  };
}

/* ------------------ DB ------------------ */

async function getUserGoals(email) {
  try {
    const res = await db.query(
      'SELECT * FROM user_goals WHERE user_email=$1 ORDER BY updated_at DESC LIMIT 1',
      [email]
    );
    return res.rows[0] || {};
  } catch {
    return {};
  }
}

/* ------------------ EXPORTS ------------------ */

module.exports = {
  generateCoachSuggestions,
  getQuickFoodSuggestion,
  getQuickExerciseSuggestion,
  generateDetailedAnalysis,
  analyzeNutritionStatus,
  getUserGoals
};
