import { FoodLog, MealType } from '../types';
import { analyzeFoodInput as geminiAnalyzeFood } from './geminiService.js';

// Local fallback food database
const LOCAL_FOOD_DATABASE: { [key: string]: Partial<FoodLog> } = {
  'rice': { name: 'Rice', calories: 130, servingQuantity: 1, servingUnit: 'cup' },
  'bread': { name: 'Bread', calories: 80, servingQuantity: 2, servingUnit: 'slices' },
  'chicken': { name: 'Chicken Breast', calories: 165, servingQuantity: 100, servingUnit: 'g' },
  'egg': { name: 'Egg', calories: 70, servingQuantity: 1, servingUnit: 'large' },
  'milk': { name: 'Milk', calories: 150, servingQuantity: 1, servingUnit: 'cup' },
  'banana': { name: 'Banana', calories: 105, servingQuantity: 1, servingUnit: 'medium' },
  'apple': { name: 'Apple', calories: 95, servingQuantity: 1, servingUnit: 'medium' },
  'dal': { name: 'Dal (Lentils)', calories: 120, servingQuantity: 1, servingUnit: 'cup' },
  'roti': { name: 'Roti', calories: 70, servingQuantity: 1, servingUnit: 'piece' },
  'vegetable': { name: 'Mixed Vegetables', calories: 50, servingQuantity: 1, servingUnit: 'cup' },
  'protein': { name: 'Protein Source', calories: 150, servingQuantity: 100, servingUnit: 'g' },
  'carbs': { name: 'Carbohydrate', calories: 100, servingQuantity: 1, servingUnit: 'serving' }
};

function findLocalFoodMatch(text: string): Partial<FoodLog> | null {
  const lowerText = text.toLowerCase();
  for (const [key, food] of Object.entries(LOCAL_FOOD_DATABASE)) {
    if (lowerText.includes(key)) {
      return food;
    }
  }
  return null;
}

export const analyzeFoodInput = async (text: string, mealType: MealType): Promise<FoodLog[]> => {
  console.log(`Analyzing food input with Gemini: "${text}" for meal type: ${mealType}`);
  
  try {
    const geminiResult = await Promise.race([
      geminiAnalyzeFood(text, mealType),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Gemini timeout after 5 seconds')), 5000)
      )
    ]) as FoodLog[];
    
    if (geminiResult && geminiResult.length > 0) {
      console.log('Using Gemini analysis result');
      // Add missing id and timestamp to Gemini results
      return geminiResult.map(food => ({
        ...food,
        id: `gemini-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      }));
    }
  } catch (error: any) {
    console.error('Gemini analysis failed:', error.message);
    console.log('Falling back to local food database');
    
    // Fallback to local database
    const localMatch = findLocalFoodMatch(text);
    if (localMatch) {
      const fallbackFood: FoodLog = {
        ...localMatch,
        name: localMatch.name || text,
        calories: localMatch.calories || 100,
        mealType,
        servingQuantity: localMatch.servingQuantity || 1,
        servingUnit: localMatch.servingUnit || 'serving',
        nutrients: {
          macros: [
            { name: 'Protein', amount: Math.round((localMatch.calories || 100) * 0.15 / 4), unit: 'g' },
            { name: 'Carbs', amount: Math.round((localMatch.calories || 100) * 0.55 / 4), unit: 'g' },
            { name: 'Fat', amount: Math.round((localMatch.calories || 100) * 0.30 / 9), unit: 'g' }
          ],
          micros: []
        },
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };
      return [fallbackFood];
    }
    
    // Last resort - create generic food entry
    const genericFood: FoodLog = {
      name: text,
      calories: 150, // Default estimate
      mealType,
      servingQuantity: 1,
      servingUnit: 'serving',
      nutrients: {
        macros: [
          { name: 'Protein', amount: 15, unit: 'g' },
          { name: 'Carbs', amount: 20, unit: 'g' },
          { name: 'Fat', amount: 5, unit: 'g' }
        ],
        micros: []
      },
      id: `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    return [genericFood];
  }

  return [];
};

export const searchFood = async (query: string): Promise<FoodLog[]> => {
  console.log(`Searching for food with Gemini: "${query}"`);
  
  try {
    const geminiResult = await Promise.race([
      geminiAnalyzeFood(query, MealType.Snacks),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Gemini timeout after 5 seconds')), 5000)
      )
    ]) as FoodLog[];
    
    if (geminiResult && geminiResult.length > 0) {
      console.log(`Using Gemini search result - ${geminiResult.length} items`);
      return geminiResult.map(food => ({
        ...food,
        id: `gemini-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      }));
    }
  } catch (error: any) {
    console.error('Gemini search failed:', error.message);
    console.log('Falling back to local food database');
    
    // Fallback to local database
    const localMatch = findLocalFoodMatch(query);
    if (localMatch) {
      const fallbackFood: FoodLog = {
        ...localMatch,
        name: localMatch.name || query,
        calories: localMatch.calories || 100,
        mealType: MealType.Snacks,
        servingQuantity: localMatch.servingQuantity || 1,
        servingUnit: localMatch.servingUnit || 'serving',
        nutrients: {
          macros: [
            { name: 'Protein', amount: Math.round((localMatch.calories || 100) * 0.15 / 4), unit: 'g' },
            { name: 'Carbs', amount: Math.round((localMatch.calories || 100) * 0.55 / 4), unit: 'g' },
            { name: 'Fat', amount: Math.round((localMatch.calories || 100) * 0.30 / 9), unit: 'g' }
          ],
          micros: []
        },
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };
      return [fallbackFood];
    }
  }

  return [];
};
