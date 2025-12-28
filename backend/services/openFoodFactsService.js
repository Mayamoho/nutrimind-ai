/**
 * Open Food Facts API Service
 * 100% FREE - No API key required
 * https://world.openfoodfacts.org/
 */

// Configuration
const CONFIG = {
  timeout: 10000, // 10 seconds
  maxRetries: 2,
  baseDelay: 1000, // 1 second initial delay
  maxDelay: 5000,  // 5 seconds max delay
  userAgent: 'NutriMind/1.0 (https://github.com/yourusername/nutrimind)'
};

/**
 * Fetch with retry and timeout handling
 */
async function fetchWithTimeout(url, options = {}) {
  const {
    timeout = CONFIG.timeout,
    maxRetries = CONFIG.maxRetries,
    baseDelay = CONFIG.baseDelay,
    ...fetchOptions
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'User-Agent': CONFIG.userAgent,
          ...(fetchOptions.headers || {})
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // If rate limited, respect the retry-after header
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
          await new Promise(r => setTimeout(r, retryAfter * 1000));
          continue;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      try { 
        return JSON.parse(text);
      } catch (e) { 
        console.warn('Failed to parse JSON response from OpenFoodFacts');
        return { products: [] };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      
      // Don't retry on client errors (4xx) except 429
      if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
        throw error;
      }
      
      // Exponential backoff with jitter
      if (attempt < maxRetries) {
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          CONFIG.maxDelay
        );
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  throw lastError || new Error(`Failed after ${maxRetries + 1} attempts`);
}

const COUNTRY_CODES = {
  'India': 'in', 'Bangladesh': 'world', 'Pakistan': 'world',
  'United States of America': 'us', 'United Kingdom': 'uk',
  'Canada': 'ca', 'Australia': 'au', 'Germany': 'de', 'France': 'fr'
};

async function searchFood(query, country = 'world', limit = 15) {
  try {
    const cc = COUNTRY_CODES[country] || 'world';
    const url = `https://${cc}.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}`;
    const data = await fetchWithTimeout(url, { timeout: CONFIG.timeout, maxRetries: CONFIG.maxRetries });

    return (data.products || []).map(p => ({
      name: p.product_name || 'Unknown',
      brand: p.brands || '',
      servingQuantity: 100,
      servingUnit: 'g',
      calories: Math.round(p.nutriments?.['energy-kcal_100g'] || 0),
      source: 'OpenFoodFacts',
      nutrients: {
        macros: [
          { name: 'Protein', amount: Math.round(p.nutriments?.proteins_100g || 0), unit: 'g' },
          { name: 'Carbs', amount: Math.round(p.nutriments?.carbohydrates_100g || 0), unit: 'g' },
          { name: 'Fat', amount: Math.round(p.nutriments?.fat_100g || 0), unit: 'g' }
        ],
        micros: [
          { name: 'Fiber', amount: Math.round(p.nutriments?.fiber_100g || 0), unit: 'g' },
          { name: 'Sugar', amount: Math.round(p.nutriments?.sugars_100g || 0), unit: 'g' },
          { name: 'Sodium', amount: Math.round((p.nutriments?.sodium_100g || 0) * 1000), unit: 'mg' }
        ]
      }
    })).filter(f => f.name !== 'Unknown' && f.calories > 0);
  } catch (err) {
    // Treat aborts/timeouts as expected transient conditions; warn rather than error to reduce noise
    const msg = err && (err.message || String(err));
    if (err && (err.name === 'AbortError' || /abort|aborted|timeout/i.test(msg))) {
      // Silent timeout/abort for OpenFoodFacts to avoid noisy logs
      return [];
    }
    console.error('OpenFoodFacts error:', msg);
    return [];
  }
}

async function getFoodByBarcode(barcode) {
  try {
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    const data = await fetchWithTimeout(url, { timeout: CONFIG.timeout, maxRetries: CONFIG.maxRetries });
    if (!data || data.status !== 1) return null;

    const p = data.product;
    return {
      name: p.product_name || 'Unknown',
      brand: p.brands || '',
      servingQuantity: 100,
      servingUnit: 'g',
      calories: Math.round(p.nutriments?.['energy-kcal_100g'] || 0),
      source: 'OpenFoodFacts',
      nutrients: {
        macros: [
          { name: 'Protein', amount: Math.round(p.nutriments?.proteins_100g || 0), unit: 'g' },
          { name: 'Carbs', amount: Math.round(p.nutriments?.carbohydrates_100g || 0), unit: 'g' },
          { name: 'Fat', amount: Math.round(p.nutriments?.fat_100g || 0), unit: 'g' }
        ]
      }
    };
  } catch (err) {
    const msg = err && (err.message || String(err));
    if (err && (err.name === 'AbortError' || /abort|aborted|timeout/i.test(msg))) {
      // Silent timeout/abort for barcode lookup
      return null;
    }
    console.error('OpenFoodFacts barcode error:', msg);
    return null;
  }
}

module.exports = { searchFood, getFoodByBarcode };
