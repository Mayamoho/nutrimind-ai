import axios from 'axios';
import { FoodLog, MealType } from '../types';

interface OpenFoodFactsResponse {
  products: Array<{
    product_name: string;
    nutriments: {
      'energy-kcal_100g'?: number;
      proteins_100g?: number;
      carbohydrates_100g?: number;
      fat_100g?: number;
      fiber_100g?: number;
      sugars_100g?: number;
      sodium_100g?: number;
      potassium_100g?: number;
      cholesterol_100g?: number;
      'vitamin-a_100g'?: number;
      'vitamin-c_100g'?: number;
      'vitamin-d_100g'?: number;
      calcium_100g?: number;
      iron_100g?: number;
      magnesium_100g?: number;
      zinc_100g?: number;
    };
    serving_size?: string;
  }>;
}

export const openFoodFactsService = {
  searchFood: async (query: string): Promise<{ success: boolean; data?: FoodLog[]; error?: string; source: string }> => {
    try {
      const response = await axios.get<OpenFoodFactsResponse>(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&fields=product_name,nutriments,serving_size&limit=10`
      );
      
      const products = response.data.products || [];
      
      if (products.length === 0) {
        return { success: false, error: 'No products found', source: 'OpenFoodFacts' };
      }

      const foodData = products.map(product => ({
        id: `off-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
        name: product.product_name || 'Unknown Food',
        calories: Math.round(product.nutriments?.['energy-kcal_100g'] || 0),
        mealType: MealType.Snacks,
        servingQuantity: 100,
        servingUnit: 'g',
        timestamp: new Date(),
        nutrients: {
          macros: [
            { name: 'Protein', amount: product.nutriments?.proteins_100g || 0, unit: 'g' },
            { name: 'Carbs', amount: product.nutriments?.carbohydrates_100g || 0, unit: 'g' },
            { name: 'Fat', amount: product.nutriments?.fat_100g || 0, unit: 'g' }
          ],
          micros: [
            { name: 'Fiber', amount: product.nutriments?.fiber_100g || 0, unit: 'g' },
            { name: 'Sugar', amount: product.nutriments?.sugars_100g || 0, unit: 'g' },
            { name: 'Sodium', amount: product.nutriments?.sodium_100g || 0, unit: 'mg' },
            { name: 'Potassium', amount: product.nutriments?.potassium_100g || 0, unit: 'mg' },
            { name: 'Cholesterol', amount: product.nutriments?.cholesterol_100g || 0, unit: 'mg' },
            { name: 'Vitamin A', amount: product.nutriments?.['vitamin-a_100g'] || 0, unit: 'mcg' },
            { name: 'Vitamin C', amount: product.nutriments?.['vitamin-c_100g'] || 0, unit: 'mg' },
            { name: 'Vitamin D', amount: product.nutriments?.['vitamin-d_100g'] || 0, unit: 'mcg' },
            { name: 'Calcium', amount: product.nutriments?.calcium_100g || 0, unit: 'mg' },
            { name: 'Iron', amount: product.nutriments?.iron_100g || 0, unit: 'mg' },
            { name: 'Magnesium', amount: product.nutriments?.magnesium_100g || 0, unit: 'mg' },
            { name: 'Zinc', amount: product.nutriments?.zinc_100g || 0, unit: 'mg' }
          ]
        }
      }));

      return { success: true, data: foodData, source: 'OpenFoodFacts' };
    } catch (error: any) {
      console.error('Open Food Facts API error:', error);
      return { success: false, error: error.message || 'Failed to fetch from Open Food Facts', source: 'OpenFoodFacts' };
    }
  }
};
