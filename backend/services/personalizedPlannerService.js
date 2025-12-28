/**
 * Personalized Planner Service with Real Food Data
 * - Uses Open Food Facts API for real food recommendations (FREE)
 * - Considers user profile, goals, country, and logged foods
 * - Provides 7 combos per meal with budget variations
 * - Country-specific fallback meals for authentic local cuisine
 */

const { ECONOMIC_CLASSES } = require('./plannerConstants');
const { COMPREHENSIVE_MEAL_DATABASE, getCountryMeals, getOpenFoodFactsCode, regenerateMealDatabase } = require('./comprehensiveMealDatabase');

// Open Food Facts API configuration (FREE - No API key required)
const OFF_BASE = 'https://world.openfoodfacts.org/api/v2';

// Country to cuisine mapping for meal planning
const COUNTRY_TO_CUISINE = {
  'United States': 'American',
  'USA': 'American',
  'Canada': 'American',
  'United Kingdom': 'British',
  'UK': 'British',
  'Australia': 'American',
  'New Zealand': 'American',
  'India': 'Indian',
  'Pakistan': 'Indian',
  'Bangladesh': 'Indian',
  'Sri Lanka': 'Indian',
  'China': 'Chinese',
  'Japan': 'Japanese',
  'South Korea': 'Korean',
  'Thailand': 'Thai',
  'Vietnam': 'Vietnamese',
  'Malaysia': 'Chinese',
  'Singapore': 'Chinese',
  'Indonesia': 'Chinese',
  'Philippines': 'Filipino',
  'Mexico': 'Mexican',
  'Spain': 'Spanish',
  'Italy': 'Italian',
  'France': 'French',
  'Germany': 'German',
  'Greece': 'Greek',
  'Turkey': 'Middle Eastern',
  'Lebanon': 'Middle Eastern',
  'Egypt': 'Mediterranean',
  'Morocco': 'Mediterranean',
  'Nigeria': 'African',
  'South Africa': 'African',
  'Brazil': 'Latin American',
  'Argentina': 'Latin American',
  'Colombia': 'Latin American',
  'Russia': 'Eastern European',
  'Poland': 'Eastern European',
  'Netherlands': 'European',
  'Sweden': 'European',
  'Norway': 'European',
  'Denmark': 'European'
};

function mapBudgetIdToKey(budgetId) {
  const mapping = {
    budget: 'budget',
    economical: 'economical',
    moderate: 'moderate',
    premium: 'premium'
  };
  return mapping[budgetId] || 'moderate';
}

// Fetch real foods from Open Food Facts API (FREE)
async function fetchFoodsFromOpenFoodFacts(query, number = 10, country = '') {
  try {
    // Build search URL with better query structure
    let searchUrl = `${OFF_BASE}/search?search_terms=${encodeURIComponent(query)}&page_size=${number}&fields=product_name,brands,nutriments,image_url,countries,categories_tags&sort_by=unique_scans_n`;
    
    // Add country-specific filtering if provided
    if (country) {
      // Map country names to country codes for OFF
      const countryCodeMap = {
        'United States': 'en:us',
        'USA': 'en:us',
        'Canada': 'en:ca',
        'United Kingdom': 'en:gb',
        'UK': 'en:gb',
        'Australia': 'en:au',
        'India': 'en:in',
        'Pakistan': 'en:pk',
        'Bangladesh': 'en:bd',
        'Sri Lanka': 'en:lk',
        'China': 'en:cn',
        'Japan': 'en:jp',
        'Germany': 'en:de',
        'France': 'en:fr',
        'Italy': 'en:it',
        'Spain': 'en:es',
        'Japan': 'en:jp',
        'China': 'en:cn',
        'India': 'en:in',
        'Brazil': 'en:br',
        'Mexico': 'en:mx',
        'Bangladesh': 'en:bd',
        'Afghanistan': 'en:af',
        'Pakistan': 'en:pk',
        'Russia': 'en:ru',
        'Poland': 'en:pl',
        'Netherlands': 'en:nl',
        'Sweden': 'en:se',
        'Norway': 'en:no',
        'Denmark': 'en:dk'
      };
      
      const countryCode = countryCodeMap[country];
      if (countryCode) {
        searchUrl += `&tagtype_0=countries&tag_contains_0=contains&tag_0=${countryCode}`;
      }
    }
    
    console.log('Open Food Facts search URL:', searchUrl);
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      return getCountrySpecificFallbackFoods(query, country);
    }
    
    const data = await response.json();
    
    return data.products?.map(product => ({
      id: product.code || product.id,
      name: product.product_name || product.brands || 'Unknown Product',
      calories: Math.round(product.nutriments?.['energy-kcal_100g'] || product.nutriments?.energy || 300),
      protein: Math.round(product.nutriments?.proteins_100g || 20),
      carbs: Math.round(product.nutriments?.carbohydrates_100g || 30),
      fat: Math.round(product.nutriments?.fat_100g || 10),
      image: product.image_url,
      source: 'openfoodfacts',
      brand: product.brands || '',
      countries: product.countries || '',
      categories: product.categories_tags || []
    })) || getCountrySpecificFallbackFoods(query, country);
  } catch (error) {
    console.log('Error fetching from Open Food Facts:', error.message);
    return getCountrySpecificFallbackFoods(query, country);
  }
}

