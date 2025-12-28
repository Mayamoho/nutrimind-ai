/**
 * USDA FoodData Central Service
 * Uses USDA FoodData Central (FDC) API to search foods and fetch nutrient data
 * API docs: https://fdc.nal.usda.gov/api-guide.html
 */

const fetch = global.fetch || require('node-fetch');
const USDA_API_KEY = process.env.USDA_API_KEY || '';

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`USDA API error ${res.status}: ${text}`);
  }
  return res.json();
}

function extractNutrients(nutrients = []) {
  const out = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const n of nutrients) {
    const name = (n.nutrientName || n.name || '').toLowerCase();
    const value = Number(n.value || n.amount || 0);
    if (/energy|calories|energy kcal/.test(name)) {
      out.calories = Math.round(value);
    } else if (/(protein)/.test(name)) {
      out.protein = Math.round(value * 10) / 10;
    } else if (/(carbohydrate|carbs)/.test(name)) {
      out.carbs = Math.round(value * 10) / 10;
    } else if (/(total lipid|fat)/.test(name)) {
      out.fat = Math.round(value * 10) / 10;
    }
  }
  return out;
}

/**
 * Search USDA FDC for foods
 * Returns normalized objects: { name, fdcId, calories, protein, carbs, fat, servingSize, source }
 */
async function searchFood(query, limit = 15) {
  if (!query || !query.trim()) return [];
  if (!USDA_API_KEY) {
    console.warn('USDA_API_KEY not set; skipping USDA search');
    return [];
  }

  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}`;
  const body = JSON.stringify({ query, pageSize: limit });

  try {
    const data = await fetchJson(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    if (!data || !Array.isArray(data.foods)) return [];

    return data.foods.map(f => {
      const nutrients = (f.foodNutrients || []).map(n => ({ nutrientName: n.nutrientName || n.name, value: n.value || n.amount }));
      const n = extractNutrients(nutrients);
      return {
        name: f.description || f.lowercaseDescription || f.description,
        brand: f.brandOwner || '',
        fdcId: f.fdcId,
        calories: n.calories,
        protein: n.protein,
        carbs: n.carbs,
        fat: n.fat,
        servingSize: f.servingSize || 100,
        servingUnit: f.servingSizeUnit || 'g',
        source: 'USDA'
      };
    });
  } catch (err) {
    console.error('USDA search error:', err.message || err);
    return [];
  }
}

async function getFoodByFdcId(fdcId) {
  if (!fdcId) return null;
  if (!USDA_API_KEY) return null;
  const url = `https://api.nal.usda.gov/fdc/v1/food/${encodeURIComponent(fdcId)}?api_key=${USDA_API_KEY}`;
  try {
    const data = await fetchJson(url);
    const nutrients = (data.foodNutrients || []).map(n => ({ nutrientName: n.nutrientName || n.name, value: n.value || n.amount }));
    const n = extractNutrients(nutrients);
    return {
      name: data.description || data.lowercaseDescription || data.description,
      fdcId: data.fdcId,
      calories: n.calories,
      protein: n.protein,
      carbs: n.carbs,
      fat: n.fat,
      servingSize: data.servingSize || 100,
      servingUnit: data.servingSizeUnit || 'g',
      source: 'USDA'
    };
  } catch (err) {
    console.error('USDA getFood error:', err.message || err);
    return null;
  }
}

module.exports = { searchFood, getFoodByFdcId };