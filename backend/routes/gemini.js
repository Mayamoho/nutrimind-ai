/**
 * Gemini AI Routes - Simplified to use only Gemini 2.5 Flash
 * Food & Exercise analysis via Google Gemini AI
 */

const express = require('express');
const auth = require('../middleware/auth');
const geminiAdapter = require('../services/geminiAdapter');

const router = express.Router();

function safeParseJson(text) {
  let clean = text.trim();
  if (clean.startsWith('```json')) clean = clean.slice(7);
  if (clean.startsWith('```')) clean = clean.slice(3);
  if (clean.endsWith('```')) clean = clean.slice(0, -3);
  return JSON.parse(clean.trim());
}

/**
 * POST /api/gemini/analyze-food
 * Analyze food from text, image, or voice transcription using Gemini 2.5 Flash
 * Body: { prompt: "2 rotis with dal", image?: { inlineData: { mimeType, data } } }
 */
router.post('/analyze-food', auth, async (req, res) => {
  const { prompt, image } = req.body;
  let responseSent = false;
  
  const sendResponse = (data, status = 200) => {
    if (!responseSent && !res.headersSent) {
      responseSent = true;
      clearTimeout(timeout);
      return res.status(status).json(data);
    }
  };
  
  const timeout = setTimeout(() => {
    sendResponse({ msg: 'AI request timed out', error: 'TIMEOUT' }, 504);
  }, 10000);
  
  try {
    if (!geminiAdapter?.isAvailable()) {
      const fallbackData = await getFallbackFoodData(prompt);
      return sendResponse(fallbackData);
    }

    const parsed = await geminiAdapter.analyzeFood(prompt, image?.inlineData);
    if (Array.isArray(parsed) && parsed.length) {
      return sendResponse(parsed);
    }
    
    const fallbackData = await getFallbackFoodData(prompt);
    return sendResponse(fallbackData);
  } catch (err) {
    console.error('Gemini analyze-food error:', err.message || err);
    if (err.code === 'TIMEOUT' || err.status === 504) {
      return sendResponse({ msg: 'AI request timed out', error: 'TIMEOUT' }, 504);
    }
    if (err.status === 429 || (err.message && String(err.message).includes('429'))) {
      console.log('Rate limit exceeded for food analysis, using fallback data');
      const fallbackData = await getFallbackFoodData(prompt);
      return sendResponse(fallbackData);
    }
    if (!res.headersSent) {
      console.log('Returning fallback food data due to error');
      const fallbackData = await getFallbackFoodData(prompt);
      return sendResponse(fallbackData);
    }
  }
});

// Enhanced fallback food data function using aggregator service
async function getFallbackFoodData(prompt) {
  try {
    console.log('Using aggregator service for food fallback');
    const foodAggregatorService = require('../services/foodAggregatorService');
    const results = await foodAggregatorService.searchFood(prompt, 'world');
    
    if (results && results.length > 0) {
      // Convert aggregator results to Gemini format
      return results.map(item => ({
        foodName: item.name,
        servingQuantity: item.servingQuantity || 1,
        servingUnit: item.servingUnit || 'serving',
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbohydrates: Number(item.carbs) || 0,
        fat: Number(item.fat) || 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        potassium: 0,
        cholesterol: 0,
        vitaminA: 0,
        vitaminC: 0,
        vitaminD: 0,
        calcium: 0,
        iron: 0,
        magnesium: 0,
        zinc: 0,
        source: item.source || 'Aggregator'
      }));
    }
  } catch (error) {
    console.warn('Aggregator service failed, using minimal fallback:', error.message);
  }
  
  // Minimal fallback if aggregator fails
  return [{
    foodName: prompt,
    calories: 150,
    servingQuantity: 1,
    servingUnit: 'serving',
    protein: 10,
    carbohydrates: 20,
    fat: 5,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    potassium: 0,
    cholesterol: 0,
    vitaminA: 0,
    vitaminC: 0,
    vitaminD: 0,
    calcium: 0,
    iron: 0,
    magnesium: 0,
    zinc: 0
  }];
}

/**
 * POST /api/gemini/analyze-exercise
 * Analyze exercise from text, image, or voice transcription using Gemini 2.5 Flash
 * Body: { prompt: "30 min jogging", image?: { inlineData: { mimeType, data } } }
 */
