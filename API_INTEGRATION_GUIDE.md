# Food & Exercise API Integration Guide

## Overview
This guide provides step-by-step instructions to integrate production-grade free APIs for food and exercise search, replacing the local databases.

---

## APIs to Integrate

### 1. Edamam Food Database API
- **Purpose**: Food search and nutrition data
- **Free Tier**: 10 calls/minute, 10,000 calls/month
- **Signup**: https://developer.edamam.com/food-database-api
- **Documentation**: https://developer.edamam.com/food-database-api-docs

### 2. USDA FoodData Central API
- **Purpose**: Official USDA nutrition database
- **Free Tier**: Unlimited (with API key)
- **Signup**: https://fdc.nal.usda.gov/api-key-signup.html
- **Documentation**: https://fdc.nal.usda.gov/api-guide.html

### 3. ExerciseDB API (RapidAPI)
- **Purpose**: Exercise database with 1300+ exercises
- **Free Tier**: 100 requests/day
- **Signup**: https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
- **Documentation**: Available on RapidAPI

---

## Implementation Steps

### Step 1: Get API Keys

1. **Edamam**:
   ```
   - Visit: https://developer.edamam.com/food-database-api
   - Sign up for free account
   - Get: APP_ID and APP_KEY
   ```

2. **USDA FoodData Central**:
   ```
   - Visit: https://fdc.nal.usda.gov/api-key-signup.html
   - Sign up with email
   - Get: API_KEY
   ```

3. **ExerciseDB (RapidAPI)**:
   ```
   - Visit: https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
   - Sign up for RapidAPI account
   - Subscribe to free tier
   - Get: X-RapidAPI-Key
   ```

### Step 2: Add API Keys to Environment

Add to `backend/.env`:
```env
# Food APIs
EDAMAM_APP_ID=your_app_id_here
EDAMAM_APP_KEY=your_app_key_here
USDA_API_KEY=your_usda_key_here

# Exercise API
RAPIDAPI_KEY=your_rapidapi_key_here
```

### Step 3: Create API Adapter Services

#### A. Create `backend/services/edamamService.js`:
```javascript
const https = require('https');

const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;
const BASE_URL = 'api.edamam.com';

function httpsRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function searchFood(query) {
  const path = `/api/food-database/v2/parser?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&ingr=${encodeURIComponent(query)}`;
  
  const options = {
    hostname: BASE_URL,
    path: path,
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  };
  
  try {
    const data = await httpsRequest(options);
    
    if (!data.hints) return [];
    
    return data.hints.slice(0, 20).map(item => {
      const food = item.food;
      const nutrients = food.nutrients || {};
      
      return {
        name: food.label,
        servingQuantity: 1,
        servingUnit: food.measures?.[0]?.label || 'serving',
        calories: Math.round(nutrients.ENERC_KCAL || 0),
        nutrients: {
          macros: [
            { name: 'Protein', amount: Math.round(nutrients.PROCNT || 0), unit: 'g' },
            { name: 'Carbs', amount: Math.round(nutrients.CHOCDF || 0), unit: 'g' },
            { name: 'Fat', amount: Math.round(nutrients.FAT || 0), unit: 'g' }
          ],
          micros: [
            { name: 'Fiber', amount: Math.round(nutrients.FIBTG || 0), unit: 'g' },
            { name: 'Sugar', amount: Math.round(nutrients.SUGAR || 0), unit: 'g' },
            { name: 'Sodium', amount: Math.round(nutrients.NA || 0), unit: 'mg' }
          ]
        }
      };
    });
  } catch (error) {
    console.error('Edamam API error:', error);
    return [];
  }
}

module.exports = { searchFood };
```

#### B. Create `backend/services/usdaService.js`:
```javascript
const https = require('https');

const USDA_API_KEY = process.env.USDA_API_KEY;
const BASE_URL = 'api.nal.usda.gov';

function httpsRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function searchFood(query) {
  const path = `/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=20`;
  
  const options = {
    hostname: BASE_URL,
    path: path,
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  };
  
  try {
    const data = await httpsRequest(options);
    
    if (!data.foods) return [];
    
    return data.foods.map(food => {
      const nutrients = {};
      food.foodNutrients?.forEach(n => {
        nutrients[n.nutrientName] = n.value;
      });
      
      return {
        name: food.description,
        servingQuantity: 100,
        servingUnit: 'g',
        calories: Math.round(nutrients['Energy'] || 0),
        nutrients: {
          macros: [
            { name: 'Protein', amount: Math.round(nutrients['Protein'] || 0), unit: 'g' },
            { name: 'Carbs', amount: Math.round(nutrients['Carbohydrate, by difference'] || 0), unit: 'g' },
            { name: 'Fat', amount: Math.round(nutrients['Total lipid (fat)'] || 0), unit: 'g' }
          ],
          micros: [
            { name: 'Fiber', amount: Math.round(nutrients['Fiber, total dietary'] || 0), unit: 'g' },
            { name: 'Sugar', amount: Math.round(nutrients['Sugars, total including NLEA'] || 0), unit: 'g' },
            { name: 'Sodium', amount: Math.round(nutrients['Sodium, Na'] || 0), unit: 'mg' }
          ]
        }
      };
    });
  } catch (error) {
    console.error('USDA API error:', error);
    return [];
  }
}

module.exports = { searchFood };
```

