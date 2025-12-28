/**
 * Country-Specific Affordable Foods Database
 * Real local foods with accurate pricing tiers
 */

const COUNTRY_FOODS = {
  'Bangladesh': {
    budget: [
      { name: 'Dal (Masoor/Mung)', portion: '1 cup cooked', calories: 230, protein: 18, carbs: 40, fat: 1, price: '৳15-20' },
      { name: 'Rice', portion: '1 cup cooked', calories: 200, protein: 4, carbs: 45, fat: 0, price: '৳10-15' },
      { name: 'Egg (Deshi)', portion: '2 boiled', calories: 140, protein: 12, carbs: 1, fat: 10, price: '৳24-30' },
      { name: 'Roti/Chapati', portion: '2 pieces', calories: 150, protein: 5, carbs: 30, fat: 2, price: '৳10' },
      { name: 'Aloo Bhaji', portion: '1 cup', calories: 180, protein: 3, carbs: 35, fat: 5, price: '৳20' },
      { name: 'Begun Bhaja', portion: '4 slices', calories: 120, protein: 2, carbs: 15, fat: 6, price: '৳15' },
      { name: 'Muri (Puffed Rice)', portion: '1 cup', calories: 110, protein: 2, carbs: 25, fat: 0, price: '৳10' },
      { name: 'Chira (Flattened Rice)', portion: '1 cup', calories: 130, protein: 3, carbs: 28, fat: 1, price: '৳15' },
      { name: 'Banana (Kola)', portion: '2 medium', calories: 180, protein: 2, carbs: 45, fat: 0, price: '৳10-15' },
      { name: 'Seasonal Vegetables', portion: '1 cup', calories: 50, protein: 2, carbs: 10, fat: 0, price: '৳15-25' },
    ],
    moderate: [
      { name: 'Chicken Curry (Deshi)', portion: '150g', calories: 280, protein: 25, carbs: 8, fat: 16, price: '৳80-100' },
      { name: 'Fish Curry (Rui/Katla)', portion: '1 piece', calories: 200, protein: 22, carbs: 5, fat: 10, price: '৳60-80' },
      { name: 'Beef Bhuna', portion: '100g', calories: 250, protein: 20, carbs: 5, fat: 18, price: '৳70-90' },
      { name: 'Khichuri', portion: '1.5 cups', calories: 350, protein: 12, carbs: 55, fat: 8, price: '৳40-50' },
      { name: 'Dim Bhuna', portion: '2 eggs', calories: 220, protein: 14, carbs: 8, fat: 15, price: '৳50' },
      { name: 'Shutki Bhorta', portion: '2 tbsp', calories: 80, protein: 12, carbs: 2, fat: 3, price: '৳30' },
      { name: 'Doi (Yogurt)', portion: '1 cup', calories: 150, protein: 8, carbs: 12, fat: 8, price: '৳30-40' },
      { name: 'Paratha', portion: '1 piece', calories: 200, protein: 4, carbs: 25, fat: 10, price: '৳15-20' },
    ],
    premium: [
      { name: 'Hilsa Fish (Ilish)', portion: '1 piece', calories: 300, protein: 25, carbs: 0, fat: 22, price: '৳200-400' },
      { name: 'Mutton Rezala', portion: '150g', calories: 350, protein: 28, carbs: 8, fat: 24, price: '৳180-250' },
      { name: 'Prawn Malaikari', portion: '150g', calories: 320, protein: 22, carbs: 10, fat: 22, price: '৳200-300' },
      { name: 'Chicken Biryani', portion: '1 plate', calories: 550, protein: 25, carbs: 70, fat: 18, price: '৳150-200' },
      { name: 'Kacchi Biryani', portion: '1 plate', calories: 650, protein: 30, carbs: 75, fat: 25, price: '৳250-350' },
    ]
  },

  'India': {
    budget: [
      { name: 'Dal Tadka', portion: '1 cup', calories: 220, protein: 15, carbs: 35, fat: 5, price: '₹20-30' },
      { name: 'Roti', portion: '2 pieces', calories: 140, protein: 5, carbs: 28, fat: 2, price: '₹10' },
      { name: 'Rice', portion: '1 cup', calories: 200, protein: 4, carbs: 45, fat: 0, price: '₹15' },
      { name: 'Aloo Sabzi', portion: '1 cup', calories: 180, protein: 3, carbs: 32, fat: 6, price: '₹25' },
      { name: 'Curd/Dahi', portion: '1 cup', calories: 100, protein: 8, carbs: 8, fat: 4, price: '₹20' },
      { name: 'Poha', portion: '1 plate', calories: 250, protein: 5, carbs: 45, fat: 8, price: '₹20-30' },
      { name: 'Upma', portion: '1 bowl', calories: 230, protein: 6, carbs: 40, fat: 6, price: '₹25' },
      { name: 'Idli', portion: '3 pieces', calories: 180, protein: 6, carbs: 35, fat: 1, price: '₹25-30' },
      { name: 'Boiled Eggs', portion: '2', calories: 140, protein: 12, carbs: 1, fat: 10, price: '₹20' },
      { name: 'Banana', portion: '2', calories: 180, protein: 2, carbs: 45, fat: 0, price: '₹10' },
    ],
    moderate: [
      { name: 'Chicken Curry', portion: '150g', calories: 280, protein: 25, carbs: 8, fat: 16, price: '₹80-120' },
      { name: 'Paneer Bhurji', portion: '100g', calories: 260, protein: 18, carbs: 6, fat: 18, price: '₹70-90' },
      { name: 'Rajma Chawal', portion: '1 plate', calories: 400, protein: 15, carbs: 65, fat: 8, price: '₹60-80' },
      { name: 'Chole Bhature', portion: '1 plate', calories: 500, protein: 15, carbs: 60, fat: 22, price: '₹60-80' },
      { name: 'Fish Fry', portion: '1 piece', calories: 220, protein: 20, carbs: 10, fat: 12, price: '₹80-100' },
      { name: 'Egg Curry', portion: '2 eggs', calories: 250, protein: 14, carbs: 10, fat: 18, price: '₹50-60' },
      { name: 'Dosa with Sambar', portion: '2 dosas', calories: 350, protein: 10, carbs: 55, fat: 12, price: '₹50-70' },
    ],
    premium: [
      { name: 'Butter Chicken', portion: '200g', calories: 450, protein: 30, carbs: 12, fat: 32, price: '₹200-300' },
      { name: 'Mutton Biryani', portion: '1 plate', calories: 600, protein: 28, carbs: 70, fat: 22, price: '₹250-350' },
      { name: 'Prawn Curry', portion: '150g', calories: 280, protein: 24, carbs: 8, fat: 18, price: '₹200-280' },
    ]
  },

  'Pakistan': {
    budget: [
      { name: 'Daal Chawal', portion: '1 plate', calories: 380, protein: 15, carbs: 65, fat: 6, price: 'Rs.80-100' },
      { name: 'Roti', portion: '2 pieces', calories: 150, protein: 5, carbs: 30, fat: 2, price: 'Rs.20' },
      { name: 'Anda (Eggs)', portion: '2 boiled', calories: 140, protein: 12, carbs: 1, fat: 10, price: 'Rs.50' },
      { name: 'Aloo Paratha', portion: '1 piece', calories: 280, protein: 6, carbs: 35, fat: 12, price: 'Rs.40-50' },
      { name: 'Chana Chaat', portion: '1 plate', calories: 200, protein: 10, carbs: 30, fat: 5, price: 'Rs.50-70' },
      { name: 'Lassi', portion: '1 glass', calories: 150, protein: 6, carbs: 20, fat: 5, price: 'Rs.40-60' },
    ],
    moderate: [
      { name: 'Chicken Karahi', portion: '150g', calories: 300, protein: 25, carbs: 8, fat: 20, price: 'Rs.200-300' },
      { name: 'Seekh Kebab', portion: '4 pieces', calories: 280, protein: 22, carbs: 5, fat: 20, price: 'Rs.150-200' },
      { name: 'Haleem', portion: '1 bowl', calories: 350, protein: 20, carbs: 40, fat: 12, price: 'Rs.150-200' },
      { name: 'Nihari', portion: '1 bowl', calories: 400, protein: 25, carbs: 15, fat: 28, price: 'Rs.200-300' },
    ],
    premium: [
      { name: 'Mutton Biryani', portion: '1 plate', calories: 650, protein: 30, carbs: 75, fat: 25, price: 'Rs.400-600' },
      { name: 'Chapli Kebab', portion: '2 pieces', calories: 400, protein: 24, carbs: 10, fat: 30, price: 'Rs.300-400' },
    ]
  },

  'United States': {
    budget: [
      { name: 'Oatmeal', portion: '1 cup cooked', calories: 150, protein: 5, carbs: 27, fat: 3, price: '$0.50' },
      { name: 'Eggs', portion: '2 scrambled', calories: 180, protein: 12, carbs: 2, fat: 14, price: '$0.60' },
      { name: 'Peanut Butter Toast', portion: '2 slices', calories: 320, protein: 12, carbs: 35, fat: 16, price: '$0.80' },
      { name: 'Rice and Beans', portion: '1.5 cups', calories: 350, protein: 14, carbs: 60, fat: 4, price: '$1.50' },
      { name: 'Banana', portion: '2 medium', calories: 180, protein: 2, carbs: 45, fat: 0, price: '$0.50' },
      { name: 'Canned Tuna', portion: '1 can', calories: 180, protein: 40, carbs: 0, fat: 2, price: '$1.50' },
      { name: 'Chicken Thighs', portion: '150g', calories: 250, protein: 25, carbs: 0, fat: 16, price: '$2.00' },
      { name: 'Frozen Vegetables', portion: '1 cup', calories: 60, protein: 3, carbs: 12, fat: 0, price: '$1.00' },
    ],
    moderate: [
      { name: 'Grilled Chicken Breast', portion: '150g', calories: 230, protein: 35, carbs: 0, fat: 8, price: '$4-5' },
      { name: 'Ground Turkey', portion: '150g', calories: 220, protein: 28, carbs: 0, fat: 12, price: '$4-5' },
      { name: 'Greek Yogurt', portion: '200g', calories: 130, protein: 15, carbs: 8, fat: 4, price: '$2-3' },
      { name: 'Salmon Fillet', portion: '150g', calories: 280, protein: 30, carbs: 0, fat: 16, price: '$6-8' },
    ],
    premium: [
      { name: 'Ribeye Steak', portion: '200g', calories: 500, protein: 40, carbs: 0, fat: 38, price: '$15-20' },
      { name: 'Sushi Platter', portion: '8 pieces', calories: 350, protein: 18, carbs: 45, fat: 8, price: '$15-25' },
    ]
  },

  'United Kingdom': {
    budget: [
      { name: 'Beans on Toast', portion: '1 serving', calories: 300, protein: 12, carbs: 50, fat: 4, price: '£1.00' },
      { name: 'Porridge', portion: '1 bowl', calories: 180, protein: 6, carbs: 30, fat: 4, price: '£0.50' },
      { name: 'Eggs on Toast', portion: '2 eggs', calories: 280, protein: 16, carbs: 25, fat: 14, price: '£1.20' },
      { name: 'Jacket Potato with Beans', portion: '1 potato', calories: 350, protein: 12, carbs: 65, fat: 2, price: '£1.50' },
      { name: 'Chicken Drumsticks', portion: '2 pieces', calories: 280, protein: 26, carbs: 0, fat: 18, price: '£2.00' },
    ],
    moderate: [
      { name: 'Fish and Chips', portion: '1 serving', calories: 600, protein: 25, carbs: 60, fat: 30, price: '£6-8' },
      { name: 'Shepherd\'s Pie', portion: '1 serving', calories: 450, protein: 22, carbs: 40, fat: 22, price: '£4-6' },
      { name: 'Roast Chicken Dinner', portion: '1 plate', calories: 550, protein: 35, carbs: 45, fat: 25, price: '£5-7' },
    ]
  }
};

