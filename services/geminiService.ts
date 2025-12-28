/**
 * Gemini Service - Simplified to use only Gemini 2.5 Flash
 * Food and exercise analysis via Google Gemini AI
 */

import { DailyLog, FoodLog, ExerciseLog, MealType, User, UserGoals, DailyProgress, AISuggestions } from "../types";
import { api } from './api';

/**
 * Analyze food input using Gemini 2.5 Flash
 */
export const analyzeFoodInput = async (
  text: string,
  mealType: MealType,
  _image?: { inlineData: { data: string, mimeType: string } }
): Promise<Omit<FoodLog, 'id' | 'timestamp'>[]> => {
  console.log('Using Gemini 2.5 Flash for food analysis');
  
  try {
    const gem = await api.analyzeFood(text, mealType, _image);
    console.log('Gemini food analysis response:', gem);
    if (Array.isArray(gem) && gem.length) {
      return gem.map((item: any) => {
        const foodName = item.foodName || item.name || item.item || 'Food';
        console.log('Processing food item:', { item, foodName });
        return {
          name: foodName,
          calories: Math.round(Number(item.calories) || 0),
          mealType,
          servingQuantity: item.servingQuantity || 1,
          servingUnit: item.servingUnit || 'serving',
          nutrients: {
            macros: [
              { name: 'Protein', amount: Number(item.protein) || Number(item.proteins) || 0, unit: 'g' },
              { name: 'Carbs', amount: Number(item.carbohydrates) || Number(item.carbs) || 0, unit: 'g' },
              { name: 'Fat', amount: Number(item.fat) || 0, unit: 'g' }
            ],
            micros: item.micros || item.nutrients?.micros || []
          }
        };
      });
    }
  } catch (e: any) {
    console.error('Gemini food analysis failed:', e.message || e);
    console.log('Falling back to search API for food analysis');
    
    // Fallback to search API when Gemini fails
    try {
      const searchResults = await api.searchFoods(text);
      if (searchResults && searchResults.length > 0) {
        console.log('Using search API results for food analysis');
        return searchResults.map(item => ({
          name: item.name,
          calories: item.calories,
          mealType,
          servingQuantity: item.servingQuantity || 1,
          servingUnit: item.servingUnit || 'serving',
          nutrients: item.nutrients || {
            macros: [
              { name: 'Protein', amount: 0, unit: 'g' },
              { name: 'Carbs', amount: 0, unit: 'g' },
              { name: 'Fat', amount: 0, unit: 'g' }
            ],
            micros: []
          }
        }));
      }
    } catch (searchError: any) {
      console.warn('Search API fallback also failed:', searchError.message);
    }
    
    throw new Error(`Food analysis failed: ${e.message}`);
  }

  throw new Error('No food analysis available from Gemini');
};

/**
 * Analyze exercise input using Gemini 2.5 Flash
 */
export const analyzeExerciseInput = async (
  text: string,
  _image?: { inlineData: { data: string, mimeType: string } }
): Promise<Omit<ExerciseLog, 'id' | 'timestamp'>> => {
  console.log('Using Gemini 2.5 Flash for exercise analysis');
  
  try {
    const parsed = await api.analyzeExercise(text, _image);
    if (parsed && typeof parsed === 'object') {
      return {
        name: parsed.exerciseName || 'Exercise',
        duration: parsed.duration || 30,
        caloriesBurned: Math.round(parsed.caloriesBurned || 0),
      };
    }
  } catch (e: any) {
    console.error('Gemini exercise analysis failed:', e.message || e);
    console.log('Falling back to search API for exercise analysis');
    
    // Fallback to search API when Gemini fails
    try {
      const searchResults = await api.searchExercises(text);
      if (searchResults && searchResults.length > 0) {
        console.log('Using search API results for exercise analysis');
        const firstResult = searchResults[0];
        return {
          name: firstResult.name,
          duration: firstResult.duration || 30,
          caloriesBurned: Math.round(firstResult.caloriesBurned || 0),
        };
      }
    } catch (searchError: any) {
      console.warn('Search API fallback also failed:', searchError.message);
    }
    
    console.log('Falling back to local exercise database');
    
    // Fallback to local exercise database
    const fallbackExercise = getLocalExerciseMatch(text);
    if (fallbackExercise) {
      return fallbackExercise;
    }
    
    // Last resort - create generic exercise entry
    return {
      name: text,
      duration: 30,
      caloriesBurned: 150, // Default estimate
    };
  }

  // Last resort fallback
  return {
    name: text,
    duration: 30,
    caloriesBurned: 150,
  };
};