#### C. Create `backend/services/exerciseDBService.js`:
```javascript
const https = require('https');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const BASE_URL = 'exercisedb.p.rapidapi.com';

function httpsRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function searchExercise(query) {
  const path = `/exercises/name/${encodeURIComponent(query)}`;
  
  const options = {
    hostname: BASE_URL,
    path: path,
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': BASE_URL
    }
  };
  
  try {
    const data = await httpsRequest(options);
    
    if (!Array.isArray(data)) return [];
    
    return data.slice(0, 20).map(exercise => {
      // Estimate calories based on exercise type
      let caloriesPerMin = 5; // default
      if (exercise.target === 'cardiovascular') caloriesPerMin = 8;
      if (exercise.equipment === 'body weight') caloriesPerMin = 6;
      
      return {
        name: exercise.name,
        caloriesBurned: caloriesPerMin * 30, // 30 min default
        duration: 30,
        bodyPart: exercise.bodyPart,
        equipment: exercise.equipment,
        target: exercise.target
      };
    });
  } catch (error) {
    console.error('ExerciseDB API error:', error);
    return [];
  }
}

module.exports = { searchExercise };
```

### Step 4: Update Search Routes

Update `backend/routes/data.js`:

```javascript
// Add at top
const edamamService = require('../services/edamamService');
const usdaService = require('../services/usdaService');
const exerciseDBService = require('../services/exerciseDBService');

// Update food search route
router.get('/search/foods', auth, async (req, res) => {
  const { q } = req.query;
  try {
    // Try Edamam first
    let results = await edamamService.searchFood(q);
    
    // If no results, try USDA
    if (results.length === 0) {
      results = await usdaService.searchFood(q);
    }
    
    // If still no results, fall back to local DB
    if (results.length === 0) {
      const dbResults = await db.query(
        `SELECT name, serving_size AS "servingUnit", calories, protein, carbohydrates, fat, sodium, sugar, fiber 
         FROM food_database 
         WHERE name ILIKE $1 LIMIT 10`,
        [`%${q}%`]
      );
      results = dbResults.rows.map(item => ({
        name: item.name,
        servingQuantity: 1,
        servingUnit: item.servingUnit,
        calories: item.calories,
        nutrients: {
          macros: [
            { name: 'Protein', amount: item.protein, unit: 'g' },
            { name: 'Carbs', amount: item.carbohydrates, unit: 'g' },
            { name: 'Fat', amount: item.fat, unit: 'g' }
          ],
          micros: [
            { name: 'Sodium', amount: item.sodium, unit: 'mg' },
            { name: 'Sugar', amount: item.sugar, unit: 'g' },
            { name: 'Fiber', amount: item.fiber, unit: 'g' }
          ]
        }
      }));
    }
    
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update exercise search route
router.get('/search/exercises', auth, async (req, res) => {
  const { q } = req.query;
  try {
    // Try ExerciseDB first
    let results = await exerciseDBService.searchExercise(q);
    
    // If no results, fall back to local DB
    if (results.length === 0) {
      const dbResults = await db.query(
        `SELECT name, calories_burned_per_30_min AS "caloriesBurned" 
         FROM exercise_database 
         WHERE name ILIKE $1 LIMIT 10`,
        [`%${q}%`]
      );
      results = dbResults.rows.map(item => ({
        name: item.name,
        caloriesBurned: item.caloriesBurned,
        duration: 30
      }));
    }
    
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
```

### Step 5: Add Caching (Optional but Recommended)

Create `backend/services/cacheService.js`:
```javascript
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour

function set(key, value) {
  cache.set(key, {
    value,
    timestamp: Date.now()
  });
}

function get(key) {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
}

module.exports = { set, get };
```

Then wrap API calls with caching:
```javascript
const cache = require('../services/cacheService');

async function searchFood(query) {
  const cacheKey = `food:${query}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  
  const results = await edamamService.searchFood(query);
  cache.set(cacheKey, results);
  return results;
}
```

---

## Testing

### Test Food Search:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/data/search/foods?q=chicken"
```

### Test Exercise Search:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/data/search/exercises?q=running"
```

---

## Benefits

1. **Comprehensive Data**: Access to millions of foods and exercises
2. **Always Updated**: APIs are maintained by official sources
3. **Better UX**: More accurate nutrition information
4. **Fallback**: Local DB still works if APIs fail
5. **Free Tier**: All APIs have generous free tiers

---

## Rate Limiting Considerations

- **Edamam**: 10 calls/min - Use caching
- **USDA**: Unlimited - No concerns
- **ExerciseDB**: 100 calls/day - Use caching heavily

Implement caching to stay within limits!

---

## Monitoring

Add logging to track API usage:
```javascript
console.log(`[API] Edamam search: ${query} - ${results.length} results`);
```

Monitor logs to ensure you're within rate limits.
