/**
 * FatSecret API Routes
 * Provides food search and nutrition data endpoints
 * Replaces Gemini-based food analysis with FatSecret API
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const fatSecretService = require('../services/fatSecretService');
const geminiAdapter = require('../services/geminiAdapter');

/**
 * @route   GET /api/fatsecret/search
 * @desc    Search foods by name
 * @query   q - search query, limit - max results (default 20)
 */
router.get('/search', auth, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({ foods: [] });
    }

    const foods = await fatSecretService.searchFoods(q, parseInt(limit));
    res.json({ foods });
  } catch (err) {
    console.error('FatSecret search error:', err);
    res.status(500).json({ error: err.message || 'Failed to search foods' });
  }
});

/**
 * @route   GET /api/fatsecret/food/:id
 * @desc    Get detailed food info by FatSecret ID
 */
router.get('/food/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const food = await fatSecretService.getFoodById(id);
    res.json({ food });
  } catch (err) {
    console.error('FatSecret get food error:', err);
    res.status(500).json({ error: err.message || 'Failed to get food details' });
  }
});

/**
 * @route   POST /api/fatsecret/analyze
 * @desc    Analyze food text input - searches FatSecret and returns formatted results
 *          Falls back to local database if FatSecret fails
 * @body    { text: string, mealType: string }
 */