// Get comprehensive meals from database
function getCountrySpecificFallbackFoods(mealType, country) {
  return getCountryMeals(country, mealType, 'moderate').map(meal => meal.foods[0]);
}

// Budget-aware meal combinations using comprehensive database
function getBudgetAwareMealCombos(mealType, country, budgetClass) {
  // Get meals directly from comprehensive database for the specific budget class
  const budgetMeals = getCountryMeals(country, mealType, budgetClass);
  
  return {
    modifications: getBudgetModifications(budgetClass),
    meals: budgetMeals.map(meal => meal.foods[0])
  };
}

// Helper function to get budget modifications text
function getBudgetModifications(budgetClass) {
  const modifications = {
    budget: 'Basic ingredients, simple preparation',
    economical: 'Good variety, cost-effective ingredients',
    moderate: 'Full variety, balanced ingredients',
    premium: 'Premium ingredients, extra variety'
  };
  return modifications[budgetClass] || modifications.moderate;
}

// Build real food combos using comprehensive database
async function buildRealFoodCombos(mealType, country, targetCal, targetProtein, userProfile, budgetKey) {
  const loggedFoods = userProfile.todayLog?.foods || [];
  
  // Get budget-specific meals from comprehensive database
  const budgetMeals = getCountryMeals(country, mealType, budgetKey);
  console.log(`Debug - ${mealType} meals for ${country}, budget ${budgetKey}:`, budgetMeals.length);
  
  // Filter out already logged foods
  const loggedFoodNames = new Set(loggedFoods.map(f => f.name.toLowerCase()));
  const filteredMeals = budgetMeals.filter(meal => 
    !loggedFoodNames.has(meal.name.toLowerCase())
  );
  console.log(`Debug - Filtered ${mealType} meals:`, filteredMeals.length);
  
  // Add randomness: shuffle the filtered meals to get different combinations each time
  const shuffledMeals = filteredMeals.sort(() => Math.random() - 0.5);
  
  // Return top 7 combos for this budget class
  const result = shuffledMeals.slice(0, 7).map(meal => ({
    ...meal,
    targetCalories: targetCal,
    targetProtein: targetProtein
  }));
  console.log(`Debug - Final ${mealType} combos:`, result.length);
  return result;
}

async function generateMealCombos(mealType, country, targetCal, protein, userProfile, budgetKey) {
  return await buildRealFoodCombos(mealType, country, targetCal, protein, userProfile, budgetKey);
}

