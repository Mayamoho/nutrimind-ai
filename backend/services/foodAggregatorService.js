// Food Aggregator Service - combines multiple food data sources
const openFoodFactsService = require('./openFoodFactsService');
const spoonacularService = require('./spoonacularService');

async function searchFood(query, country = 'world') {
  if (!query) return [];
  const results = [];

  // 1. OpenFoodFacts (packaged/brand foods)
  try {
    const off = await openFoodFactsService.searchFood(query, country, 10);
    if (off?.length) results.push(...off.map(r => ({
      name: r.name,
      brand: r.brand || '',
      calories: Number(r.calories) || 0,
      protein: Number(r.protein) || 0,
      carbs: Number(r.carbs) || 0,
      fat: Number(r.fat) || 0,
      source: 'OpenFoodFacts'
    })));
  } catch (e) { console.warn('OpenFoodFacts error in aggregator:', e.message || e); }

  // 2. Spoonacular as backup
  try {
    const spoon = await spoonacularService.searchFood(query);
    if (spoon?.length) results.push(...spoon.map(r => ({
      name: r.name,
      brand: r.brand || '',
      calories: Number(r.calories) || 0,
      protein: Number(r.protein) || 0,
      carbs: Number(r.carbs) || 0,
      fat: Number(r.fat) || 0,
      source: 'Spoonacular'
    })));
  } catch (e) { console.warn('Spoonacular error in aggregator:', e.message || e); }

  return results;
}

async function parseNaturalLanguage(text) {
  try {
    return await spoonacularService.parseNaturalLanguage(text);
  } catch (e) {
    console.error('NLP error:', e.message);
    return [];
  }
}

async function analyzeImage(imageUrl) {
  try {
    return await spoonacularService.analyzeImageByUrl(imageUrl);
  } catch (e) {
    console.error('Image error:', e.message);
    return null;
  }
}

async function getFoodByBarcode(barcode) {
  try {
    return await openFoodFactsService.getFoodByBarcode(barcode);
  } catch (e) {
    console.error('Barcode error:', e.message);
    return null;
  }
}

function clearCache() { /* noop */ }
function getCacheStats() { return { size: 0 }; }

module.exports = { searchFood, parseNaturalLanguage, analyzeImage, getFoodByBarcode, clearCache, getCacheStats };


const cache = new Map();
const CACHE_TTL = 3600000;

// Circuit-breaker state for OpenFoodFacts with improved cooldown logic
const openFoodFactsState = { 
  failures: 0, 
  disabledUntil: 0, 
  disabled: false,
  lastError: null,
  lastErrorTime: 0
};

const OPENFOODFACTS_FAILURE_THRESHOLD = process.env.OPENFOODFACTS_FAILURE_THRESHOLD
  ? Number(process.env.OPENFOODFACTS_FAILURE_THRESHOLD)
  : 3; // Reduced threshold to fail faster but with shorter cooldown

const OPENFOODFACTS_COOLDOWN_MS = process.env.OPENFOODFACTS_COOLDOWN_MS
  ? Number(process.env.OPENFOODFACTS_COOLDOWN_MS)
  : 60 * 1000; // Reduced default cooldown to 1 minute

// Reset failure count after a period of stability
const FAILURE_RESET_MS = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const item = cache.get(key);
  if (!item || Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.value;
}

function setCache(key, value) {
  cache.set(key, { value, timestamp: Date.now() });
}

/**
 * Search food across FREE APIs
 * Priority: Spoonacular -> Open Food Facts
 */