// Local exercise database for fallbacks
function getLocalExerciseMatch(text: string): Omit<ExerciseLog, 'id' | 'timestamp'> | null {
  const lowerText = text.toLowerCase();
  
  const exerciseDatabase: { [key: string]: Omit<ExerciseLog, 'id' | 'timestamp'> } = {
    'walking': { name: 'Walking', duration: 30, caloriesBurned: 120 },
    'running': { name: 'Running', duration: 30, caloriesBurned: 300 },
    'jogging': { name: 'Jogging', duration: 30, caloriesBurned: 250 },
    'cycling': { name: 'Cycling', duration: 30, caloriesBurned: 200 },
    'swimming': { name: 'Swimming', duration: 30, caloriesBurned: 250 },
    'yoga': { name: 'Yoga', duration: 30, caloriesBurned: 90 },
    'gym': { name: 'Gym Workout', duration: 45, caloriesBurned: 200 },
    'weight': { name: 'Weight Training', duration: 30, caloriesBurned: 150 },
    'cardio': { name: 'Cardio', duration: 30, caloriesBurned: 200 },
    'dance': { name: 'Dancing', duration: 30, caloriesBurned: 180 },
    'sports': { name: 'Sports', duration: 30, caloriesBurned: 200 },
    'exercise': { name: 'General Exercise', duration: 30, caloriesBurned: 150 },
    'workout': { name: 'Workout', duration: 30, caloriesBurned: 180 }
  };
  
  for (const [key, exercise] of Object.entries(exerciseDatabase)) {
    if (lowerText.includes(key)) {
      return exercise;
    }
  }
  
  return null;
}

/**
 * Generate AI coach suggestions using Gemini 2.5 Flash
 */
export const generateSuggestion = async (
  prompt: string,
  model = 'gemini-2.5-flash'
): Promise<AISuggestions> => {
  console.log('Using Gemini 2.5 Flash for AI coach suggestions');
  
  try {
    const response = await api.getSuggestion(prompt, { model });
    if (response && typeof response === 'object') {
      return response as AISuggestions;
    }
  } catch (e: any) {
    console.error('Gemini suggestion generation failed:', e.message || e);
    throw new Error(`Gemini suggestion failed: ${e.message}`);
  }

  throw new Error('No suggestions available from Gemini');
};

// Exercise database for local lookup (no API needed)
const EXERCISE_DATABASE: Record<string, { caloriesPerMinute: number }> = {
  'running': { caloriesPerMinute: 11 },
  'jogging': { caloriesPerMinute: 8 },
  'walking': { caloriesPerMinute: 4 },
  'cycling': { caloriesPerMinute: 8 },
  'swimming': { caloriesPerMinute: 10 },
  'yoga': { caloriesPerMinute: 3 },
  'weight training': { caloriesPerMinute: 5 },
  'weightlifting': { caloriesPerMinute: 5 },
  'hiit': { caloriesPerMinute: 12 },
  'dancing': { caloriesPerMinute: 6 },
  'aerobics': { caloriesPerMinute: 7 },
  'pilates': { caloriesPerMinute: 4 },
  'basketball': { caloriesPerMinute: 8 },
  'football': { caloriesPerMinute: 9 },
  'soccer': { caloriesPerMinute: 9 },
  'tennis': { caloriesPerMinute: 7 },
  'badminton': { caloriesPerMinute: 6 },
  'volleyball': { caloriesPerMinute: 5 },
  'cricket': { caloriesPerMinute: 5 },
  'golf': { caloriesPerMinute: 4 },
  'hiking': { caloriesPerMinute: 6 },
  'climbing': { caloriesPerMinute: 9 },
  'rowing': { caloriesPerMinute: 8 },
  'jumping rope': { caloriesPerMinute: 12 },
  'skipping': { caloriesPerMinute: 12 },
  'boxing': { caloriesPerMinute: 10 },
  'martial arts': { caloriesPerMinute: 9 },
  'stretching': { caloriesPerMinute: 2 },
  'elliptical': { caloriesPerMinute: 7 },
  'stair climbing': { caloriesPerMinute: 9 },
  'push ups': { caloriesPerMinute: 7 },
  'sit ups': { caloriesPerMinute: 5 },
  'squats': { caloriesPerMinute: 6 },
  'plank': { caloriesPerMinute: 4 },
  'burpees': { caloriesPerMinute: 10 },
};

