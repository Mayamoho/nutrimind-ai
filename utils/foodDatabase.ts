/**
 * Local Food Database
 * Comprehensive list of common foods with nutritional information
 * Used for offline/instant search functionality
 */

export interface FoodDatabaseItem {
  name: string;
  category: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
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

export const FOOD_DATABASE: FoodDatabaseItem[] = [
  // Fruits
  { name: 'Apple', category: 'Fruits', servingSize: '1 medium (182g)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, sugar: 19 },
  { name: 'Banana', category: 'Fruits', servingSize: '1 medium (118g)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1, sugar: 14 },
  { name: 'Orange', category: 'Fruits', servingSize: '1 medium (131g)', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, fiber: 3.1, sugar: 12 },
  { name: 'Grapes', category: 'Fruits', servingSize: '1 cup (151g)', calories: 104, protein: 1.1, carbs: 27, fat: 0.2, fiber: 1.4, sugar: 23 },
  { name: 'Strawberries', category: 'Fruits', servingSize: '1 cup (144g)', calories: 46, protein: 1, carbs: 11, fat: 0.4, fiber: 2.9, sugar: 7 },
  { name: 'Blueberries', category: 'Fruits', servingSize: '1 cup (148g)', calories: 84, protein: 1.1, carbs: 21, fat: 0.5, fiber: 3.6, sugar: 15 },
  { name: 'Mango', category: 'Fruits', servingSize: '1 cup (165g)', calories: 99, protein: 1.4, carbs: 25, fat: 0.6, fiber: 2.6, sugar: 23 },
  { name: 'Pineapple', category: 'Fruits', servingSize: '1 cup (165g)', calories: 82, protein: 0.9, carbs: 22, fat: 0.2, fiber: 2.3, sugar: 16 },
  { name: 'Watermelon', category: 'Fruits', servingSize: '1 cup (152g)', calories: 46, protein: 0.9, carbs: 12, fat: 0.2, fiber: 0.6, sugar: 9 },
  { name: 'Avocado', category: 'Fruits', servingSize: '1/2 fruit (100g)', calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, sugar: 0.7 },

  // Vegetables
  { name: 'Broccoli', category: 'Vegetables', servingSize: '1 cup (91g)', calories: 31, protein: 2.5, carbs: 6, fat: 0.3, fiber: 2.4, sugar: 1.5 },
  { name: 'Spinach', category: 'Vegetables', servingSize: '1 cup raw (30g)', calories: 7, protein: 0.9, carbs: 1.1, fat: 0.1, fiber: 0.7, sugar: 0.1 },
  { name: 'Carrot', category: 'Vegetables', servingSize: '1 medium (61g)', calories: 25, protein: 0.6, carbs: 6, fat: 0.1, fiber: 1.7, sugar: 2.9 },
  { name: 'Tomato', category: 'Vegetables', servingSize: '1 medium (123g)', calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2, fiber: 1.5, sugar: 3.2 },
  { name: 'Cucumber', category: 'Vegetables', servingSize: '1 cup (104g)', calories: 16, protein: 0.7, carbs: 3.8, fat: 0.1, fiber: 0.5, sugar: 1.7 },
  { name: 'Bell Pepper', category: 'Vegetables', servingSize: '1 medium (119g)', calories: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1, sugar: 4.2 },
  { name: 'Onion', category: 'Vegetables', servingSize: '1 medium (110g)', calories: 44, protein: 1.2, carbs: 10, fat: 0.1, fiber: 1.9, sugar: 4.7 },
  { name: 'Potato', category: 'Vegetables', servingSize: '1 medium (150g)', calories: 161, protein: 4.3, carbs: 37, fat: 0.2, fiber: 3.8, sugar: 1.7 },
  { name: 'Sweet Potato', category: 'Vegetables', servingSize: '1 medium (130g)', calories: 112, protein: 2.1, carbs: 26, fat: 0.1, fiber: 3.9, sugar: 5.4 },
  { name: 'Lettuce', category: 'Vegetables', servingSize: '1 cup (36g)', calories: 5, protein: 0.5, carbs: 1, fat: 0.1, fiber: 0.5, sugar: 0.4 },

  // Proteins
  { name: 'Chicken Breast', category: 'Proteins', servingSize: '100g cooked', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sodium: 74 },
  { name: 'Salmon', category: 'Proteins', servingSize: '100g cooked', calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sodium: 59 },
  { name: 'Beef Steak', category: 'Proteins', servingSize: '100g cooked', calories: 271, protein: 26, carbs: 0, fat: 18, fiber: 0, sodium: 54 },
  { name: 'Ground Beef (lean)', category: 'Proteins', servingSize: '100g cooked', calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0, sodium: 72 },
  { name: 'Pork Chop', category: 'Proteins', servingSize: '100g cooked', calories: 231, protein: 25, carbs: 0, fat: 14, fiber: 0, sodium: 62 },
  { name: 'Turkey Breast', category: 'Proteins', servingSize: '100g cooked', calories: 135, protein: 30, carbs: 0, fat: 1, fiber: 0, sodium: 46 },
  { name: 'Tuna', category: 'Proteins', servingSize: '100g canned', calories: 116, protein: 26, carbs: 0, fat: 0.8, fiber: 0, sodium: 320 },
  { name: 'Shrimp', category: 'Proteins', servingSize: '100g cooked', calories: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0, sodium: 111 },
  { name: 'Tofu', category: 'Proteins', servingSize: '100g', calories: 76, protein: 8, carbs: 1.9, fat: 4.8, fiber: 0.3, sodium: 7 },
  { name: 'Tempeh', category: 'Proteins', servingSize: '100g', calories: 192, protein: 20, carbs: 8, fat: 11, fiber: 0, sodium: 9 },

  // Dairy
  { name: 'Milk (whole)', category: 'Dairy', servingSize: '1 cup (244ml)', calories: 149, protein: 8, carbs: 12, fat: 8, sugar: 12, sodium: 105 },
  { name: 'Milk (skim)', category: 'Dairy', servingSize: '1 cup (245ml)', calories: 83, protein: 8, carbs: 12, fat: 0.2, sugar: 12, sodium: 103 },
  { name: 'Greek Yogurt', category: 'Dairy', servingSize: '1 cup (245g)', calories: 100, protein: 17, carbs: 6, fat: 0.7, sugar: 4, sodium: 65 },
  { name: 'Cheddar Cheese', category: 'Dairy', servingSize: '1 oz (28g)', calories: 113, protein: 7, carbs: 0.4, fat: 9, sugar: 0.1, sodium: 174 },
  { name: 'Mozzarella Cheese', category: 'Dairy', servingSize: '1 oz (28g)', calories: 85, protein: 6, carbs: 0.6, fat: 6, sugar: 0.2, sodium: 138 },
  { name: 'Cottage Cheese', category: 'Dairy', servingSize: '1 cup (226g)', calories: 163, protein: 28, carbs: 6, fat: 2.3, sugar: 6, sodium: 918 },
  { name: 'Butter', category: 'Dairy', servingSize: '1 tbsp (14g)', calories: 102, protein: 0.1, carbs: 0, fat: 12, sugar: 0, sodium: 91 },
  { name: 'Cream Cheese', category: 'Dairy', servingSize: '1 oz (28g)', calories: 99, protein: 1.7, carbs: 1.6, fat: 10, sugar: 0.8, sodium: 84 },

  // Grains
  { name: 'White Rice', category: 'Grains', servingSize: '1 cup cooked (158g)', calories: 206, protein: 4.3, carbs: 45, fat: 0.4, fiber: 0.6, sodium: 1.6 },
  { name: 'Brown Rice', category: 'Grains', servingSize: '1 cup cooked (195g)', calories: 216, protein: 5, carbs: 45, fat: 1.8, fiber: 3.5, sodium: 10 },
  { name: 'Pasta', category: 'Grains', servingSize: '1 cup cooked (140g)', calories: 221, protein: 8, carbs: 43, fat: 1.3, fiber: 2.5, sodium: 1 },
  { name: 'Bread (white)', category: 'Grains', servingSize: '1 slice (25g)', calories: 67, protein: 2, carbs: 13, fat: 0.8, fiber: 0.6, sodium: 130 },
  { name: 'Bread (whole wheat)', category: 'Grains', servingSize: '1 slice (28g)', calories: 69, protein: 3.6, carbs: 12, fat: 1.1, fiber: 1.9, sodium: 132 },
  { name: 'Oatmeal', category: 'Grains', servingSize: '1 cup cooked (234g)', calories: 158, protein: 6, carbs: 27, fat: 3.2, fiber: 4, sodium: 115 },
  { name: 'Quinoa', category: 'Grains', servingSize: '1 cup cooked (185g)', calories: 222, protein: 8, carbs: 39, fat: 3.6, fiber: 5, sodium: 13 },
  { name: 'Tortilla (flour)', category: 'Grains', servingSize: '1 medium (45g)', calories: 140, protein: 3.5, carbs: 24, fat: 3.5, fiber: 1.5, sodium: 330 },

  // Legumes & Nuts
  { name: 'Black Beans', category: 'Legumes', servingSize: '1 cup cooked (172g)', calories: 227, protein: 15, carbs: 41, fat: 0.9, fiber: 15, sodium: 1.7 },
  { name: 'Chickpeas', category: 'Legumes', servingSize: '1 cup cooked (164g)', calories: 269, protein: 15, carbs: 45, fat: 4.2, fiber: 12.5, sodium: 11 },
  { name: 'Lentils', category: 'Legumes', servingSize: '1 cup cooked (198g)', calories: 230, protein: 18, carbs: 40, fat: 0.8, fiber: 16, sodium: 4 },
  { name: 'Almonds', category: 'Nuts', servingSize: '1 oz (28g)', calories: 164, protein: 6, carbs: 6, fat: 14, fiber: 3.5, sodium: 0 },
  { name: 'Peanuts', category: 'Nuts', servingSize: '1 oz (28g)', calories: 161, protein: 7, carbs: 5, fat: 14, fiber: 2.4, sodium: 5 },
  { name: 'Walnuts', category: 'Nuts', servingSize: '1 oz (28g)', calories: 185, protein: 4.3, carbs: 4, fat: 18, fiber: 1.9, sodium: 0.6 },
  { name: 'Peanut Butter', category: 'Nuts', servingSize: '2 tbsp (32g)', calories: 188, protein: 8, carbs: 6, fat: 16, fiber: 1.9, sodium: 136 },

  // Eggs
  { name: 'Egg (whole)', category: 'Eggs', servingSize: '1 large (50g)', calories: 72, protein: 6, carbs: 0.4, fat: 5, sugar: 0.2, sodium: 71 },
  { name: 'Egg White', category: 'Eggs', servingSize: '1 large (33g)', calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1, sugar: 0.2, sodium: 55 },
  { name: 'Scrambled Eggs', category: 'Eggs', servingSize: '2 eggs (122g)', calories: 182, protein: 12, carbs: 2, fat: 14, sugar: 1.5, sodium: 342 },
  { name: 'Omelette (cheese)', category: 'Eggs', servingSize: '2 eggs (140g)', calories: 280, protein: 18, carbs: 2, fat: 22, sugar: 1, sodium: 450 },

  // Beverages
  { name: 'Orange Juice', category: 'Beverages', servingSize: '1 cup (248ml)', calories: 112, protein: 1.7, carbs: 26, fat: 0.5, sugar: 21, sodium: 2 },
  { name: 'Coffee (black)', category: 'Beverages', servingSize: '1 cup (240ml)', calories: 2, protein: 0.3, carbs: 0, fat: 0, sugar: 0, sodium: 5 },
  { name: 'Green Tea', category: 'Beverages', servingSize: '1 cup (245ml)', calories: 2, protein: 0, carbs: 0, fat: 0, sugar: 0, sodium: 2 },
  { name: 'Coca-Cola', category: 'Beverages', servingSize: '1 can (355ml)', calories: 140, protein: 0, carbs: 39, fat: 0, sugar: 39, sodium: 45 },
  { name: 'Protein Shake', category: 'Beverages', servingSize: '1 scoop (30g)', calories: 120, protein: 24, carbs: 3, fat: 1, sugar: 1, sodium: 130 },

  // Snacks
  { name: 'Potato Chips', category: 'Snacks', servingSize: '1 oz (28g)', calories: 152, protein: 2, carbs: 15, fat: 10, fiber: 1.3, sodium: 147 },
  { name: 'Popcorn (air-popped)', category: 'Snacks', servingSize: '3 cups (24g)', calories: 93, protein: 3, carbs: 19, fat: 1.1, fiber: 3.6, sodium: 2 },
  { name: 'Dark Chocolate', category: 'Snacks', servingSize: '1 oz (28g)', calories: 155, protein: 1.4, carbs: 17, fat: 9, fiber: 2, sugar: 14 },
  { name: 'Granola Bar', category: 'Snacks', servingSize: '1 bar (24g)', calories: 100, protein: 2, carbs: 18, fat: 3, fiber: 1, sugar: 7 },
  { name: 'Trail Mix', category: 'Snacks', servingSize: '1 oz (28g)', calories: 131, protein: 4, carbs: 13, fat: 8, fiber: 1.4, sodium: 65 },

  // Fast Food / Common Meals
  { name: 'Pizza (cheese)', category: 'Fast Food', servingSize: '1 slice (107g)', calories: 285, protein: 12, carbs: 36, fat: 10, fiber: 2.5, sodium: 640 },
  { name: 'Hamburger', category: 'Fast Food', servingSize: '1 burger (110g)', calories: 295, protein: 17, carbs: 24, fat: 14, fiber: 1.3, sodium: 495 },
  { name: 'French Fries', category: 'Fast Food', servingSize: 'medium (117g)', calories: 365, protein: 4, carbs: 48, fat: 17, fiber: 4, sodium: 246 },
  { name: 'Burrito', category: 'Fast Food', servingSize: '1 burrito (163g)', calories: 295, protein: 11, carbs: 32, fat: 13, fiber: 3.5, sodium: 495 },
  { name: 'Fried Chicken', category: 'Fast Food', servingSize: '1 piece (113g)', calories: 320, protein: 22, carbs: 11, fat: 21, fiber: 0.5, sodium: 590 },

  // Indian Foods
  { name: 'Dal (Lentil Curry)', category: 'Indian', servingSize: '1 cup (200g)', calories: 180, protein: 12, carbs: 28, fat: 3, fiber: 8, sodium: 450 },
  { name: 'Roti/Chapati', category: 'Indian', servingSize: '1 piece (40g)', calories: 104, protein: 3, carbs: 20, fat: 1.5, fiber: 2, sodium: 150 },
  { name: 'Naan', category: 'Indian', servingSize: '1 piece (90g)', calories: 262, protein: 9, carbs: 45, fat: 5, fiber: 2, sodium: 418 },
  { name: 'Biryani', category: 'Indian', servingSize: '1 cup (250g)', calories: 350, protein: 15, carbs: 45, fat: 12, fiber: 2, sodium: 650 },
  { name: 'Paneer', category: 'Indian', servingSize: '100g', calories: 265, protein: 18, carbs: 1.2, fat: 21, fiber: 0, sodium: 18 },
  { name: 'Samosa', category: 'Indian', servingSize: '1 piece (100g)', calories: 262, protein: 5, carbs: 30, fat: 14, fiber: 3, sodium: 380 },
  { name: 'Idli', category: 'Indian', servingSize: '2 pieces (80g)', calories: 78, protein: 2, carbs: 16, fat: 0.4, fiber: 0.8, sodium: 280 },
  { name: 'Dosa', category: 'Indian', servingSize: '1 piece (100g)', calories: 168, protein: 4, carbs: 28, fat: 4, fiber: 1.5, sodium: 320 },

  // Asian Foods
  { name: 'Sushi Roll', category: 'Asian', servingSize: '6 pieces (150g)', calories: 200, protein: 8, carbs: 38, fat: 1, fiber: 1, sodium: 500 },
  { name: 'Fried Rice', category: 'Asian', servingSize: '1 cup (200g)', calories: 238, protein: 6, carbs: 34, fat: 9, fiber: 1.5, sodium: 820 },
  { name: 'Pad Thai', category: 'Asian', servingSize: '1 cup (200g)', calories: 357, protein: 14, carbs: 40, fat: 16, fiber: 2, sodium: 890 },
  { name: 'Spring Roll', category: 'Asian', servingSize: '1 roll (64g)', calories: 110, protein: 3, carbs: 13, fat: 5, fiber: 1, sodium: 310 },
  { name: 'Miso Soup', category: 'Asian', servingSize: '1 cup (240ml)', calories: 40, protein: 3, carbs: 5, fat: 1, fiber: 1, sodium: 900 },

  // Mediterranean Foods
  { name: 'Hummus', category: 'Mediterranean', servingSize: '2 tbsp (30g)', calories: 70, protein: 2, carbs: 4, fat: 5, fiber: 1, sodium: 120 },
  { name: 'Falafel', category: 'Mediterranean', servingSize: '4 pieces (60g)', calories: 145, protein: 6, carbs: 13, fat: 8, fiber: 3, sodium: 290 },
  { name: 'Tabbouleh', category: 'Mediterranean', servingSize: '1 cup (120g)', calories: 150, protein: 4, carbs: 20, fat: 6, fiber: 4, sodium: 180 },
  { name: 'Baba Ghanoush', category: 'Mediterranean', servingSize: '2 tbsp (30g)', calories: 40, protein: 1, carbs: 3, fat: 3, fiber: 1, sodium: 80 },
  { name: 'Greek Salad', category: 'Mediterranean', servingSize: '1 cup (150g)', calories: 120, protein: 4, carbs: 8, fat: 8, fiber: 3, sodium: 350 },
  { name: 'Pita Bread', category: 'Mediterranean', servingSize: '1 piece (60g)', calories: 165, protein: 6, carbs: 33, fat: 1, fiber: 2, sodium: 320 },
  { name: 'Dolmas (stuffed grape leaves)', category: 'Mediterranean', servingSize: '4 pieces (120g)', calories: 180, protein: 5, carbs: 20, fat: 8, fiber: 2, sodium: 420 },
  { name: 'Tzatziki', category: 'Mediterranean', servingSize: '2 tbsp (30g)', calories: 25, protein: 1, carbs: 2, fat: 1.5, fiber: 0, sodium: 30 },

  // Middle Eastern Foods
  { name: 'Shawarma', category: 'Middle Eastern', servingSize: '1 serving (200g)', calories: 350, protein: 25, carbs: 30, fat: 18, fiber: 3, sodium: 850 },
  { name: 'Kebab', category: 'Middle Eastern', servingSize: '1 skewer (150g)', calories: 280, protein: 22, carbs: 15, fat: 16, fiber: 2, sodium: 650 },
  { name: 'Fattoush Salad', category: 'Middle Eastern', servingSize: '1 cup (120g)', calories: 110, protein: 3, carbs: 15, fat: 5, fiber: 3, sodium: 280 },
  { name: 'Muhammara', category: 'Middle Eastern', servingSize: '2 tbsp (30g)', calories: 60, protein: 1, carbs: 4, fat: 4.5, fiber: 1, sodium: 90 },
  { name: 'Manakish', category: 'Middle Eastern', servingSize: '1 piece (100g)', calories: 285, protein: 8, carbs: 38, fat: 12, fiber: 2, sodium: 420 },

  // African Foods
  { name: 'Jollof Rice', category: 'African', servingSize: '1 cup (200g)', calories: 220, protein: 5, carbs: 42, fat: 4, fiber: 1.5, sodium: 380 },
  { name: 'Fufu', category: 'African', servingSize: '1 cup (240g)', calories: 330, protein: 3, carbs: 78, fat: 0.5, fiber: 2, sodium: 15 },
  { name: 'Efo Riro (Nigerian stew)', category: 'African', servingSize: '1 cup (200g)', calories: 180, protein: 8, carbs: 15, fat: 10, fiber: 4, sodium: 520 },
  { name: 'Injera', category: 'African', servingSize: '1 piece (90g)', calories: 160, protein: 5, carbs: 35, fat: 0.5, fiber: 2, sodium: 280 },
  { name: 'Bobotie', category: 'African', servingSize: '1 cup (250g)', calories: 280, protein: 20, carbs: 18, fat: 15, fiber: 2, sodium: 450 },
  { name: 'Tagine', category: 'African', servingSize: '1 cup (250g)', calories: 240, protein: 18, carbs: 20, fat: 12, fiber: 3, sodium: 380 },

  // Latin American Foods
  { name: 'Tacos (beef)', category: 'Latin American', servingSize: '2 tacos (150g)', calories: 320, protein: 18, carbs: 28, fat: 16, fiber: 4, sodium: 650 },
  { name: 'Arepa', category: 'Latin American', servingSize: '1 piece (80g)', calories: 220, protein: 5, carbs: 42, fat: 4, fiber: 2, sodium: 320 },
  { name: 'Empanadas', category: 'Latin American', servingSize: '2 pieces (200g)', calories: 380, protein: 12, carbs: 35, fat: 20, fiber: 3, sodium: 520 },
  { name: 'Ceviche', category: 'Latin American', servingSize: '1 cup (200g)', calories: 180, protein: 22, carbs: 8, fat: 6, fiber: 1, sodium: 380 },
  { name: 'Pupusas', category: 'Latin American', servingSize: '2 pieces (140g)', calories: 280, protein: 8, carbs: 38, fat: 10, fiber: 3, sodium: 420 },
  { name: 'Feijoada', category: 'Latin American', servingSize: '1 cup (250g)', calories: 320, protein: 20, carbs: 28, fat: 14, fiber: 8, sodium: 680 },
  { name: 'Tamales', category: 'Latin American', servingSize: '2 pieces (200g)', calories: 340, protein: 10, carbs: 45, fat: 14, fiber: 5, sodium: 580 },

  // European Foods
  { name: 'Paella', category: 'European', servingSize: '1 cup (240g)', calories: 280, protein: 15, carbs: 35, fat: 10, fiber: 2, sodium: 520 },
  { name: 'Risotto', category: 'European', servingSize: '1 cup (220g)', calories: 320, protein: 8, carbs: 45, fat: 12, fiber: 1, sodium: 680 },
  { name: 'Gnocchi', category: 'European', servingSize: '1 cup (140g)', calories: 250, protein: 8, carbs: 42, fat: 8, fiber: 2, sodium: 180 },
  { name: 'Ratatouille', category: 'European', servingSize: '1 cup (200g)', calories: 120, protein: 4, carbs: 18, fat: 4, fiber: 6, sodium: 320 },
  { name: 'Pierogi', category: 'European', servingSize: '4 pieces (150g)', calories: 280, protein: 8, carbs: 38, fat: 10, fiber: 3, sodium: 420 },
  { name: 'Schnitzel', category: 'European', servingSize: '1 piece (200g)', calories: 380, protein: 25, carbs: 18, fat: 22, fiber: 1, sodium: 520 },
];

/**
 * Search foods in the local database
 */
export const searchLocalFoods = (query: string, limit: number = 20): FoodDatabaseItem[] => {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  
  return FOOD_DATABASE
    .filter(food => 
      food.name.toLowerCase().includes(lowerQuery) ||
      food.category.toLowerCase().includes(lowerQuery)
    )
    .slice(0, limit);
};

/**
 * Get foods by category
 */
export const getFoodsByCategory = (category: string): FoodDatabaseItem[] => {
  return FOOD_DATABASE.filter(food => 
    food.category.toLowerCase() === category.toLowerCase()
  );
};

/**
 * Get all unique categories
 */
export const getFoodCategories = (): string[] => {
  return [...new Set(FOOD_DATABASE.map(food => food.category))];
};
