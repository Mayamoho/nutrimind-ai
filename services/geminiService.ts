// import { DailyLog, FoodLog, ExerciseLog, MealType, User, UserGoals, DailyProgress, AISuggestions } from "../types";
// import { api } from './api';

// const multiFoodSchema = {
//     type: "ARRAY",
//     items: {
//         type: "OBJECT",
//         properties: {
//             foodName: { type: "STRING", description: "Name of the food item. e.g., 'Banana'." },
//             servingQuantity: { type: "NUMBER", description: "The quantity of the serving size identified. e.g., 1 if the serving is '1 medium banana'." },
//             servingUnit: { type: "STRING", description: "The unit of the serving size. e.g., 'medium banana', 'cup', '100g'." },
//             calories: { type: "NUMBER", description: "Estimated total calories for the identified serving quantity and unit." },
//             protein: { type: "NUMBER", description: "Estimated grams of protein for the serving." },
//             carbohydrates: { type: "NUMBER", description: "Estimated grams of carbohydrates for the serving." },
//             fat: { type: "NUMBER", description: "Estimated grams of fat for the serving." },
//             sodium: { type: "NUMBER", description: "Estimated milligrams of sodium for the serving." },
//             sugar: { type: "NUMBER", description: "Estimated grams of sugar for the serving. If not applicable, return 0." },
//             fiber: { type: "NUMBER", description: "Estimated grams of fiber for the serving. If not applicable, return 0." }
//         },
//         required: ["foodName", "servingQuantity", "servingUnit", "calories", "protein", "carbohydrates", "fat", "sodium", "sugar", "fiber"]
//     }
// };

// const singleExerciseSchema = {
//     type: "OBJECT",
//     properties: {
//         exerciseName: { type: "STRING", description: "Name of the exercise. e.g., 'Running'." },
//         duration: { type: "NUMBER", description: "Estimated duration of the exercise in minutes." },
//         caloriesBurned: { type: "NUMBER", description: "Estimated total calories burned for the entire duration." }
//     },
//     required: ["exerciseName", "duration", "caloriesBurned"]
// };

// const suggestionSchema = {
//     type: "OBJECT",
//     properties: {
//         positiveFood: {
//             type: "ARRAY",
//             items: { type: "STRING" },
//             description: "An array of 2-3 detailed, actionable, and encouraging suggestions for healthy foods. Mention specific meal ideas or pairings. If possible, suggest foods that are culturally relevant to the user's country. e.g., 'To boost your protein, consider adding lentils to your lunch. A simple dal with brown rice is a fantastic, fiber-rich option common in South Asian cuisine.'"
//         },
//         positiveExercise: {
//             type: "ARRAY",
//             items: { type: "STRING" },
//             description: "An array of 1-2 detailed and motivating suggestions for exercises or activities. Explain the benefits. e.g., 'Adding 20 minutes of high-intensity interval training (HIIT) twice a week, like alternating between sprinting and jogging, could significantly boost your metabolism.'"
//         },
//         cautionFood: {
//             type: "ARRAY",
//             items: { type: "STRING" },
//             description: "An array of 1-2 gentle, non-judgmental suggestions about foods to be mindful of. Explain the 'why' behind the suggestion in a helpful way. e.g., 'While fruit juices have vitamins, they can also be high in sugar without the fiber of whole fruit. Eating an orange instead of drinking juice will keep you full longer.'"
//         }
//     },
//     required: ["positiveFood", "positiveExercise", "cautionFood"]
// };


// // Maps the raw JSON response from Gemini into the FoodLog type
// const mapToFoodLog = (item: any, mealType: MealType): Omit<FoodLog, 'id' | 'timestamp'> => {
//     return {
//         name: item.foodName,
//         calories: item.calories,
//         mealType: mealType,
//         servingQuantity: item.servingQuantity,
//         servingUnit: item.servingUnit,
//         nutrients: {
//             macros: [
//                 { name: 'Protein', amount: item.protein, unit: 'g' },
//                 { name: 'Carbs', amount: item.carbohydrates, unit: 'g' },
//                 { name: 'Fat', amount: item.fat, unit: 'g' },
//             ],
//             micros: [
//                 { name: 'Sodium', amount: item.sodium, unit: 'mg' },
//                 { name: 'Sugar', amount: item.sugar, unit: 'g' },
//                 { name: 'Fiber', amount: item.fiber, unit: 'g' },
//             ],
//         }
//     };
// };