/**
 * Quick exercise lookup (fallback for common exercises)
 */
export const quickExerciseLookup = (name: string, duration: number): Omit<ExerciseLog, 'id' | 'timestamp'> => {
  const normalizedName = name.toLowerCase().trim();
  const exercise = EXERCISE_DATABASE[normalizedName];
  
  if (exercise) {
    return {
      name: name,
      duration: duration,
      caloriesBurned: Math.round(exercise.caloriesPerMinute * duration),
    };
  }
  
  // Default estimate if not found
  return {
    name: name,
    duration: duration,
    caloriesBurned: Math.round(5 * duration), // 5 cal/min default
  };
};

/**
 * Get AI suggestions - still uses Gemini but with caching and rate limiting
 * This is called less frequently (once per session or on manual refresh)
 */
export const getAISuggestion = async (
  user: User,
  dailyLog: DailyLog,
  userGoals: UserGoals,
  dailyProgress: DailyProgress
): Promise<AISuggestions> => {
  // Generate rule-based suggestions instead of AI
  // This avoids Gemini rate limits entirely
  return generateRuleBasedSuggestions(user, dailyLog, userGoals, dailyProgress);
};

/**
 * Generate suggestions using rules instead of AI
 * No API calls - completely local
 */
export function generateRuleBasedSuggestions(
  user: User,
  dailyLog: DailyLog,
  userGoals: UserGoals,
  dailyProgress: DailyProgress
): AISuggestions {
  const positiveFood: string[] = [];
  const positiveExercise: string[] = [];
  const cautionFood: string[] = [];

  const caloriesConsumed = dailyProgress.calories?.achieved || 0;
  const calorieTarget = dailyProgress.goalCalories || 2000;
  const proteinConsumed = dailyProgress.protein || 0;
  const proteinTarget = dailyProgress.proteinTarget || 50;
  const exerciseBurn = dailyProgress.calories?.eat || 0;

  // Country-specific food suggestions
  const countryFoods: Record<string, { protein: string[], healthy: string[], snacks: string[] }> = {
    'India': {
      protein: ['dal (lentils)', 'paneer', 'chickpeas (chana)', 'eggs', 'Greek yogurt (dahi)'],
      healthy: ['vegetable curry with roti', 'khichdi', 'idli sambar', 'poha', 'upma'],
      snacks: ['roasted chana', 'sprouts chaat', 'fruit with chaat masala', 'buttermilk (chaas)']
    },
    'Bangladesh': {
      protein: ['fish curry', 'dal', 'eggs', 'chicken', 'lentils'],
      healthy: ['fish with rice', 'vegetable bhaji', 'dal bhat', 'mixed vegetables'],
      snacks: ['muri mix', 'fruits', 'pitha', 'chanachur']
    },
    'Pakistan': {
      protein: ['chicken tikka', 'dal', 'eggs', 'kebabs', 'yogurt'],
      healthy: ['dal chawal', 'vegetable curry', 'grilled chicken', 'chapati with sabzi'],
      snacks: ['fruit chaat', 'roasted nuts', 'lassi', 'dates']
    },
    'United States of America': {
      protein: ['grilled chicken breast', 'Greek yogurt', 'eggs', 'lean beef', 'fish'],
      healthy: ['quinoa bowl', 'grilled salmon', 'turkey sandwich', 'vegetable stir-fry'],
      snacks: ['apple with peanut butter', 'mixed nuts', 'protein bar', 'hummus with veggies']
    },
    'United Kingdom': {
      protein: ['grilled fish', 'chicken breast', 'eggs', 'beans on toast', 'cottage cheese'],
      healthy: ['jacket potato with tuna', 'vegetable soup', 'grilled salmon', 'porridge'],
      snacks: ['fruit and yogurt', 'oatcakes', 'nuts', 'vegetable sticks']
    },
  };

  const defaultFoods = {
    protein: ['lean chicken', 'fish', 'eggs', 'Greek yogurt', 'legumes'],
    healthy: ['grilled protein with vegetables', 'whole grain meals', 'salads', 'soups'],
    snacks: ['fruits', 'nuts', 'yogurt', 'vegetable sticks']
  };

  const foods = countryFoods[user.country] || defaultFoods;

  // Calorie-based suggestions
  if (caloriesConsumed < calorieTarget * 0.5) {
    positiveFood.push(`You're under your calorie target. Consider a nutritious meal like ${foods.healthy[Math.floor(Math.random() * foods.healthy.length)]} to fuel your body.`);
  } else if (caloriesConsumed > calorieTarget * 1.1) {
    cautionFood.push(`You've exceeded your calorie target. Consider lighter options for your remaining meals and focus on vegetables and lean proteins.`);
  } else {
    positiveFood.push(`Great job staying within your calorie range! Keep making balanced choices.`);
  }

  // Protein-based suggestions
  if (proteinConsumed < proteinTarget * 0.5) {
    const proteinSuggestion = foods.protein[Math.floor(Math.random() * foods.protein.length)];
    positiveFood.push(`Boost your protein intake with ${proteinSuggestion}. Protein helps with muscle maintenance and keeps you feeling full.`);
  } else if (proteinConsumed >= proteinTarget) {
    positiveFood.push(`Excellent protein intake today! You've met your target of ${proteinTarget}g.`);
  }

  // Snack suggestions
  if (dailyLog.foods?.length < 3) {
    const snackSuggestion = foods.snacks[Math.floor(Math.random() * foods.snacks.length)];
    positiveFood.push(`For a healthy snack, try ${snackSuggestion} - it's nutritious and satisfying.`);
  }

  // Exercise suggestions
  if (exerciseBurn < 100) {
    if (userGoals.weightGoal === 'lose') {
      positiveExercise.push(`Adding 30 minutes of brisk walking or light jogging could help burn an extra 150-200 calories and support your weight loss goal.`);
    } else {
      positiveExercise.push(`Consider adding some physical activity today - even a 20-minute walk can boost your mood and energy levels.`);
    }
  } else if (exerciseBurn >= 300) {
    positiveExercise.push(`Great workout today! You've burned ${exerciseBurn} calories through exercise. Remember to stay hydrated and refuel with protein.`);
  } else {
    positiveExercise.push(`Good activity level today with ${exerciseBurn} calories burned. Keep up the consistent effort!`);
  }

  // Goal-specific suggestions
  if (userGoals.weightGoal === 'lose') {
    cautionFood.push(`For weight loss, focus on high-volume, low-calorie foods like vegetables and lean proteins. They keep you full without excess calories.`);
  } else if (userGoals.weightGoal === 'gain') {
    positiveFood.push(`To support weight gain, include calorie-dense nutritious foods like nuts, avocados, and whole grains in your meals.`);
  }

  // Water reminder
  const waterIntake = dailyLog.waterIntake || 0;
  if (waterIntake < 1500) {
    positiveExercise.push(`Don't forget to stay hydrated! Aim for at least 2-2.5 liters of water daily.`);
  }

  return {
    positiveFood: positiveFood.slice(0, 3),
    positiveExercise: positiveExercise.slice(0, 2),
    cautionFood: cautionFood.slice(0, 2),
  };
}
