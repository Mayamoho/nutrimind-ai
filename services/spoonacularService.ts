import axios from 'axios';
import { FoodLog, MealType } from '../types';

interface SpoonacularSearchResult {
  id: number;
  name: string;
  image: string;
}

interface SpoonacularNutrient {
  name: string;
  amount: number;
  unit: string;
  percentOfDailyNeeds?: number;
}

interface SpoonacularIngredientInfo {
  id: number;
  name: string;
  nutrition: {
    nutrients: SpoonacularNutrient[];
  };
}

export const spoonacularService = {
  searchFood: async (query: string): Promise<{ success: boolean; data?: FoodLog[]; error?: string; source: string }> => {
    const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
    
    if (!SPOONACULAR_API_KEY) {
      return { success: false, error: 'Spoonacular API key not configured', source: 'Spoonacular' };
    }

    try {
      // First, search for ingredients
      const searchResponse = await axios.get<{ results: SpoonacularSearchResult[] }>(
        `https://api.spoonacular.com/food/ingredients/search?apiKey=${SPOONACULAR_API_KEY}&query=${encodeURIComponent(query)}&number=5&metaInformation=true`
      );
      
      const ingredients = searchResponse.data.results || [];
      
      if (ingredients.length === 0) {
        return { success: false, error: 'No ingredients found', source: 'Spoonacular' };
      }

      // Get detailed nutrition information for each ingredient
      const nutritionPromises = ingredients.map(async (ingredient) => {
        try {
          const nutritionResponse = await axios.get<SpoonacularIngredientInfo>(
            `https://api.spoonacular.com/food/ingredients/${ingredient.id}/information?apiKey=${SPOONACULAR_API_KEY}&amount=100&unit=grams`
          );
          return nutritionResponse.data;
        } catch (error) {
          console.error(`Error fetching nutrition for ${ingredient.name}:`, error);
          return null;
        }
      });

      const nutritionData = await Promise.all(nutritionPromises);
      const validNutritionData = nutritionData.filter(data => data !== null);

      if (validNutritionData.length === 0) {
        return { success: false, error: 'No nutrition data available', source: 'Spoonacular' };
      }

      const foodData = validNutritionData.map(food => {
        const nutrients = food.nutrition.nutrients.reduce((acc, nutrient) => {
          const name = nutrient.name.toLowerCase();
          
          if (name.includes('calories') || name.includes('energy')) {
            acc.calories = nutrient.amount;
          } else if (name.includes('protein')) {
            acc.protein = nutrient.amount;
          } else if (name.includes('carbohydrate')) {
            acc.carbs = nutrient.amount;
          } else if (name.includes('fat')) {
            acc.fat = nutrient.amount;
          } else if (name.includes('fiber')) {
            acc.fiber = nutrient.amount;
          } else if (name.includes('sugar')) {
            acc.sugar = nutrient.amount;
          } else if (name.includes('sodium')) {
            acc.sodium = nutrient.amount;
          } else if (name.includes('potassium')) {
            acc.potassium = nutrient.amount;
          } else if (name.includes('cholesterol')) {
            acc.cholesterol = nutrient.amount;
          } else if (name.includes('vitamin a')) {
            acc.vitaminA = nutrient.amount;
          } else if (name.includes('vitamin c')) {
            acc.vitaminC = nutrient.amount;
          } else if (name.includes('vitamin d')) {
            acc.vitaminD = nutrient.amount;
          } else if (name.includes('calcium')) {
            acc.calcium = nutrient.amount;
          } else if (name.includes('iron')) {
            acc.iron = nutrient.amount;
          } else if (name.includes('magnesium')) {
            acc.magnesium = nutrient.amount;
          } else if (name.includes('zinc')) {
            acc.zinc = nutrient.amount;
          }
          
          return acc;
        }, {} as any);

        return {
          id: `spoonacular-${food.id}-${Date.now()}`,
          name: food.name,
          calories: Math.round(nutrients.calories || 0),
          mealType: MealType.Snacks,
          servingQuantity: 100,
          servingUnit: 'g',
          timestamp: new Date(),
          nutrients: {
            macros: [
              { name: 'Protein', amount: nutrients.protein || 0, unit: 'g' },
              { name: 'Carbs', amount: nutrients.carbs || 0, unit: 'g' },
              { name: 'Fat', amount: nutrients.fat || 0, unit: 'g' }
            ],
            micros: [
              { name: 'Fiber', amount: nutrients.fiber || 0, unit: 'g' },
              { name: 'Sugar', amount: nutrients.sugar || 0, unit: 'g' },
              { name: 'Sodium', amount: nutrients.sodium || 0, unit: 'mg' },
              { name: 'Potassium', amount: nutrients.potassium || 0, unit: 'mg' },
              { name: 'Cholesterol', amount: nutrients.cholesterol || 0, unit: 'mg' },
              { name: 'Vitamin A', amount: nutrients.vitaminA || 0, unit: 'mcg' },
              { name: 'Vitamin C', amount: nutrients.vitaminC || 0, unit: 'mg' },
              { name: 'Vitamin D', amount: nutrients.vitaminD || 0, unit: 'mcg' },
              { name: 'Calcium', amount: nutrients.calcium || 0, unit: 'mg' },
              { name: 'Iron', amount: nutrients.iron || 0, unit: 'mg' },
              { name: 'Magnesium', amount: nutrients.magnesium || 0, unit: 'mg' },
              { name: 'Zinc', amount: nutrients.zinc || 0, unit: 'mg' }
            ]
          }
        } as FoodLog;
      });

      return { success: true, data: foodData, source: 'Spoonacular' };
    } catch (error: any) {
      console.error('Spoonacular API error:', error);
      return { success: false, error: error.message || 'Failed to fetch from Spoonacular', source: 'Spoonacular' };
    }
  }
};