router.post('/analyze-exercise', auth, async (req, res) => {
  const { prompt, image, userWeight } = req.body;
  let responseSent = false;
  
  const sendResponse = (data, status = 200) => {
    if (!responseSent && !res.headersSent) {
      responseSent = true;
      clearTimeout(timeout);
      return res.status(status).json(data);
    }
  };
  
  const timeout = setTimeout(() => {
    sendResponse({ msg: 'AI request timed out', error: 'TIMEOUT' }, 504);
  }, 10000);
  
  try {
    if (!geminiAdapter?.isAvailable()) {
      const fallbackData = await getFallbackExerciseData(prompt);
      return sendResponse(fallbackData);
    }

    const parsed = await geminiAdapter.analyzeExercise(prompt, userWeight, image?.inlineData);
    if (parsed && typeof parsed === 'object') {
      return sendResponse(parsed);
    }
    
    const fallbackData = await getFallbackExerciseData(prompt);
    return sendResponse(fallbackData);
  } catch (err) {
    console.error('Gemini analyze-exercise error:', err.message || err);
    if (err.code === 'TIMEOUT' || err.status === 504) {
      return sendResponse({ msg: 'AI request timed out', error: 'TIMEOUT' }, 504);
    }
    if (err.status === 429 || (err.message && String(err.message).includes('429'))) {
      console.log('Rate limit exceeded for exercise analysis, using fallback data');
      const fallbackData = await getFallbackExerciseData(prompt);
      return sendResponse(fallbackData);
    }
    if (!res.headersSent) {
      console.log('Returning fallback exercise data due to error');
      const fallbackData = await getFallbackExerciseData(prompt);
      return sendResponse(fallbackData);
    }
  }
});

// Enhanced fallback exercise data function with better matching
async function getFallbackExerciseData(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Enhanced exercise database with more variations
  const exerciseDatabase = {
    'walking': { exerciseName: 'Walking', duration: 30, caloriesBurned: 120 },
    'brisk walking': { exerciseName: 'Brisk Walking', duration: 30, caloriesBurned: 150 },
    'run': { exerciseName: 'Running', duration: 30, caloriesBurned: 300 },
    'running': { exerciseName: 'Running', duration: 30, caloriesBurned: 300 },
    'jog': { exerciseName: 'Jogging', duration: 30, caloriesBurned: 250 },
    'jogging': { exerciseName: 'Jogging', duration: 30, caloriesBurned: 250 },
    'cycle': { exerciseName: 'Cycling', duration: 30, caloriesBurned: 200 },
    'cycling': { exerciseName: 'Cycling', duration: 30, caloriesBurned: 200 },
    'swim': { exerciseName: 'Swimming', duration: 30, caloriesBurned: 250 },
    'swimming': { exerciseName: 'Swimming', duration: 30, caloriesBurned: 250 },
    'yoga': { exerciseName: 'Yoga', duration: 30, caloriesBurned: 90 },
    'gym': { exerciseName: 'Gym Workout', duration: 45, caloriesBurned: 200 },
    'weight': { exerciseName: 'Weight Training', duration: 30, caloriesBurned: 150 },
    'strength': { exerciseName: 'Strength Training', duration: 30, caloriesBurned: 180 },
    'cardio': { exerciseName: 'Cardio', duration: 30, caloriesBurned: 200 },
    'dance': { exerciseName: 'Dancing', duration: 30, caloriesBurned: 180 },
    'sport': { exerciseName: 'Sports', duration: 30, caloriesBurned: 200 },
    'sports': { exerciseName: 'Sports', duration: 30, caloriesBurned: 200 },
    'hiit': { exerciseName: 'HIIT', duration: 30, caloriesBurned: 360 },
    'aerobics': { exerciseName: 'Aerobics', duration: 30, caloriesBurned: 200 },
    'pilates': { exerciseName: 'Pilates', duration: 30, caloriesBurned: 150 },
    'stretch': { exerciseName: 'Stretching', duration: 15, caloriesBurned: 50 }
  };
  
  // Try exact matches first
  for (const [key, exercise] of Object.entries(exerciseDatabase)) {
    if (lowerPrompt.includes(key)) {
      return exercise;
    }
  }
  
  // Extract duration from prompt if available
  const durationMatch = prompt.match(/(\d+)\s*(min|minute|hour|hr)/i);
  const defaultDuration = durationMatch ? 
    (durationMatch[2].startsWith('h') ? parseInt(durationMatch[1]) * 60 : parseInt(durationMatch[1])) : 30;
  
  // Generic fallback with extracted duration
  return {
    exerciseName: prompt.charAt(0).toUpperCase() + prompt.slice(1),
    duration: defaultDuration,
    caloriesBurned: Math.round(defaultDuration * 5), // 5 cal/min average
    intensity: 'moderate'
  };
}