// Default foods for unmapped countries
const DEFAULT_FOODS = {
  budget: [
    { name: 'Rice', portion: '1 cup cooked', calories: 200, protein: 4, carbs: 45, fat: 0 },
    { name: 'Lentils/Beans', portion: '1 cup', calories: 230, protein: 18, carbs: 40, fat: 1 },
    { name: 'Eggs', portion: '2 boiled', calories: 140, protein: 12, carbs: 1, fat: 10 },
    { name: 'Bread', portion: '2 slices', calories: 160, protein: 6, carbs: 30, fat: 2 },
    { name: 'Banana', portion: '2 medium', calories: 180, protein: 2, carbs: 45, fat: 0 },
    { name: 'Local Vegetables', portion: '1 cup', calories: 50, protein: 2, carbs: 10, fat: 0 },
    { name: 'Potato', portion: '1 medium', calories: 160, protein: 4, carbs: 35, fat: 0 },
    { name: 'Milk', portion: '1 cup', calories: 120, protein: 8, carbs: 12, fat: 5 },
  ],
  moderate: [
    { name: 'Chicken', portion: '150g', calories: 250, protein: 30, carbs: 0, fat: 14 },
    { name: 'Fish', portion: '150g', calories: 200, protein: 25, carbs: 0, fat: 10 },
    { name: 'Yogurt', portion: '200g', calories: 150, protein: 10, carbs: 15, fat: 6 },
    { name: 'Cheese', portion: '50g', calories: 180, protein: 12, carbs: 1, fat: 14 },
  ],
  premium: [
    { name: 'Beef/Mutton', portion: '150g', calories: 300, protein: 28, carbs: 0, fat: 20 },
    { name: 'Prawns/Shrimp', portion: '150g', calories: 180, protein: 24, carbs: 0, fat: 8 },
  ]
};

function getFoodsForCountry(country) {
  return COUNTRY_FOODS[country] || DEFAULT_FOODS;
}

function getBudgetFoods(country, targetCalories, targetProtein) {
  const foods = getFoodsForCountry(country);
  return foods.budget.filter(f => f.calories <= targetCalories + 100);
}

function getModerateFoods(country, targetCalories) {
  const foods = getFoodsForCountry(country);
  return foods.moderate || [];
}

function getPremiumFoods(country) {
  const foods = getFoodsForCountry(country);
  return foods.premium || [];
}

module.exports = { COUNTRY_FOODS, DEFAULT_FOODS, getFoodsForCountry, getBudgetFoods, getModerateFoods, getPremiumFoods };