async function generateDailyPlan(userProfile = {}, budgetId = 'moderate') {
  const country = userProfile.country || 'United States';
  const goalCalories = userProfile.goalCalories || 2000;
  const proteinTarget = userProfile.proteinTarget || 100;
  const comboKey = mapBudgetIdToKey(budgetId);

  // Regenerate database occasionally for fresh combinations (30% chance)
  if (Math.random() < 0.3) {
    regenerateMealDatabase();
  }

  // Calculate targets based on already logged foods
  const loggedCalories = userProfile.todayLog?.foods?.reduce((sum, f) => sum + (f.calories || 0), 0) || 0;
  const loggedProtein = userProfile.todayLog?.foods?.reduce((sum, f) => {
    const proteinNutrient = f.nutrients?.macros?.find(m => m.name === 'Protein');
    return sum + (proteinNutrient?.amount || 0);
  }, 0) || 0;
  const remainingCalories = Math.max(800, goalCalories - loggedCalories);
  const remainingProtein = Math.max(20, proteinTarget - loggedProtein);

  const targets = {
    breakfast: { cal: Math.round(remainingCalories * 0.25), protein: Math.round(remainingProtein * 0.25) },
    lunch: { cal: Math.round(remainingCalories * 0.35), protein: Math.round(remainingProtein * 0.35) },
    dinner: { cal: Math.round(remainingCalories * 0.30), protein: Math.round(remainingProtein * 0.30) },
    snacks: { cal: Math.round(remainingCalories * 0.10), protein: Math.round(remainingProtein * 0.10) }
  };

  // Generate real food combos for each meal
  const [breakfastCombos, lunchCombos, dinnerCombos, snacksCombos] = await Promise.all([
    buildRealFoodCombos('breakfast', country, targets.breakfast.cal, targets.breakfast.protein, userProfile, comboKey),
    buildRealFoodCombos('lunch', country, targets.lunch.cal, targets.lunch.protein, userProfile, comboKey),
    buildRealFoodCombos('dinner', country, targets.dinner.cal, targets.dinner.protein, userProfile, comboKey),
    buildRealFoodCombos('snack', country, targets.snacks.cal, targets.snacks.protein, userProfile, comboKey)
  ]);

  const plan = {
    personalizedNote: `Generated for ${userProfile.weightGoal || 'maintain'} goal with ${goalCalories} kcal target. Already consumed: ${loggedCalories} cal, ${loggedProtein}g protein.`,
    userContext: {
      loggedToday: userProfile.todayLog?.foods?.map(f => f.name).join(', ') || 'None',
      caloriesConsumed: loggedCalories,
      proteinConsumed: loggedProtein,
      exerciseBurned: userProfile.todayLog?.exercises?.reduce((sum, e) => sum + (e.caloriesBurned || 0), 0) || 0,
      remainingCalories,
      remainingProtein
    },
    breakfast: {
      targetCalories: targets.breakfast.cal,
      targetProtein: targets.breakfast.protein,
      time: '7:00 - 9:00 AM',
      tip: userProfile.weightGoal === 'lose' ? 'Start with high-protein, low-cal options' : 'Start with a protein-rich meal to stay satisfied',
      combos: breakfastCombos
    },
    lunch: {
      targetCalories: targets.lunch.cal,
      targetProtein: targets.lunch.protein,
      time: '12:00 - 2:00 PM',
      tip: userProfile.weightGoal === 'gain' ? 'Largest meal - focus on protein and complex carbs' : 'Include balance of protein, carbs and vegetables',
      combos: lunchCombos
    },
    snacks: {
      targetCalories: targets.snacks.cal,
      targetProtein: targets.snacks.protein,
      time: '4:00 - 5:00 PM',
      tip: userProfile.weightGoal === 'lose' ? 'Keep it light and protein-focused' : 'Healthy snack to maintain energy',
      combos: snacksCombos
    },
    dinner: {
      targetCalories: targets.dinner.cal,
      targetProtein: targets.dinner.protein,
      time: '7:00 - 9:00 PM',
      tip: userProfile.weightGoal === 'lose' ? 'Lighter than lunch, finish 2hrs before bed' : 'Balanced meal with moderate carbs',
      combos: dinnerCombos
    },
    tips: [
      `Goal: ${userProfile.weightGoal || 'maintain'} - ${goalCalories} kcal daily target`,
      `Budget level: ${comboKey}`,
      `Cuisine preference: ${COUNTRY_TO_CUISINE[country] || 'American'}`,
      loggedCalories > 0 ? `Already logged: ${loggedCalories} calories` : 'No foods logged yet',
      userProfile.gender === 'female' ? 'Consider iron-rich foods' : 'Ensure adequate protein intake',
      'Drink water before meals for better satiety'
    ],
    apiSourced: { 
      breakfast: breakfastCombos.filter(c => c.foods.some(f => f.source === 'openfoodfacts')).length,
      lunch: lunchCombos.filter(c => c.foods.some(f => f.source === 'openfoodfacts')).length,
      dinner: dinnerCombos.filter(c => c.foods.some(f => f.source === 'openfoodfacts')).length,
      snacks: snacksCombos.filter(c => c.foods.some(f => f.source === 'openfoodfacts')).length
    },
    country,
    economicClass: comboKey
  };

  return plan;
}

