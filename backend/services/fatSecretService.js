/**
 * FatSecret API Service
 * Implements Adapter Pattern to integrate FatSecret API for food/nutrition data
 * Uses OAuth 2.0 Client Credentials flow
 */

const https = require('https');
const { URLSearchParams } = require('url');

// Token cache (Singleton pattern)
let tokenCache = {
  accessToken: null,
  expiresAt: 0
};

/**
 * Helper function to make HTTPS requests
 */
function httpsRequest(url, options = {}, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({ ok: true, data: JSON.parse(data), text: () => data });
          } catch (e) {
            resolve({ ok: true, data: null, text: () => data });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    
    // Set timeout
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Get OAuth 2.0 access token from FatSecret
 * Implements Token Manager pattern with caching
 */
async function getAccessToken() {
  // Return cached token if still valid (with 5 min buffer)
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 300000) {
    return tokenCache.accessToken;
  }

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('FatSecret API credentials not configured. Set FATSECRET_CLIENT_ID and FATSECRET_CLIENT_SECRET in .env');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = 'grant_type=client_credentials&scope=basic';

  try {
    const response = await httpsRequest('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      },
      body
    }, 5000); // 5 second timeout for auth

    const data = response.data;
    
    // Cache the token
    tokenCache.accessToken = data.access_token;
    tokenCache.expiresAt = Date.now() + (data.expires_in * 1000);

    return data.access_token;
  } catch (error) {
    throw new Error(`FatSecret auth failed: ${error.message}`);
  }
}

/**
 * Make authenticated API call to FatSecret
 */