async function searchFood(query, country = 'world') {
  if (!query?.trim()) return [];

  const cacheKey = `food:${query.toLowerCase().trim()}:${country}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let results = [];
  let usedGeminiFallback = false;

  // Order of preference: FatSecret (fast), USDA (core dataset), OpenFoodFacts (packaged), MealDB (regional recipes), Spoonacular (optional), Gemini fallback

  // 1. FatSecret (if available)
  try {
    const fs = require('./fatSecretService');
    const fsResults = await fs.searchFoods(query, 10);
    if (Array.isArray(fsResults) && fsResults.length) {
      results.push(...fsResults.map(f => ({
        name: f.food_name || f.name || f.name_display || f.name,
        brand: f.brand_name || f.brand || '',
        calories: Number(f.calories) || Number(f.calories_per_100g) || 0,
        protein: Number(f.protein) || 0,
        carbs: Number(f.carbs) || 0,
        fat: Number(f.fat) || 0,
        source: 'FatSecret'
      })));
    }
  } catch (e) { console.warn('FatSecret error in aggregator:', e.message || e); }

  // 2. USDA (FoodData Central)
  try {
    const usda = require('./usdaService');
    const usdaResults = await usda.searchFood(query, 10);
    if (usdaResults?.length) results.push(...usdaResults.map(r => ({
      name: r.name,
      brand: r.brand || '',
      calories: Number(r.calories) || 0,
      protein: Number(r.protein) || 0,
      carbs: Number(r.carbs) || 0,
      fat: Number(r.fat) || 0,
      source: 'USDA'
    })));
  } catch (e) { console.warn('USDA search error in aggregator:', e.message || e); }

  // 3. OpenFoodFacts (packaged/brand foods)
  try {
    const off = await openFoodFactsService.searchFood(query, country, 10);
    if (off?.length) results.push(...off.map(r => ({
      name: r.name,
      brand: r.brand || '',
      calories: Number(r.calories) || 0,
      protein: Number(r.protein) || 0,
      carbs: Number(r.carbs) || 0,
      fat: Number(r.fat) || 0,
      source: 'OpenFoodFacts'
    })));
  } catch (e) { console.warn('OpenFoodFacts error in aggregator:', e.message || e); }

  // 4. TheMealDB / FAO/INFOODS simulation (regional recipes/info)
  try {
    const fb = require('./foodApiService');
    const meals = await fb.getMealsFromMealDB(country, 6);
    if (meals?.length) results.push(...meals.map(m => ({
      name: m.name,
      calories: Number(m.calories) || 0,
      protein: Number(m.protein) || 0,
      carbs: Number(m.carbs) || 0,
      fat: Number(m.fat) || 0,
      source: 'MealDB'
    })));
  } catch (e) { console.warn('MealDB/FAO simulation error in aggregator:', e.message || e); }

  // 5. Spoonacular as optional backup
  try {
    const spoon = await spoonacularService.searchFood(query);
    if (spoon?.length) results.push(...spoon.map(r => ({
      name: r.name,
      brand: r.brand || '',
      calories: Number(r.calories) || 0,
      protein: Number(r.protein) || 0,
      carbs: Number(r.carbs) || 0,
      fat: Number(r.fat) || 0,
      source: r.source || 'Spoonacular'
    })));
  } catch (e) { console.warn('Spoonacular error in aggregator:', e.message || e); }

  // If still no results or very few results, fallback to Gemini free API analysis
  if (results.length < 2) {
    try {
      const gem = require('./geminiAdapter');
      const parsed = await gem.analyzeFood(query);
      if (Array.isArray(parsed) && parsed.length) {
        usedGeminiFallback = true;
        results.push(...parsed.map(p => ({
          name: p.foodName || p.name || 'Food',
          calories: Math.round(Number(p.calories) || Number(p.energy_kcal) || 0),
          protein: Number(p.protein) || Number(p.proteins) || 0,
          carbs: Number(p.carbohydrates) || Number(p.carbs) || 0,
          fat: Number(p.fat) || 0,
          source: 'Gemini'
        })));
      }
    } catch (e) { console.warn('Gemini fallback failed:', e.message || e); }
  }

  // Normalize: ensure macros exist for every item
  results = results.map(r => ({
    name: String(r.name || 'Unknown'),
    brand: r.brand || '',
    calories: Math.round(Number(r.calories) || 0),
    protein: Math.round(Number(r.protein) || 0),
    carbs: Math.round(Number(r.carbs) || 0),
    fat: Math.round(Number(r.fat) || 0),
    source: r.source || 'unknown'
  }));

  // Deduplicate by name
  const seen = new Set();
  const unique = results.filter(item => {
    const key = item.name.toLowerCase().trim() + '|' + (item.brand || '').toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const final = unique.slice(0, 40);
  if (final.length) setCache(cacheKey, final);

  // Expose whether fallback to Gemini was used via meta (not in return payload for compatibility)
  if (usedGeminiFallback) console.info('FoodAggregator used Gemini fallback for query:', query);

  return final;
}

/**
 * Parse natural language using Spoonacular
 */
async function parseNaturalLanguage(text) {
  try {
    return await spoonacularService.parseNaturalLanguage(text);
  } catch (e) {
    console.error('NLP error:', e.message);
    return [];
  }
}

/**
 * Analyze food image using Spoonacular
 */
async function analyzeImage(imageUrl) {
  try {
    return await spoonacularService.analyzeImageByUrl(imageUrl);
  } catch (e) {
    console.error('Image error:', e.message);
    return null;
  }
}

/**
 * Get food by barcode using Open Food Facts
 */
async function getFoodByBarcode(barcode) {
  try {
    return await openFoodFactsService.getFoodByBarcode(barcode);
  } catch (e) {
    console.error('Barcode error:', e.message);
    return null;
  }
}

function clearCache() { cache.clear(); }
function getCacheStats() { return { size: cache.size }; }

module.exports = {
  searchFood,
  parseNaturalLanguage,
  analyzeImage,
  getFoodByBarcode,
  clearCache,
  getCacheStats
};
