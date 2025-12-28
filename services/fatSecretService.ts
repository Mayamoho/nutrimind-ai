/**
 * FatSecret Food Service
 * Replaces Gemini-based food analysis with FatSecret API
 * Implements Adapter Pattern to transform FatSecret data to app format
 */

import { FoodLog, MealType, NutrientInfo } from '../types';
import { api } from './api';

export interface FatSecretFood {
  id: string;
  name: string;
  brandName: string | null;
  type: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingDescription: string;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  potassium?: number;
  cholesterol?: number;
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  calcium?: number;
  iron?: number;
  magnesium?: number;
  zinc?: number;
}

export interface FatSecretServing {
  id: string;
  description: string;
  metricAmount: number;
  metricUnit: string;
  numberOfUnits: number;
  measurementDescription: string;
  isDefault: boolean;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    saturatedFat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    potassium: number;
    cholesterol: number;
    vitaminA: number;
    vitaminC: number;
    vitaminD: number;
    calcium: number;
    iron: number;
    magnesium?: number;
    zinc?: number;
  };
}

export interface FatSecretDetailedFood {
  id: string;
  name: string;
  brandName: string | null;
  type: string;
  url: string;
  servings: FatSecretServing[];
}

/**
 * Search foods using FatSecret API
 */
export const searchFood = async (
  query: string,
  limit: number = 20
): Promise<FatSecretFood[]> => {
  try {
    const response = await api.fatSecretSearch(query, limit);
    return response.foods || [];
  } catch (err) {
    console.error('FatSecret search error:', err);
    throw err;
  }
};

/**
 * Get detailed food info by ID
 */
export const getFoodDetails = async (foodId: string): Promise<FatSecretDetailedFood> => {
  try {
    const response = await api.fatSecretGetFood(foodId);
    return response.food;
  } catch (err) {
    console.error('FatSecret get food error:', err);
    throw err;
  }
};

/**
 * Analyze food text input and return formatted food logs
 * Tries Gemini (proxied) first, then falls back to FatSecret/aggregator/local
 */
export const analyzeFood = async (
  text: string,
  mealType: MealType
): Promise<Omit<FoodLog, 'id' | 'timestamp'>[]> => {
  // Preferred: call Gemini via backend
  try {
    const gem = await api.analyzeFood(text, mealType);
    if (Array.isArray(gem) && gem.length) {
      return gem.map((item: any) => {
        // Extract all micro-nutrients from the response
        const micros: NutrientInfo[] = [
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
        ];

        return {
          name: item.foodName || item.name || 'Food',
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
            micros: item.micros || item.nutrients?.micros || micros
          }
        };
      });
    }
  } catch (err: any) {
    console.warn('Gemini analyze (proxied) failed or rate-limited, falling back to FatSecret:', err.message || err);
  }  // Continue to FatSecret fallback

  try {
    const response = await api.fatSecretAnalyze(text, mealType);

    if (!response.foods || response.foods.length === 0) {
      throw new Error('No foods found matching your input');
    }

    return response.foods;
  } catch (err: any) {
    console.error('FatSecret analyze error:', err);
    throw new Error(err.message || 'Failed to analyze food');
  }
};

/**
 * New analyzeFood method for compatibility with foodService
 */