/**
 * POST /api/gemini/suggestion
 * Generate AI nutritionist suggestions using Gemini 2.5 Flash
 * Body: { prompt: string, schema?: any }
 */
router.post('/suggestion', async (req, res) => {
  const { prompt, schema, model = 'gemini-2.5-flash' } = req.body;
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ msg: 'AI request timed out', error: 'TIMEOUT' });
    }
  }, 15000); // 15 second timeout for suggestions
  
  try {
    if (!geminiAdapter?.isAvailable()) {
      clearTimeout(timeout);
      return res.status(503).json({ msg: 'Gemini unavailable', error: 'UNAVAILABLE' });
    }

    const parsed = await geminiAdapter.generateSuggestion(prompt, model);
    if (parsed && typeof parsed === 'object') {
      clearTimeout(timeout);
      return res.json(parsed);
    }
    
    clearTimeout(timeout);
    return res.status(404).json({ msg: 'No suggestions generated' });
  } catch (err) {
    clearTimeout(timeout);
    console.error('Gemini suggestion error:', err.message || err);
    if (err.code === 'TIMEOUT' || err.status === 504) {
      return res.status(504).json({ msg: 'AI request timed out', error: 'TIMEOUT' });
    }
    if (err.status === 429 || (err.message && String(err.message).includes('429'))) {
      return res.status(429).json({ msg: 'Rate limit exceeded', error: 'RATE_LIMIT', retryAfter: 30 });
    }
    if (!res.headersSent) {
      return res.status(500).json({ msg: 'Error generating suggestion', error: err.message || err });
    }
  }
});

/**
 * POST /api/gemini/chat
 * Chat with NutriBot
 */
router.post('/chat', async (req, res) => {
  const { message, context } = req.body;
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ msg: 'AI request timed out', error: 'TIMEOUT' });
    }
  }, 10000); // 10 second timeout
  
  try {
    if (!geminiAdapter?.isAvailable()) {
      clearTimeout(timeout);
      return res.status(503).json({ msg: 'Gemini unavailable', error: 'UNAVAILABLE' });
    }

    const systemPrompt = `You are NutriBot, a friendly AI health assistant. Help with nutrition, exercise, health. Be concise (2-4 sentences).
Context: ${context || 'None'}`;
    const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;

    const response = await geminiAdapter.generateSuggestion(fullPrompt, 'gemini-2.5-flash');
    clearTimeout(timeout);
    
    if (response && typeof response === 'object') {
      // Extract the response text from the suggestion object
      const responseText = response.summary || response.foodRecommendations?.join('. ') || 
                         response.mealPlan || response.exerciseTip || "I'm here to help with nutrition and fitness questions!";
      res.json({ response: responseText });
    } else {
      res.json({ response: "I'm NutriBot, your AI health assistant! How can I help you today?" });
    }
  } catch (err) {
    clearTimeout(timeout);
    console.error('Gemini chat error:', err.message || err);
    if (err.code === 'TIMEOUT' || err.status === 504) {
      return res.status(504).json({ msg: 'AI request timed out', error: 'TIMEOUT' });
    }
    if (err.status === 429 || (err.message && String(err.message).includes('429'))) {
      return res.status(429).json({ msg: 'Rate limit. Try again soon!', error: 'RATE_LIMIT' });
    }
    if (!res.headersSent) {
      // Return fallback response instead of error
      res.json({ response: "I'm NutriBot! I can help with nutrition, exercise, and health advice. What would you like to know?" });
    }
  }
});

/**
 * POST /api/gemini/meal-plan
 * Generate personalized meal plan via AI
 */