// export const analyzeFoodInput = async (
//     text: string,
//     mealType: MealType,
//     image?: { inlineData: { data: string, mimeType: string } }
// ): Promise<Omit<FoodLog, 'id' | 'timestamp'>[]> => {
    
//     const results = await api.analyzeFood(text, mealType, image, multiFoodSchema);
    
//     if (Array.isArray(results)) {
//         return results.map(item => mapToFoodLog(item, mealType));
//     }
//     // Handle cases where the API might unexpectedly not return an array
//     if (results && typeof results === 'object') {
//         return [mapToFoodLog(results, mealType)];
//     }

//     throw new Error("Invalid response format from AI for food analysis.");
// };


// export const analyzeExerciseInput = async (
//     text: string,
//     image?: { inlineData: { data: string, mimeType: string } }
// ): Promise<Omit<ExerciseLog, 'id' | 'timestamp'>> => {
    
//     const result = await api.analyzeExercise(text, image, singleExerciseSchema);
    
//     return {
//         name: result.exerciseName,
//         duration: result.duration,
//         caloriesBurned: result.caloriesBurned,
//     };
// };

// export const getAISuggestion = async (
//     user: User,
//     dailyLog: DailyLog,
//     userGoals: UserGoals,
//     dailyProgress: DailyProgress
// ): Promise<AISuggestions> => {
//     const prompt = `
//         You are an expert AI nutritionist and fitness coach. Your goal is to provide highly personalized, culturally-aware, and encouraging advice.

//         Based on the following user data, provide detailed, actionable nutrition and fitness suggestions. Frame the suggestions positively. Where possible, incorporate foods or activities that might be common or accessible in the user's country.
        
//         User Profile:
//         - Age: ${user.age}
//         - Gender: ${user.gender}
//         - Country: ${user.country}
//         - Weight: ${user.weight.toFixed(1)} kg
//         - Height: ${user.height} cm
//         - Goal: To ${userGoals.weightGoal} weight, aiming for ${userGoals.targetWeight} kg.

//         Today's Log:
//         - Food Eaten: ${dailyLog.foods.map(f => `${f.name} (${f.calories} kcal)`).join(', ') || 'None'}
//         - Exercises Done: ${dailyLog.exercises.map(e => `${e.name} (${e.caloriesBurned} kcal)`).join(', ') || 'None'}
//         - Passive Activity (NEAT): ${dailyLog.neatActivities.map(a => `${a.name} (~${a.calories} kcal)`).join(', ') || 'None'}
        
//         Today's Progress:
//         - Calories Consumed: ${Math.round(dailyProgress.calories.achieved)} kcal
//         - Calorie Target: ${Math.round(dailyProgress.goalCalories)} kcal
//         - Protein: ${Math.round(dailyProgress.protein)}g (Target: ${Math.round(dailyProgress.proteinTarget)}g)
//         - Carbs: ${Math.round(dailyProgress.carbs)}g (Target: ${Math.round(dailyProgress.carbTarget)}g)
//         - Fat: ${Math.round(dailyProgress.fat)}g (Target: ${Math.round(dailyProgress.fatTarget)}g)

//         Generate suggestions based on this data. Focus on what's going well and where there are opportunities for improvement.
//     `;
    
//     return api.getSuggestion(prompt, suggestionSchema);
// };

// services/geminiservice.ts
import { DailyLog, FoodLog, ExerciseLog, MealType, User, UserGoals, DailyProgress, AISuggestions } from "../types";
import { api } from './api';

