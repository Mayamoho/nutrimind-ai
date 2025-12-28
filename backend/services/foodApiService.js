/**
 * Multi-API Food Service for Meal Planner
 * Combines FREE APIs: TheMealDB (recipes by country) + Open Food Facts (nutrition)
 * Fallback chain ensures reliability
 */

const https = require('https');
const fatSecretService = require('./fatSecretService');

// TheMealDB - FREE, no key needed (use "1" for dev)
const MEALDB_BASE = 'www.themealdb.com';

// Open Food Facts - FREE, no key needed
const OFF_BASE = 'world.openfoodfacts.org';

// Spoonacular - 150 free calls/day (optional backup)
const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY;

// Country to TheMealDB Area mapping
const COUNTRY_TO_AREA = {
  // Direct matches
  'Canada': 'Canadian', 'China': 'Chinese', 'Croatia': 'Croatian',
  'Egypt': 'Egyptian', 'France': 'French', 'Greece': 'Greek',
  'India': 'Indian', 'Ireland': 'Irish', 'Italy': 'Italian',
  'Jamaica': 'Jamaican', 'Japan': 'Japanese', 'Kenya': 'Kenyan',
  'Malaysia': 'Malaysian', 'Mexico': 'Mexican', 'Morocco': 'Moroccan',
  'Netherlands': 'Dutch', 'Philippines': 'Filipino', 'Poland': 'Polish',
  'Portugal': 'Portuguese', 'Russia': 'Russian', 'Spain': 'Spanish',
  'Thailand': 'Thai', 'Tunisia': 'Tunisian', 'Turkey': 'Turkish',
  'Ukraine': 'Ukrainian', 'United Kingdom': 'British', 'Vietnam': 'Vietnamese',
  'United States': 'American', 'USA': 'American', 'United States of America': 'American',
  
  // Regional mappings
  'Bangladesh': 'Indian', 'Pakistan': 'Indian', 'Nepal': 'Indian', 'Sri Lanka': 'Indian',
  'Indonesia': 'Malaysian', 'Singapore': 'Malaysian', 'Brunei': 'Malaysian',
  'South Korea': 'Japanese', 'Taiwan': 'Chinese', 'Hong Kong': 'Chinese',
  'Germany': 'British', 'Austria': 'British', 'Switzerland': 'French',
  'Belgium': 'French', 'Argentina': 'Mexican', 'Brazil': 'Mexican',
  'Colombia': 'Mexican', 'Peru': 'Mexican', 'Chile': 'Mexican',
  'Saudi Arabia': 'Moroccan', 'UAE': 'Moroccan', 'Lebanon': 'Turkish',
  'Israel': 'Turkish', 'Iran': 'Turkish', 'Iraq': 'Turkish',
  'Nigeria': 'Kenyan', 'Ghana': 'Kenyan', 'South Africa': 'Kenyan',
  'Ethiopia': 'Kenyan', 'Australia': 'American', 'New Zealand': 'American',
};

// Country-specific food keywords for Open Food Facts search
const COUNTRY_FOODS = {
  'Bangladesh': ['biryani', 'dal', 'rice', 'fish curry', 'roti', 'paratha', 'hilsa'],
  'India': ['curry', 'dal', 'rice', 'roti', 'paneer', 'biryani', 'samosa'],
  'Pakistan': ['biryani', 'nihari', 'kebab', 'roti', 'haleem', 'korma'],
  'Japan': ['sushi', 'ramen', 'rice', 'miso', 'tofu', 'teriyaki', 'tempura'],
  'China': ['rice', 'noodles', 'tofu', 'dumpling', 'stir fry', 'bok choy'],
  'Thailand': ['pad thai', 'curry', 'rice', 'tom yum', 'satay', 'mango'],
  'Vietnam': ['pho', 'spring roll', 'rice', 'banh mi', 'vermicelli'],
  'Mexico': ['tacos', 'rice', 'beans', 'tortilla', 'salsa', 'guacamole'],
  'Italy': ['pasta', 'pizza', 'risotto', 'olive oil', 'tomato', 'cheese'],
  'France': ['croissant', 'baguette', 'cheese', 'wine', 'quiche', 'crepe'],
  'Germany': ['sausage', 'bread', 'potato', 'schnitzel', 'pretzel'],
  'Greece': ['gyros', 'feta', 'olive', 'yogurt', 'pita', 'hummus'],
  'Turkey': ['kebab', 'pita', 'yogurt', 'rice', 'baklava', 'lentil'],
  'Morocco': ['couscous', 'tagine', 'mint tea', 'chickpea', 'lamb'],
  'Nigeria': ['jollof rice', 'plantain', 'beans', 'yam', 'egusi'],
  'Kenya': ['ugali', 'sukuma', 'beans', 'chapati', 'nyama choma'],
  'Brazil': ['rice', 'beans', 'beef', 'acai', 'tapioca', 'coconut'],
  'United States': ['burger', 'chicken', 'salad', 'steak', 'eggs', 'bacon'],
  'United Kingdom': ['fish', 'chips', 'roast', 'pie', 'beans', 'toast'],
};