async function generateWeeklyPlan(userProfile = {}, budgetId = 'moderate') {
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const comboKey = mapBudgetIdToKey(budgetId);
  const week = [];

  for (let i = 0; i < days.length; i++) {
    const dayPlan = await generateDailyPlan(userProfile, budgetId);
    week.push({
      day: days[i],
      theme: i % 2 === 0 ? 'Protein Focus' : 'Balanced Nutrition',
      focus: i % 2 === 0 ? 'protein' : 'balanced',
      targetCalories: dayPlan.breakfast.targetCalories + dayPlan.lunch.targetCalories + dayPlan.dinner.targetCalories + dayPlan.snacks.targetCalories,
      targetProtein: dayPlan.breakfast.targetProtein + dayPlan.lunch.targetProtein + dayPlan.dinner.targetProtein + dayPlan.snacks.targetProtein,
      meals: {
        breakfast: { 
          combo: dayPlan.breakfast.combos[0]?.name || 'Breakfast Combo', 
          calories: dayPlan.breakfast.targetCalories, 
          protein: dayPlan.breakfast.targetProtein,
          foods: dayPlan.breakfast.combos[0]?.foods || []
        },
        lunch: { 
          combo: dayPlan.lunch.combos[0]?.name || 'Lunch Combo', 
          calories: dayPlan.lunch.targetCalories, 
          protein: dayPlan.lunch.targetProtein,
          foods: dayPlan.lunch.combos[0]?.foods || []
        },
        dinner: { 
          combo: dayPlan.dinner.combos[0]?.name || 'Dinner Combo', 
          calories: dayPlan.dinner.targetCalories, 
          protein: dayPlan.dinner.targetProtein,
          foods: dayPlan.dinner.combos[0]?.foods || []
        },
        snacks: { 
          combo: dayPlan.snacks?.combos[0]?.name || 'Snack Combo', 
          calories: dayPlan.snacks?.targetCalories || 0, 
          protein: dayPlan.snacks?.targetProtein || 0,
          foods: dayPlan.snacks?.combos[0]?.foods || []
        }
      }
    });
  }

  return {
    week: week,
    weeklyTips: [
      'Prep proteins on weekend for busy weekdays',
      'Vary your vegetables throughout the week for nutrients',
      'Stay hydrated with 8+ glasses of water daily',
      userProfile.weightGoal === 'lose' ? 'Include one vegetarian day per week' : 'Ensure adequate protein on training days'
    ],
    shoppingList: {
      proteins: ['Chicken Breast', 'Eggs', 'Greek Yogurt', 'Lentils', 'Tofu'],
      carbs: ['Brown Rice', 'Quinoa', 'Whole Wheat Bread', 'Sweet Potatoes'],
      vegetables: ['Spinach', 'Broccoli', 'Bell Peppers', 'Tomatoes', 'Onions'],
      fruits: ['Berries', 'Bananas', 'Apples', 'Oranges'],
      healthy_fats: ['Avocado', 'Nuts', 'Olive Oil']
    }
  };
}

function generateWorkoutPlan(userProfile = {}) {
  const weightGoal = userProfile.weightGoal || 'maintain';
  const workouts = {
    lose: { focus: 'Fat Burning & Cardio', workouts: [ { name: 'HIIT Session', duration: 20, calories: 250, intensity: 'High', type: 'Cardio', description: 'Intervals to burn fat' } ] },
    gain: { focus: 'Strength & Hypertrophy', workouts: [ { name: 'Strength Circuit', duration: 45, calories: 220, intensity: 'High', type: 'Strength', description: 'Compound lifts' } ] },
    maintain: { focus: 'Balanced Fitness', workouts: [ { name: 'Mixed Cardio', duration: 30, calories: 180, intensity: 'Moderate', type: 'Cardio', description: 'Walk, jog, cycle mix' } ] }
  };

  return {
    focus: workouts[weightGoal]?.focus || 'Balanced Fitness',
    personalNote: `Workout plan for ${weightGoal}`,
    workouts: workouts[weightGoal]?.workouts || workouts['maintain'].workouts,
    tips: ['Warm up 5-10 minutes', 'Stay hydrated']
  };
}

module.exports = {
  generateDailyPlan,
  generateWeeklyPlan,
  generateWorkoutPlan,
  mapBudgetIdToKey,
  ECONOMIC_CLASSES
};