const multiFoodSchema = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      foodName: { type: "STRING", description: "Name of the food item. e.g., 'Banana'." },
      servingQuantity: { type: "NUMBER", description: "The quantity of the serving size identified. e.g., 1 if the serving is '1 medium banana'." },
      servingUnit: { type: "STRING", description: "The unit of the serving size. e.g., 'medium banana', 'cup', '100g'." },
      calories: { type: "NUMBER", description: "Estimated total calories for the identified serving quantity and unit." },
      protein: { type: "NUMBER", description: "Estimated grams of protein for the serving." },
      carbohydrates: { type: "NUMBER", description: "Estimated grams of carbohydrates for the serving." },
      fat: { type: "NUMBER", description: "Estimated grams of fat for the serving." },
      sodium: { type: "NUMBER", description: "Estimated milligrams of sodium for the serving." },
      sugar: { type: "NUMBER", description: "Estimated grams of sugar for the serving. If not applicable, return 0." },
      fiber: { type: "NUMBER", description: "Estimated grams of fiber for the serving. If not applicable, return 0." }
    },
    required: ["foodName", "servingQuantity", "servingUnit", "calories", "protein", "carbohydrates", "fat", "sodium", "sugar", "fiber"]
  }
};

const singleExerciseSchema = {
  type: "OBJECT",
  properties: {
    exerciseName: { type: "STRING", description: "Name of the exercise. e.g., 'Running'." },
    duration: { type: "NUMBER", description: "Estimated duration of the exercise in minutes." },
    caloriesBurned: { type: "NUMBER", description: "Estimated total calories burned for the entire duration." }
  },
  required: ["exerciseName", "duration", "caloriesBurned"]
};

const suggestionSchema = {
  type: "OBJECT",
  properties: {
    positiveFood: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "An array of 2-3 detailed, actionable, and encouraging suggestions for healthy foods..."
    },
    positiveExercise: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "An array of 1-2 detailed and motivating suggestions for exercises or activities..."
    },
    cautionFood: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "An array of 1-2 gentle, non-judgmental suggestions about foods to be mindful of..."
    }
  },
  required: ["positiveFood", "positiveExercise", "cautionFood"]
};

// Maps the raw JSON response from Gemini into the FoodLog type
const mapToFoodLog = (item: any, mealType: MealType): Omit<FoodLog, 'id' | 'timestamp'> => {
  return {
    name: item.foodName,
    calories: item.calories,
    mealType: mealType,
    servingQuantity: item.servingQuantity,
    servingUnit: item.servingUnit,
    nutrients: {
      macros: [
        { name: 'Protein', amount: item.protein, unit: 'g' },
        { name: 'Carbs', amount: item.carbohydrates, unit: 'g' },
        { name: 'Fat', amount: item.fat, unit: 'g' },
      ],
      micros: [
        { name: 'Sodium', amount: item.sodium, unit: 'mg' },
        { name: 'Sugar', amount: item.sugar, unit: 'g' },
        { name: 'Fiber', amount: item.fiber, unit: 'g' },
      ],
    }
  };
};

export const analyzeFoodInput = async (
  text: string,
  mealType: MealType,
  image?: { inlineData: { data: string, mimeType: string } }
): Promise<Omit<FoodLog, 'id' | 'timestamp'>[]> => {

  try {
    const results = await api.analyzeFood(text, mealType, image, multiFoodSchema);

    // Some endpoints might return { result: [...] } or directly [...]
    const payload = Array.isArray(results) ? results : (results && results.result ? results.result : results);

    if (!Array.isArray(payload)) {
      // Try to coerce single object into array
      if (payload && typeof payload === 'object') {
        return [mapToFoodLog(payload, mealType)];
      }
      throw new Error('Invalid response format from AI — expected array of food objects.');
    }

    // Basic validation of items
    return payload.map((item: any) => {
      if (!item || typeof item !== 'object' || !item.foodName) {
        throw new Error('Invalid item in AI response for food analysis.');
      }
      return mapToFoodLog(item, mealType);
    });
  } catch (err: any) {
    console.error('analyzeFoodInput error:', err);
    if (err instanceof Error && /Network error/i.test(err.message)) {
      throw new Error('Network error while calling AI service. Please check your backend and network.');
    }
    throw err;
  }
};