function httpsGet(hostname, path, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const req = https.get({ hostname, path, headers: { 'User-Agent': 'NutriMind/1.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(timeout, () => { req.destroy(); resolve(null); });
  });
}

/**
 * Get meals from TheMealDB by country/area - FREE API
 */
async function getMealsFromMealDB(country, count = 10) {
  const area = COUNTRY_TO_AREA[country] || 'American';
  
  try {
    // Get meals by area
    const data = await httpsGet(MEALDB_BASE, `/api/json/v1/1/filter.php?a=${area}`);
    if (!data?.meals) return [];
    
    // Get random selection
    const meals = data.meals.sort(() => Math.random() - 0.5).slice(0, count);
    
    // Fetch full details for each meal (parallel)
    const detailed = await Promise.all(
      meals.map(m => httpsGet(MEALDB_BASE, `/api/json/v1/1/lookup.php?i=${m.idMeal}`))
    );
    
    return detailed.filter(d => d?.meals?.[0]).map(d => {
      const m = d.meals[0];
      // Extract ingredients
      const ingredients = [];
      for (let i = 1; i <= 20; i++) {
        if (m[`strIngredient${i}`]?.trim()) {
          ingredients.push(`${m[`strMeasure${i}`] || ''} ${m[`strIngredient${i}`]}`.trim());
        }
      }
      return {
        name: m.strMeal,
        category: m.strCategory,
        area: m.strArea,
        instructions: m.strInstructions?.slice(0, 200),
        image: m.strMealThumb,
        ingredients: ingredients.slice(0, 8),
        source: 'TheMealDB',
        // Estimate calories based on category
        calories: estimateCalories(m.strCategory, ingredients.length),
        protein: estimateProtein(m.strCategory, ingredients),
      };
    });
  } catch (err) {
    console.error('MealDB error:', err.message);
    return [];
  }
}

/**
 * Search foods from Open Food Facts - FREE API
 */
async function searchOpenFoodFacts(query, country = 'world', count = 10) {
  try {
    const cc = getCountryCode(country);
    const hostname = cc !== 'world' ? `${cc}.openfoodfacts.org` : 'world.openfoodfacts.org';
    const path = `/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${count}`;
    
    const data = await httpsGet(hostname, path);
    if (!data?.products) return [];
    
    return data.products.filter(p => p.product_name).map(p => ({
      name: p.product_name,
      brand: p.brands,
      calories: Math.round(p.nutriments?.['energy-kcal_100g'] || p.nutriments?.energy_100g / 4.184 || 0),
      protein: Math.round(p.nutriments?.proteins_100g || 0),
      carbs: Math.round(p.nutriments?.carbohydrates_100g || 0),
      fat: Math.round(p.nutriments?.fat_100g || 0),
      fiber: Math.round(p.nutriments?.fiber_100g || 0),
      servingSize: p.serving_size || '100g',
      image: p.image_small_url,
      source: 'OpenFoodFacts',
      nutriscore: p.nutriscore_grade,
    }));
  } catch (err) {
    console.error('OpenFoodFacts error:', err.message);
    return [];
  }
}

/**
 * Get country-specific foods combining multiple sources
 */
async function getCountryFoods(country, mealType, targetCalories, count = 12) {
  const results = [];
  
  // 1. Try TheMealDB first (best for recipes)
  const mealDbResults = await getMealsFromMealDB(country, Math.ceil(count / 2));
  results.push(...mealDbResults);
  
  // 2. Search Open Food Facts with country-specific keywords
  const keywords = COUNTRY_FOODS[country] || COUNTRY_FOODS['United States'];
  const keyword = keywords[Math.floor(Math.random() * keywords.length)];
  // Run OpenFoodFacts and FatSecret in parallel for broader coverage
  try {
    const [offResults, fatResults] = await Promise.all([
      searchOpenFoodFacts(keyword, country, Math.ceil(count / 2)).catch(() => []),
      (async () => {
        try {
          // FatSecret may return different shape; normalize minimal fields
          const fs = await fatSecretService.searchFoods(keyword, Math.ceil(count / 2));
          if (!Array.isArray(fs)) return [];
          return fs.map(f => ({
            name: f.food_name || f.name || f.name_display || f.name, // try several keys
            calories: f.calories || f.calories_per_100g || 0,
            protein: f.protein || 0,
            carbs: f.carbs || 0,
            fat: f.fat || 0,
            source: 'FatSecret'
          }));
        } catch (e) { return []; }
      })()
    ]);
    results.push(...offResults);
    results.push(...fatResults);
  } catch (err) {
    // fallback to individual calls
    try { const offResults = await searchOpenFoodFacts(keyword, country, Math.ceil(count / 2)); results.push(...offResults); } catch(e){}
  }
  
  // 3. If still not enough, try Spoonacular as backup
  if (results.length < 5 && SPOONACULAR_KEY) {
    const spoonResults = await searchSpoonacular(country, mealType, targetCalories, count - results.length);
    results.push(...spoonResults);
  }
  
  // Filter by calorie range if specified
  let filtered = results;
  if (targetCalories > 0) {
    const minCal = Math.max(50, targetCalories - 200);
    const maxCal = targetCalories + 300;
    filtered = results.filter(r => !r.calories || (r.calories >= minCal && r.calories <= maxCal));
    if (filtered.length < 3) filtered = results; // Use all if too few match
  }
  
  // Deduplicate and return
  const seen = new Set();
  return filtered.filter(r => {
    const key = r.name.toLowerCase().slice(0, 20);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, count);
}

/**
 * Spoonacular backup (150 free calls/day)
 */
async function searchSpoonacular(country, mealType, targetCalories, count) {
  if (!SPOONACULAR_KEY) return [];
  
  const cuisine = getCuisineForSpoonacular(country);
  const type = mealType === 'snacks' ? 'snack' : mealType === 'breakfast' ? 'breakfast' : 'main course';
  const path = `/recipes/complexSearch?apiKey=${SPOONACULAR_KEY}&cuisine=${encodeURIComponent(cuisine)}&type=${encodeURIComponent(type)}&number=${count}&addRecipeNutrition=true`;
  
  try {
    const data = await httpsGet('api.spoonacular.com', path);
    return (data?.results || []).map(r => ({
      name: r.title,
      calories: Math.round(r.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || targetCalories),
      protein: Math.round(r.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 0),
      carbs: Math.round(r.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0),
      fat: Math.round(r.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 0),
      image: r.image,
      source: 'Spoonacular'
    }));
  } catch { return []; }
}

// Helper functions
function estimateCalories(category, ingredientCount) {
  const base = { 'Beef': 450, 'Chicken': 350, 'Seafood': 300, 'Vegetarian': 280, 
                 'Pasta': 400, 'Dessert': 350, 'Breakfast': 300, 'Side': 150 };
  return (base[category] || 350) + (ingredientCount * 10);
}

function estimateProtein(category, ingredients) {
  const proteinIngredients = ['chicken', 'beef', 'fish', 'egg', 'tofu', 'lentil', 'bean', 'cheese', 'yogurt'];
  const hasProtein = ingredients.some(i => proteinIngredients.some(p => i.toLowerCase().includes(p)));
  const base = { 'Beef': 35, 'Chicken': 30, 'Seafood': 25, 'Vegetarian': 12 };
  return (base[category] || 15) + (hasProtein ? 10 : 0);
}

function getCountryCode(country) {
  const codes = { 'France': 'fr', 'Germany': 'de', 'Spain': 'es', 'Italy': 'it', 
                  'United Kingdom': 'uk', 'Netherlands': 'nl', 'Belgium': 'be',
                  'United States': 'us', 'Canada': 'ca', 'Australia': 'au' };
  return codes[country] || 'world';
}

function getCuisineForSpoonacular(country) {
  const map = { 'Bangladesh': 'Asian', 'India': 'Indian', 'Pakistan': 'Middle Eastern',
                'Japan': 'Japanese', 'China': 'Chinese', 'Thailand': 'Thai',
                'Vietnam': 'Vietnamese', 'Mexico': 'Mexican', 'Italy': 'Italian',
                'France': 'French', 'Germany': 'German', 'Greece': 'Greek' };
  return map[country] || 'American';
}

function getAreaForCountry(country) {
  return COUNTRY_TO_AREA[country] || 'American';
}

module.exports = {
  getMealsFromMealDB,
  searchOpenFoodFacts,
  getCountryFoods,
  getAreaForCountry,
  COUNTRY_TO_AREA,
  COUNTRY_FOODS
};
