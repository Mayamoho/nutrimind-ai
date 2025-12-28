import axios from 'axios';
import { FoodLog, MealType } from '../types';

interface USDAFood {
  description: string;
  fdcId: number;
  foodNutrients: Array<{
    nutrientName: string;
    value: number;
    unitName: string;
  }>;
}

interface USDAResponse {
  foods: USDAFood[];
}

export const usdaService = {
  searchFood: async (query: string): Promise<{ success: boolean; data?: FoodLog[]; error?: string; source: string }> => {
    const USDA_API_KEY = process.env.USDA_API_KEY;
    
    if (!USDA_API_KEY) {
      return { success: false, error: 'USDA API key not configured', source: 'USDA' };
    }

    try {
      const response = await axios.get<USDAResponse>(
        `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&dataType=Foundation&pageSize=10`
      );
      
      const foods = response.data.foods || [];
      
      if (foods.length === 0) {
        return { success: false, error: 'No foods found', source: 'USDA' };
      }

      const foodData = foods.map(food => {
        const nutrients = food.foodNutrients.reduce((acc, nutrient) => {
          const name = nutrient.nutrientName.toLowerCase();
          
          if (name.includes('energy') || name.includes('calories')) {
            acc.calories = nutrient.value;
          } else if (name.includes('protein')) {
            acc.protein = nutrient.value;
          } else if (name.includes('carbohydrate')) {
            acc.carbs = nutrient.value;
          } else if (name.includes('fat')) {
            acc.fat = nutrient.value;
          } else if (name.includes('fiber')) {
            acc.fiber = nutrient.value;
          } else if (name.includes('sugar')) {
            acc.sugar = nutrient.value;
          } else if (name.includes('sodium')) {
            acc.sodium = nutrient.value;
          } else if (name.includes('potassium')) {
            acc.potassium = nutrient.value;
          } else if (name.includes('cholesterol')) {
            acc.cholesterol = nutrient.value;
          } else if (name.includes('vitamin a')) {
            acc.vitaminA = nutrient.value;
          } else if (name.includes('vitamin c')) {
            acc.vitaminC = nutrient.value;
          } else if (name.includes('vitamin d')) {
            acc.vitaminD = nutrient.value;
          } else if (name.includes('calcium')) {
            acc.calcium = nutrient.value;
          } else if (name.includes('iron')) {
            acc.iron = nutrient.value;
          } else if (name.includes('magnesium')) {
            acc.magnesium = nutrient.value;
          } else if (name.includes('zinc')) {
            acc.zinc = nutrient.value;
          }
          
          return acc;
        }, {} as any);

        return {
          id: `usda-${food.fdcId}-${Date.now()}`,
          name: food.description,
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
        };
      });

      return { success: true, data: foodData, source: 'USDA' };
    } catch (error: any) {
      console.error('USDA API error:', error);
      return { success: false, error: error.message || 'Failed to fetch from USDA', source: 'USDA' };
    }
  }
};