export const analyzeFoodForService = async (
  text: string,
  mealType: string
): Promise<{ success: boolean; data?: FoodLog[]; error?: string; source: string }> => {
  try {
    const foods = await analyzeFood(text, mealType as any);
    
    // Add missing id and timestamp properties
    const foodLogsWithMetadata: FoodLog[] = foods.map(food => ({
      ...food,
      id: `fatsecret_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }));
    
    return { success: true, data: foodLogsWithMetadata, source: 'FatSecret' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to analyze food', source: 'FatSecret' };
  }
};

/**
 * New searchFood method for compatibility with foodService
 */
export const searchFoodForService = async (
  query: string
): Promise<{ success: boolean; data?: FoodLog[]; error?: string; source: string }> => {
  try {
    const fatSecretFoods = await searchFood(query, 10);
    const foodLogs = fatSecretFoods.map(food => {
      const partialLog = searchResultToFoodLog(food, 'snack' as any, 1);
      return {
        ...partialLog,
        id: `fatsecret-${food.id}-${Date.now()}`,
        timestamp: new Date()
      } as FoodLog;
    });
    return { success: true, data: foodLogs, source: 'FatSecret' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to search food', source: 'FatSecret' };
  }
};

/**
 * Convert FatSecret search result to FoodLog format for quick add
 */
export const searchResultToFoodLog = (
  food: FatSecretFood,
  mealType: MealType,
  quantity: number = 1
): Omit<FoodLog, 'id' | 'timestamp'> => {
  return {
    name: food.brandName ? `${food.name} (${food.brandName})` : food.name,
    calories: Math.round(food.calories * quantity),
    mealType,
    servingQuantity: quantity,
    servingUnit: food.servingDescription,
    nutrients: {
      macros: [
        { name: 'Protein', amount: Math.round(food.protein * quantity * 10) / 10, unit: 'g' },
        { name: 'Carbs', amount: Math.round(food.carbs * quantity * 10) / 10, unit: 'g' },
        { name: 'Fat', amount: Math.round(food.fat * quantity * 10) / 10, unit: 'g' },
      ],
      micros: [
        { name: 'Fiber', amount: Math.round((food.fiber || 0) * quantity * 10) / 10, unit: 'g' },
        { name: 'Sugar', amount: Math.round((food.sugar || 0) * quantity * 10) / 10, unit: 'g' },
        { name: 'Sodium', amount: Math.round((food.sodium || 0) * quantity), unit: 'mg' },
        { name: 'Potassium', amount: Math.round((food.potassium || 0) * quantity), unit: 'mg' },
        { name: 'Cholesterol', amount: Math.round((food.cholesterol || 0) * quantity), unit: 'mg' },
        { name: 'Vitamin A', amount: Math.round((food.vitaminA || 0) * quantity), unit: 'mcg' },
        { name: 'Vitamin C', amount: Math.round((food.vitaminC || 0) * quantity), unit: 'mg' },
        { name: 'Vitamin D', amount: Math.round((food.vitaminD || 0) * quantity), unit: 'mcg' },
        { name: 'Calcium', amount: Math.round((food.calcium || 0) * quantity), unit: 'mg' },
        { name: 'Iron', amount: Math.round((food.iron || 0) * quantity * 10) / 10, unit: 'mg' },
        { name: 'Magnesium', amount: Math.round((food.magnesium || 0) * quantity), unit: 'mg' },
        { name: 'Zinc', amount: Math.round((food.zinc || 0) * quantity * 10) / 10, unit: 'mg' }
      ],
    },
  };
};

/**
 * Convert detailed food with serving to FoodLog format
 */
export const detailedFoodToFoodLog = (
  food: FatSecretDetailedFood,
  serving: FatSecretServing,
  mealType: MealType,
  quantity: number = 1
): Omit<FoodLog, 'id' | 'timestamp'> => {
  const n = serving.nutrition;
  
  return {
    name: food.brandName ? `${food.name} (${food.brandName})` : food.name,
    calories: Math.round(n.calories * quantity),
    mealType,
    servingQuantity: quantity,
    servingUnit: serving.description,
    nutrients: {
      macros: [
        { name: 'Protein', amount: Math.round(n.protein * quantity * 10) / 10, unit: 'g' },
        { name: 'Carbs', amount: Math.round(n.carbs * quantity * 10) / 10, unit: 'g' },
        { name: 'Fat', amount: Math.round(n.fat * quantity * 10) / 10, unit: 'g' },
      ],
      micros: [
        { name: 'Fiber', amount: Math.round((n.fiber || 0) * quantity * 10) / 10, unit: 'g' },
        { name: 'Sugar', amount: Math.round((n.sugar || 0) * quantity * 10) / 10, unit: 'g' },
        { name: 'Sodium', amount: Math.round((n.sodium || 0) * quantity), unit: 'mg' },
        { name: 'Potassium', amount: Math.round((n.potassium || 0) * quantity), unit: 'mg' },
        { name: 'Vitamin A', amount: Math.round((n.vitaminA || 0) * quantity), unit: 'mcg' },
        { name: 'Vitamin C', amount: Math.round((n.vitaminC || 0) * quantity), unit: 'mg' },
        { name: 'Vitamin D', amount: Math.round((n.vitaminD || 0) * quantity), unit: 'mcg' },
        { name: 'Calcium', amount: Math.round((n.calcium || 0) * quantity), unit: 'mg' },
        { name: 'Iron', amount: Math.round((n.iron || 0) * quantity * 10) / 10, unit: 'mg' },
        { name: 'Magnesium', amount: Math.round((n.magnesium || 0) * quantity), unit: 'mg' },
        { name: 'Zinc', amount: Math.round((n.zinc || 0) * quantity * 10) / 10, unit: 'mg' }
      ],
    },
  };
};

/**
 * Get food and format for logging (with specific serving)
 */
export const getFoodForLogging = async (
  foodId: string,
  servingId: string | null,
  quantity: number,
  mealType: MealType
): Promise<Omit<FoodLog, 'id' | 'timestamp'>> => {
  try {
    const response = await api.fatSecretLogFood(foodId, servingId || '', quantity, mealType);
    return response.food;
  } catch (err: any) {
    console.error('FatSecret log food error:', err);
    throw new Error(err.message || 'Failed to get food for logging');
  }
};