router.post('/meal-plan', async (req, res) => {
  const { country, weightGoal, goalCalories, proteinTarget, economicClass, gender, age } = req.body;
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ msg: 'AI request timed out', error: 'TIMEOUT' });
    }
  }, 15000); // 15 second timeout for meal plans
  
  try {
    if (!geminiAdapter?.isAvailable()) {
      clearTimeout(timeout);
      return res.json(getFallbackMealPlan(country, weightGoal, goalCalories, proteinTarget, economicClass, gender, age));
    }

    const budgetLabels = { low_income: 'Budget-Friendly', lower_middle: 'Economical', upper_middle: 'Moderate', high_income: 'Premium' };
    const budget = budgetLabels[economicClass] || 'Moderate';

    const prompt = `Create a daily meal plan:
- Country: ${country || 'India'}
- Goal: ${weightGoal || 'maintain'} weight
- Calories: ${goalCalories || 2000} kcal
- Protein: ${proteinTarget || 80}g
- Budget: ${budget}
- Gender: ${gender || 'male'}, Age: ${age || 30}

Return JSON:
{
  "meals": [
    {"name": "Breakfast", "description": "Food with portion", "calories": 400, "protein": 15, "foods": ["item1"]},
    {"name": "Lunch", "description": "...", "calories": 600, "protein": 30, "foods": ["item1"]},
    {"name": "Snack", "description": "...", "calories": 200, "protein": 10, "foods": ["item1"]},
    {"name": "Dinner", "description": "...", "calories": 500, "protein": 25, "foods": ["item1"]}
  ],
  "tips": ["tip1", "tip2"]
}

Use traditional ${country || 'local'} foods for ${budget} budget. Only valid JSON.`;

    const response = await geminiAdapter.generateSuggestion(prompt, 'gemini-2.5-flash');
    clearTimeout(timeout);
    
    if (response && typeof response === 'object') {
      return res.json(response);
    } else {
      return res.json(getFallbackMealPlan(country, weightGoal, goalCalories, proteinTarget, economicClass, gender, age));
    }
  } catch (err) {
    clearTimeout(timeout);
    console.error('Gemini meal plan error:', err.message || err);
    if (err.code === 'TIMEOUT' || err.status === 504) {
      return res.status(504).json({ msg: 'AI request timed out', error: 'TIMEOUT' });
    }
    if (err.status === 429 || (err.message && String(err.message).includes('429'))) {
      return res.status(429).json({ msg: 'Rate limit', error: 'RATE_LIMIT' });
    }
    if (!res.headersSent) {
      // Return fallback meal plan instead of error
      return res.json(getFallbackMealPlan(country, weightGoal, goalCalories, proteinTarget, economicClass, gender, age));
    }
  }
});

// Fallback meal plan function
function getFallbackMealPlan(country, weightGoal, goalCalories, proteinTarget, economicClass, gender, age) {
  const calories = goalCalories || 2000;
  const protein = proteinTarget || 80;
  
  return {
    meals: [
      {
        name: "Breakfast",
        description: "Oatmeal with fruits and nuts",
        calories: Math.round(calories * 0.25),
        protein: Math.round(protein * 0.25),
        foods: ["Oatmeal", "Banana", "Almonds"]
      },
      {
        name: "Lunch",
        description: "Grilled chicken with rice and vegetables",
        calories: Math.round(calories * 0.35),
        protein: Math.round(protein * 0.4),
        foods: ["Chicken Breast", "Brown Rice", "Mixed Vegetables"]
      },
      {
        name: "Snack",
        description: "Greek yogurt with berries",
        calories: Math.round(calories * 0.1),
        protein: Math.round(protein * 0.15),
        foods: ["Greek Yogurt", "Berries"]
      },
      {
        name: "Dinner",
        description: "Fish with sweet potato and salad",
        calories: Math.round(calories * 0.3),
        protein: Math.round(protein * 0.2),
        foods: ["Grilled Fish", "Sweet Potato", "Green Salad"]
      }
    ],
    tips: [
      "Drink plenty of water throughout the day",
      "Include protein in every meal for satiety",
      "Choose whole foods over processed options",
      "Adjust portions based on your activity level"
    ]
  };
}

module.exports = router;