router.post('/analyze', auth, async (req, res) => {
  const startTime = Date.now();
  console.log(`[FatSecret Analyze] Request: ${req.body.text?.substring(0, 50)}... for user: ${req.user?.email}`);
  
  // Set a hard timeout for the entire request
  const timeout = setTimeout(() => {
    console.log('[FatSecret Analyze] Request timed out after 15 seconds');
    if (!res.headersSent) {
      res.status(504).json({ error: 'Request timed out. Please try again.' });
    }
  }, 15000);
  
  try {
    const { text, mealType } = req.body;
    
    if (!text || text.trim().length === 0) {
      clearTimeout(timeout);
      return res.status(400).json({ error: 'Text is required' });
    }

    // First, try Gemini (preferred) for analysis
    if (geminiAdapter?.isAvailable()) {
      try {
        console.log('[FatSecret Analyze] Trying Gemini first...');
        const parsed = await geminiAdapter.analyzeFood(text);
        if (Array.isArray(parsed) && parsed.length) {
          const duration = Date.now() - startTime;
          console.log(`[FatSecret Analyze] Gemini succeeded in ${duration}ms, returning ${parsed.length} foods`);
          clearTimeout(timeout);
          return res.json({ foods: parsed, source: 'gemini' });
        }
      } catch (err) {
        // If rate limited, fall through to FatSecret/local fallback
        if (err.status === 429 || (err.message && String(err.message).includes('429'))) {
          console.warn('[FatSecret Analyze] Gemini rate limit, falling back to FatSecret');
        } else {
          console.warn('[FatSecret Analyze] Gemini analyze failed, continuing to FatSecret:', err.message || err);
        }
      }
    }

    // Parse the input to extract food items
    const foodTerms = parseInputText(text);
    console.log(`[FatSecret Analyze] Parsed ${foodTerms.length} food terms from input`);
    
    const results = [];
    let usedFallback = false;
    
    for (const term of foodTerms) {
      try {
        console.log(`[FatSecret Analyze] Searching FatSecret for: "${term.name}"`);
        // Try FatSecret first
        const foods = await fatSecretService.searchFoods(term.name, 5);
        
        if (foods.length > 0) {
          const bestMatch = foods[0];
          console.log(`[FatSecret Analyze] Found FatSecret match: "${bestMatch.name}"`);
          
          try {
            const detailed = await fatSecretService.getFoodById(bestMatch.id);
            const defaultServing = detailed.servings.find(s => s.isDefault) || detailed.servings[0];
            
            if (defaultServing) {
              const foodLog = fatSecretService.toFoodLogFormat(
                detailed,
                defaultServing,
                mealType,
                term.quantity
              );
              console.log(`[FatSecret Analyze] Created food log with ${foodLog.nutrients.micros.length} micro-nutrients`);
              results.push(foodLog);
              continue;
            }
          } catch (detailErr) {
            console.warn(`[FatSecret Analyze] Failed to get details for ${bestMatch.id}, using quick format:`, detailErr.message);
            // Fallback to quick format
            const quickFood = fatSecretService.toQuickFoodFormat(bestMatch, mealType, term.quantity);
            console.log(`[FatSecret Analyze] Created quick food log with ${quickFood.nutrients.micros.length} micro-nutrients`);
            results.push(quickFood);
            continue;
          }
        }
      } catch (fatSecretErr) {
        console.log(`[FatSecret Analyze] FatSecret failed for "${term.name}", using local database:`, fatSecretErr.message);
        usedFallback = true;
      }
      
      // Fallback to local database
      console.log(`[FatSecret Analyze] Using local database fallback for: "${term.name}"`);
      const localFood = searchLocalDatabase(term.name, mealType, term.quantity);
      if (localFood) {
        console.log(`[FatSecret Analyze] Local food created with ${localFood.nutrients.micros.length} micro-nutrients`);
        results.push(localFood);
      }
    }

    if (results.length === 0) {
      clearTimeout(timeout);
      return res.status(404).json({ error: 'No foods found matching your input. Try being more specific (e.g., "chicken breast", "brown rice")' });
    }

    const duration = Date.now() - startTime;
    console.log(`[FatSecret Analyze] Completed in ${duration}ms, returning ${results.length} foods, source: ${usedFallback ? 'local' : 'fatsecret'}`);
    clearTimeout(timeout);

    res.json({ 
      foods: results,
      source: usedFallback ? 'local' : 'fatsecret'
    });
  } catch (err) {
    clearTimeout(timeout);
    const duration = Date.now() - startTime;
    console.error(`[FatSecret Analyze] Error after ${duration}ms:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Failed to analyze food' });
    }
  }
});

/**
 * Search local food database as fallback
 */
function searchLocalDatabase(query, mealType, quantity = 1) {
  const localFoods = {
    // Common foods with approximate nutrition per 100g
    'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, sodium: 1, fiber: 0.4, sugar: 0.1, potassium: 55, calcium: 10, iron: 0.8 },
    'chicken': { calories: 165, protein: 31, carbs: 0, fat: 3.6, sodium: 74, fiber: 0, sugar: 0, potassium: 256, calcium: 15, iron: 1.3, cholesterol: 88 },
    'egg': { calories: 155, protein: 13, carbs: 1.1, fat: 11, sodium: 124, fiber: 0, sugar: 1.1, potassium: 138, calcium: 56, iron: 1.8, cholesterol: 373 },
    'bread': { calories: 265, protein: 9, carbs: 49, fat: 3.2, sodium: 491, fiber: 2.7, sugar: 5, potassium: 115, calcium: 192, iron: 3.6 },
    'milk': { calories: 42, protein: 3.4, carbs: 5, fat: 1, sodium: 44, fiber: 0, sugar: 5, potassium: 150, calcium: 125, iron: 0.03, vitaminA: 46, vitaminD: 1.3 },
    'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, sodium: 1, fiber: 2.6, sugar: 12, potassium: 358, calcium: 5, iron: 0.26, vitaminC: 8.7 },
    'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, sodium: 1, fiber: 2.4, sugar: 10, potassium: 107, calcium: 6, iron: 0.12, vitaminC: 4.6 },
    'potato': { calories: 77, protein: 2, carbs: 17, fat: 0.1, sodium: 6, fiber: 2.2, sugar: 0.8, potassium: 421, calcium: 12, iron: 0.78, vitaminC: 19.7 },
    'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, sodium: 5, fiber: 1.2, sugar: 2.6, potassium: 237, calcium: 10, iron: 0.27, vitaminA: 833, vitaminC: 13.7 },
    'carrot': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, sodium: 69, fiber: 2.8, sugar: 4.7, potassium: 320, calcium: 33, iron: 0.3, vitaminA: 835, vitaminK: 13.2 },
    'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, sodium: 33, fiber: 2.6, sugar: 1.5, potassium: 316, calcium: 47, iron: 0.73, vitaminA: 31, vitaminC: 89.2 },
    'fish': { calories: 206, protein: 22, carbs: 0, fat: 12, sodium: 60, fiber: 0, sugar: 0, potassium: 435, calcium: 12, iron: 1.5, vitaminD: 11 },
    'beef': { calories: 250, protein: 26, carbs: 0, fat: 15, sodium: 60, fiber: 0, sugar: 0, potassium: 318, calcium: 15, iron: 2.6, zinc: 8.7, cholesterol: 75 },
    'pork': { calories: 242, protein: 27, carbs: 0, fat: 14, sodium: 62, fiber: 0, sugar: 0, potassium: 346, calcium: 19, iron: 1.3, zinc: 5.2, cholesterol: 80 },
    'cheese': { calories: 402, protein: 25, carbs: 1.3, fat: 33, sodium: 621, fiber: 0, sugar: 0.5, potassium: 98, calcium: 721, iron: 0.2, vitaminA: 263 },
    'yogurt': { calories: 59, protein: 10, carbs: 3.6, fat: 0.4, sodium: 36, fiber: 0, sugar: 3.6, potassium: 141, calcium: 110, iron: 0.05 },
    'oats': { calories: 389, protein: 17, carbs: 66, fat: 7, sodium: 2, fiber: 10.6, sugar: 0.6, potassium: 429, calcium: 54, iron: 4.7, magnesium: 177 },
    'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1, sodium: 1, fiber: 1.8, sugar: 0.6, potassium: 44, calcium: 7, iron: 0.8 },
    'salmon': { calories: 208, protein: 20, carbs: 0, fat: 13, sodium: 59, fiber: 0, sugar: 0, potassium: 490, calcium: 12, iron: 1.3, vitaminD: 11, omega3: 2.5 },
    'tuna': { calories: 132, protein: 28, carbs: 0, fat: 1.3, sodium: 37, fiber: 0, sugar: 0, potassium: 375, calcium: 27, iron: 1.3, vitaminD: 6, mercury: 0.2 },
    'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, sodium: 79, fiber: 2.2, sugar: 0.4, potassium: 558, calcium: 99, iron: 2.7, vitaminA: 469, vitaminK: 483 },
    'avocado': { calories: 160, protein: 2, carbs: 9, fat: 15, sodium: 7, fiber: 6.7, sugar: 0.7, potassium: 485, calcium: 12, iron: 0.6, vitaminK: 21 },
    'nuts': { calories: 607, protein: 20, carbs: 21, fat: 54, sodium: 1, fiber: 7, sugar: 4, potassium: 441, calcium: 98, iron: 2.6, magnesium: 270, vitaminE: 15.3 },
    'beans': { calories: 127, protein: 8.7, carbs: 23, fat: 0.5, sodium: 1, fiber: 6.4, sugar: 0.3, potassium: 405, calcium: 27, iron: 2.1, magnesium: 44 },
    'lentils': { calories: 116, protein: 9, carbs: 20, fat: 0.4, sodium: 2, fiber: 7.9, sugar: 1.8, potassium: 369, calcium: 19, iron: 3.3, magnesium: 36 },
    'tofu': { calories: 76, protein: 8, carbs: 1.9, fat: 4.8, sodium: 7, fiber: 0.3, sugar: 0.9, potassium: 121, calcium: 350, iron: 1.5, magnesium: 30 },
    'paneer': { calories: 265, protein: 18, carbs: 1.2, fat: 20, sodium: 18, fiber: 0, sugar: 1.2, potassium: 138, calcium: 455, iron: 0.3 },
    'dal': { calories: 116, protein: 9, carbs: 20, fat: 0.4, sodium: 2, fiber: 7.9, sugar: 1.8, potassium: 369, calcium: 19, iron: 3.3, magnesium: 36 },
    'roti': { calories: 297, protein: 11, carbs: 51, fat: 7, sodium: 150, fiber: 2, sugar: 1, potassium: 107, calcium: 15, iron: 2.3 },
    'chapati': { calories: 297, protein: 11, carbs: 51, fat: 7, sodium: 150, fiber: 2, sugar: 1, potassium: 107, calcium: 15, iron: 2.3 },
    'naan': { calories: 262, protein: 9, carbs: 45, fat: 5, sodium: 418, fiber: 2, sugar: 1, potassium: 141, calcium: 19, iron: 2.1 },
    'idli': { calories: 58, protein: 2, carbs: 12, fat: 0.1, sodium: 280, fiber: 0.8, sugar: 0.2, potassium: 61, calcium: 8, iron: 0.5 },
    'dosa': { calories: 168, protein: 4, carbs: 29, fat: 4, sodium: 320, fiber: 1.5, sugar: 1.2, potassium: 178, calcium: 13, iron: 1.1 },
    'paratha': { calories: 320, protein: 6, carbs: 40, fat: 15, sodium: 450, fiber: 3, sugar: 2, potassium: 120, calcium: 20, iron: 2.5 },
    'biryani': { calories: 200, protein: 8, carbs: 30, fat: 5, sodium: 650, fiber: 2, sugar: 1, potassium: 200, calcium: 25, iron: 2, vitaminA: 100 },
    'curry': { calories: 150, protein: 10, carbs: 15, fat: 6, sodium: 500, fiber: 2.5, sugar: 3, potassium: 300, calcium: 50, iron: 2, vitaminC: 15 }
  };

  const searchTerm = query.toLowerCase();
  
  // Find matching food
  for (const [name, nutrition] of Object.entries(localFoods)) {
    if (searchTerm.includes(name) || name.includes(searchTerm)) {
      return {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        calories: Math.round(nutrition.calories * quantity),
        mealType: mealType,
        servingQuantity: quantity,
        servingUnit: '100g',
        nutrients: {
          macros: [
            { name: 'Protein', amount: Math.round(nutrition.protein * quantity * 10) / 10, unit: 'g' },
            { name: 'Carbs', amount: Math.round(nutrition.carbs * quantity * 10) / 10, unit: 'g' },
            { name: 'Fat', amount: Math.round(nutrition.fat * quantity * 10) / 10, unit: 'g' }
          ],
          micros: [
            { name: 'Fiber', amount: Math.round((nutrition.fiber || 0) * quantity * 10) / 10, unit: 'g' },
            { name: 'Sugar', amount: Math.round((nutrition.sugar || 0) * quantity * 10) / 10, unit: 'g' },
            { name: 'Sodium', amount: Math.round((nutrition.sodium || 0) * quantity), unit: 'mg' },
            { name: 'Potassium', amount: Math.round((nutrition.potassium || 0) * quantity), unit: 'mg' },
            { name: 'Calcium', amount: Math.round((nutrition.calcium || 0) * quantity), unit: 'mg' },
            { name: 'Iron', amount: Math.round((nutrition.iron || 0) * quantity * 10) / 10, unit: 'mg' },
            ...(nutrition.cholesterol ? [{ name: 'Cholesterol', amount: Math.round(nutrition.cholesterol * quantity), unit: 'mg' }] : []),
            ...(nutrition.vitaminA ? [{ name: 'Vitamin A', amount: Math.round(nutrition.vitaminA * quantity), unit: 'mcg' }] : []),
            ...(nutrition.vitaminC ? [{ name: 'Vitamin C', amount: Math.round(nutrition.vitaminC * quantity), unit: 'mg' }] : []),
            ...(nutrition.vitaminD ? [{ name: 'Vitamin D', amount: Math.round(nutrition.vitaminD * quantity), unit: 'mcg' }] : []),
            ...(nutrition.magnesium ? [{ name: 'Magnesium', amount: Math.round(nutrition.magnesium * quantity), unit: 'mg' }] : []),
            ...(nutrition.zinc ? [{ name: 'Zinc', amount: Math.round(nutrition.zinc * quantity * 10) / 10, unit: 'mg' }] : [])
          ]
        },
        source: 'local'
      };
    }
  }
  
  // If no match, return a generic estimate with basic micros
  return {
    name: query.charAt(0).toUpperCase() + query.slice(1),
    calories: Math.round(200 * quantity),
    mealType: mealType,
    servingQuantity: quantity,
    servingUnit: 'serving',
    nutrients: {
      macros: [
        { name: 'Protein', amount: Math.round(10 * quantity * 10) / 10, unit: 'g' },
        { name: 'Carbs', amount: Math.round(30 * quantity * 10) / 10, unit: 'g' },
        { name: 'Fat', amount: Math.round(5 * quantity * 10) / 10, unit: 'g' }
      ],
      micros: [
        { name: 'Fiber', amount: Math.round(2 * quantity * 10) / 10, unit: 'g' },
        { name: 'Sugar', amount: Math.round(5 * quantity * 10) / 10, unit: 'g' },
        { name: 'Sodium', amount: Math.round(100 * quantity), unit: 'mg' },
        { name: 'Potassium', amount: Math.round(200 * quantity), unit: 'mg' },
        { name: 'Calcium', amount: Math.round(50 * quantity), unit: 'mg' },
        { name: 'Iron', amount: Math.round(1 * quantity * 10) / 10, unit: 'mg' }
      ]
    },
    source: 'estimated'
  };
}

/**
 * @route   POST /api/fatsecret/log-food
 * @desc    Get food details and format for logging
 * @body    { foodId: string, servingId: string, quantity: number, mealType: string }
 */
router.post('/log-food', auth, async (req, res) => {
  try {
    const { foodId, servingId, quantity = 1, mealType } = req.body;
    
    if (!foodId) {
      return res.status(400).json({ error: 'Food ID is required' });
    }

    const food = await fatSecretService.getFoodById(foodId);
    
    // Find the requested serving or use default
    let serving = food.servings.find(s => s.id === servingId);
    if (!serving) {
      serving = food.servings.find(s => s.isDefault) || food.servings[0];
    }

    if (!serving) {
      return res.status(404).json({ error: 'No serving information available' });
    }

    const foodLog = fatSecretService.toFoodLogFormat(food, serving, mealType, quantity);
    res.json({ food: foodLog });
  } catch (err) {
    console.error('FatSecret log-food error:', err);
    res.status(500).json({ error: err.message || 'Failed to get food for logging' });
  }
});

/**
 * Parse input text to extract food items with quantities
 * Handles: "2 eggs", "chicken and rice", "1 cup oatmeal with banana"
 */
function parseInputText(text) {
  const items = [];
  
  // Split by common separators
  const parts = text.toLowerCase()
    .replace(/\band\b/g, ',')
    .replace(/\bwith\b/g, ',')
    .replace(/\bplus\b/g, ',')
    .replace(/\+/g, ',')
    .split(/[,;]/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  for (const part of parts) {
    // Try to extract quantity and food name
    // Patterns: "2 eggs", "1 cup rice", "large apple", "chicken breast"
    const quantityMatch = part.match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
    const fractionMatch = part.match(/^(half|quarter|1\/2|1\/4|1\/3|2\/3|3\/4)\s+(.+)$/i);
    
    let quantity = 1;
    let name = part;

    if (quantityMatch) {
      quantity = parseFloat(quantityMatch[1]);
      name = quantityMatch[2].trim();
    } else if (fractionMatch) {
      const fractionMap = {
        'half': 0.5, '1/2': 0.5,
        'quarter': 0.25, '1/4': 0.25,
        '1/3': 0.33, '2/3': 0.67, '3/4': 0.75
      };
      quantity = fractionMap[fractionMatch[1].toLowerCase()] || 1;
      name = fractionMatch[2].trim();
    }

    // Clean up common words that don't help search
    name = name
      .replace(/\b(a|an|the|of|some)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (name.length > 1) {
      items.push({ name, quantity });
    }
  }

  // If no items parsed, use the whole text as one item
  if (items.length === 0 && text.trim().length > 0) {
    items.push({ name: text.trim(), quantity: 1 });
  }

  return items;
}

module.exports = router;