async function apiCall(method, params = {}) {
  const token = await getAccessToken();
  
  const queryParams = new URLSearchParams({
    method,
    format: 'json',
    ...params
  });

  try {
    const response = await httpsRequest(`https://platform.fatsecret.com/rest/server.api?${queryParams}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, 8000); // 8 second timeout for API calls

    return response.data;
  } catch (error) {
    throw new Error(`FatSecret API error: ${error.message}`);
  }
}

/**
 * Search foods by name
 * @param {string} query - Search term
 * @param {number} maxResults - Max results (default 20, max 50)
 */
async function searchFoods(query, maxResults = 20) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const data = await apiCall('foods.search', {
    search_expression: query,
    max_results: Math.min(maxResults, 50)
  });

  if (!data.foods || !data.foods.food) {
    return [];
  }

  // Normalize to array (API returns object if single result)
  const foods = Array.isArray(data.foods.food) ? data.foods.food : [data.foods.food];

  return foods.map(food => parseSearchResult(food));
}

/**
 * Get detailed food info by ID
 * @param {string} foodId - FatSecret food ID
 */
async function getFoodById(foodId) {
  const data = await apiCall('food.get.v2', { food_id: foodId });

  if (!data.food) {
    throw new Error('Food not found');
  }

  return parseDetailedFood(data.food);
}

/**
 * Parse search result into standardized format
 * Extracts nutrition from description string
 */
function parseSearchResult(food) {
  const description = food.food_description || '';
  
  // Parse "Per 100g - Calories: 22kcal | Fat: 0.34g | Carbs: 3.28g | Protein: 3.09g"
  const nutrition = parseNutritionDescription(description);

  return {
    id: food.food_id,
    name: food.food_name,
    brandName: food.brand_name || null,
    type: food.food_type, // 'Generic' or 'Brand'
    description: description,
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    servingDescription: nutrition.serving
  };
}

/**
 * Parse nutrition from description string
 */
function parseNutritionDescription(desc) {
  const result = {
    serving: '1 serving',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };

  if (!desc) return result;

  // Extract serving info (e.g., "Per 100g" or "Per 1 serving")
  const servingMatch = desc.match(/Per\s+([^-]+)/i);
  if (servingMatch) {
    result.serving = servingMatch[1].trim();
  }

  // Extract calories
  const calMatch = desc.match(/Calories:\s*([\d.]+)/i);
  if (calMatch) result.calories = parseFloat(calMatch[1]);

  // Extract protein
  const protMatch = desc.match(/Protein:\s*([\d.]+)/i);
  if (protMatch) result.protein = parseFloat(protMatch[1]);

  // Extract carbs
  const carbMatch = desc.match(/Carbs:\s*([\d.]+)/i);
  if (carbMatch) result.carbs = parseFloat(carbMatch[1]);

  // Extract fat
  const fatMatch = desc.match(/Fat:\s*([\d.]+)/i);
  if (fatMatch) result.fat = parseFloat(fatMatch[1]);

  return result;
}

/**
 * Parse detailed food response with all servings
 */
function parseDetailedFood(food) {
  const servings = food.servings?.serving;
  const servingList = Array.isArray(servings) ? servings : (servings ? [servings] : []);

  return {
    id: food.food_id,
    name: food.food_name,
    brandName: food.brand_name || null,
    type: food.food_type,
    url: food.food_url,
    servings: servingList.map(s => ({
      id: s.serving_id,
      description: s.serving_description,
      metricAmount: parseFloat(s.metric_serving_amount) || 0,
      metricUnit: s.metric_serving_unit || 'g',
      numberOfUnits: parseFloat(s.number_of_units) || 1,
      measurementDescription: s.measurement_description,
      isDefault: s.is_default === '1',
      nutrition: {
        calories: parseFloat(s.calories) || 0,
        protein: parseFloat(s.protein) || 0,
        carbs: parseFloat(s.carbohydrate) || 0,
        fat: parseFloat(s.fat) || 0,
        saturatedFat: parseFloat(s.saturated_fat) || 0,
        fiber: parseFloat(s.fiber) || 0,
        sugar: parseFloat(s.sugar) || 0,
        sodium: parseFloat(s.sodium) || 0,
        potassium: parseFloat(s.potassium) || 0,
        cholesterol: parseFloat(s.cholesterol) || 0,
        vitaminA: parseFloat(s.vitamin_a) || 0,
        vitaminC: parseFloat(s.vitamin_c) || 0,
        vitaminD: parseFloat(s.vitamin_d) || 0,
        calcium: parseFloat(s.calcium) || 0,
        iron: parseFloat(s.iron) || 0
      }
    }))
  };
}

/**
 * Convert FatSecret food to app's FoodLog format
 * Adapter pattern - transforms external API format to internal format
 */
function toFoodLogFormat(food, serving, mealType, quantity = 1) {
  const multiplier = quantity;
  const nutrition = serving.nutrition;

  return {
    name: food.brandName ? `${food.name} (${food.brandName})` : food.name,
    calories: Math.round(nutrition.calories * multiplier),
    mealType: mealType,
    servingQuantity: quantity,
    servingUnit: serving.description,
    nutrients: {
      macros: [
        { name: 'Protein', amount: Math.round(nutrition.protein * multiplier * 10) / 10, unit: 'g' },
        { name: 'Carbs', amount: Math.round(nutrition.carbs * multiplier * 10) / 10, unit: 'g' },
        { name: 'Fat', amount: Math.round(nutrition.fat * multiplier * 10) / 10, unit: 'g' }
      ],
      micros: [
        { name: 'Fiber', amount: Math.round(nutrition.fiber * multiplier * 10) / 10, unit: 'g' },
        { name: 'Sugar', amount: Math.round(nutrition.sugar * multiplier * 10) / 10, unit: 'g' },
        { name: 'Sodium', amount: Math.round(nutrition.sodium * multiplier), unit: 'mg' },
        { name: 'Potassium', amount: Math.round(nutrition.potassium * multiplier), unit: 'mg' },
        { name: 'Cholesterol', amount: Math.round(nutrition.cholesterol * multiplier), unit: 'mg' },
        { name: 'Vitamin A', amount: Math.round(nutrition.vitaminA * multiplier), unit: 'mcg' },
        { name: 'Vitamin C', amount: Math.round(nutrition.vitaminC * multiplier), unit: 'mg' },
        { name: 'Vitamin D', amount: Math.round(nutrition.vitaminD * multiplier), unit: 'mcg' },
        { name: 'Calcium', amount: Math.round(nutrition.calcium * multiplier), unit: 'mg' },
        { name: 'Iron', amount: Math.round(nutrition.iron * multiplier * 10) / 10, unit: 'mg' },
        { name: 'Saturated Fat', amount: Math.round(nutrition.saturatedFat * multiplier * 10) / 10, unit: 'g' }
      ]
    },
    fatSecretId: food.id,
    servingId: serving.id
  };
}

/**
 * Quick search with basic nutrition (from description)
 * Use this for autocomplete/search results
 */
function toQuickFoodFormat(searchResult, mealType, quantity = 1) {
  // For quick format, we only have basic macros from the description
  // Add estimated micro-nutrients based on food type
  const estimatedMicros = getEstimatedMicros(searchResult.name);
  
  return {
    name: searchResult.brandName ? `${searchResult.name} (${searchResult.brandName})` : searchResult.name,
    calories: Math.round(searchResult.calories * quantity),
    mealType: mealType,
    servingQuantity: quantity,
    servingUnit: searchResult.servingDescription,
    nutrients: {
      macros: [
        { name: 'Protein', amount: Math.round(searchResult.protein * quantity * 10) / 10, unit: 'g' },
        { name: 'Carbs', amount: Math.round(searchResult.carbs * quantity * 10) / 10, unit: 'g' },
        { name: 'Fat', amount: Math.round(searchResult.fat * quantity * 10) / 10, unit: 'g' }
      ],
      micros: estimatedMicros.map(micro => ({
        ...micro,
        amount: Math.round(micro.amount * quantity * 10) / 10
      }))
    },
    fatSecretId: searchResult.id
  };
}

/**
 * Get estimated micro-nutrients based on food name
 * This provides reasonable estimates when detailed data isn't available
 */
function getEstimatedMicros(foodName) {
  const name = foodName.toLowerCase();
  const micros = [];
  
  // Base estimates for most foods
  micros.push(
    { name: 'Sodium', amount: 100, unit: 'mg' },
    { name: 'Fiber', amount: 2, unit: 'g' },
    { name: 'Sugar', amount: 5, unit: 'g' },
    { name: 'Potassium', amount: 200, unit: 'mg' },
    { name: 'Calcium', amount: 50, unit: 'mg' },
    { name: 'Iron', amount: 1, unit: 'mg' }
  );
  
  // Adjust based on food type
  if (name.includes('fruit') || name.includes('apple') || name.includes('banana') || name.includes('orange')) {
    micros.push(
      { name: 'Vitamin C', amount: 30, unit: 'mg' },
      { name: 'Vitamin A', amount: 100, unit: 'mcg' }
    );
  }
  
  if (name.includes('vegetable') || name.includes('carrot') || name.includes('spinach') || name.includes('broccoli')) {
    micros.push(
      { name: 'Vitamin A', amount: 500, unit: 'mcg' },
      { name: 'Vitamin C', amount: 20, unit: 'mg' },
      { name: 'Iron', amount: 2, unit: 'mg' }
    );
  }
  
  if (name.includes('dairy') || name.includes('milk') || name.includes('cheese') || name.includes('yogurt')) {
    micros.push(
      { name: 'Calcium', amount: 300, unit: 'mg' },
      { name: 'Vitamin D', amount: 2, unit: 'mcg' }
    );
  }
  
  if (name.includes('meat') || name.includes('chicken') || name.includes('beef') || name.includes('pork')) {
    micros.push(
      { name: 'Iron', amount: 3, unit: 'mg' },
      { name: 'Zinc', amount: 5, unit: 'mg' },
      { name: 'Cholesterol', amount: 70, unit: 'mg' }
    );
  }
  
  if (name.includes('fish') || name.includes('salmon') || name.includes('tuna')) {
    micros.push(
      { name: 'Vitamin D', amount: 10, unit: 'mcg' },
      { name: 'Iron', amount: 2, unit: 'mg' },
      { name: 'Zinc', amount: 3, unit: 'mg' }
    );
  }
  
  if (name.includes('bean') || name.includes('lentil') || name.includes('legume')) {
    micros.push(
      { name: 'Fiber', amount: 8, unit: 'g' },
      { name: 'Iron', amount: 3, unit: 'mg' },
      { name: 'Magnesium', amount: 80, unit: 'mg' }
    );
  }
  
  if (name.includes('nut') || name.includes('almond') || name.includes('walnut')) {
    micros.push(
      { name: 'Magnesium', amount: 150, unit: 'mg' },
      { name: 'Zinc', amount: 2, unit: 'mg' }
    );
  }
  
  return micros;
}

module.exports = {
  getAccessToken,
  searchFoods,
  getFoodById,
  toFoodLogFormat,
  toQuickFoodFormat,
  parseNutritionDescription
};