export const analyzeExerciseInput = async (
  text: string,
  image?: { inlineData: { data: string, mimeType: string } }
): Promise<Omit<ExerciseLog, 'id' | 'timestamp'>> => {

  try {
    const result = await api.analyzeExercise(text, image, singleExerciseSchema);

    // handle wrapped responses like { result: {...} }
    const payload = (result && result.result) ? result.result : result;

    if (!payload || typeof payload !== 'object' || !payload.exerciseName) {
      throw new Error('Invalid response format from AI for exercise analysis.');
    }

    return {
      name: payload.exerciseName,
      duration: payload.duration,
      caloriesBurned: payload.caloriesBurned,
    };
  } catch (err: any) {
    console.error('analyzeExerciseInput error:', err);
    if (err instanceof Error && /Network error/i.test(err.message)) {
      throw new Error('Network error while calling AI service. Please check your backend and network.');
    }
    throw err;
  }
};

export const getAISuggestion = async (
  user: User,
  dailyLog: DailyLog,
  userGoals: UserGoals,
  dailyProgress: DailyProgress
): Promise<AISuggestions> => {
  const prompt = `
    You are an expert AI nutritionist and fitness coach. Your goal is to provide highly personalized, culturally-aware, and encouraging advice.

    Based on the following user data, provide detailed, actionable nutrition and fitness suggestions. Frame the suggestions positively. Where possible, incorporate foods or activities that might be common or accessible in the user's country.
    
    User Profile:
    - Age: ${user.age}
    - Gender: ${user.gender}
    - Country: ${user.country}
    - Weight: ${user.weight.toFixed(1)} kg
    - Height: ${user.height} cm
    - Goal: To ${userGoals.weightGoal} weight, aiming for ${userGoals.targetWeight} kg.

    Today's Log:
    - Food Eaten: ${dailyLog.foods.map(f => `${f.name} (${f.calories} kcal)`).join(', ') || 'None'}
    - Exercises Done: ${dailyLog.exercises.map(e => `${e.name} (${e.caloriesBurned} kcal)`).join(', ') || 'None'}
    - Passive Activity (NEAT): ${dailyLog.neatActivities.map(a => `${a.name} (~${a.calories} kcal)`).join(', ') || 'None'}
    
    Today's Progress:
    - Calories Consumed: ${Math.round(dailyProgress.calories.achieved)} kcal
    - Calorie Target: ${Math.round(dailyProgress.goalCalories)} kcal
    - Protein: ${Math.round(dailyProgress.protein)}g (Target: ${Math.round(dailyProgress.proteinTarget)}g)
    - Carbs: ${Math.round(dailyProgress.carbs)}g (Target: ${Math.round(dailyProgress.carbTarget)}g)
    - Fat: ${Math.round(dailyProgress.fat)}g (Target: ${Math.round(dailyProgress.fatTarget)}g)

    Generate suggestions based on this data. Focus on what's going well and where there are opportunities for improvement.
  `;

  try {
    const suggestionResult = await api.getSuggestion(prompt, suggestionSchema);
    // Unwrap if server returned { result: {...} } or { suggestion: {...} }
    const payload = suggestionResult && (suggestionResult.result || suggestionResult.suggestion) ? (suggestionResult.result || suggestionResult.suggestion) : suggestionResult;

    // Basic validation
    if (!payload || typeof payload !== 'object' || !payload.positiveFood) {
      throw new Error('Invalid AI suggestion format. Expected object with positiveFood, positiveExercise, cautionFood.');
    }

    return payload as AISuggestions;
  } catch (err: any) {
    console.error('getAISuggestion error:', err);
    if (err instanceof Error && /Network error/i.test(err.message)) {
      throw new Error('Network error while fetching AI suggestions. Please check backend.');
    }
    throw err;
  }
};
