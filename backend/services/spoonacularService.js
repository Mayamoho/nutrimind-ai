/**
 * Spoonacular Food API Service
 * FREE: 150 calls/day (no credit card required)
 * Features: Cuisine-based recipes, ingredients, NLP, image recognition
 * 
 * Supported Spoonacular Cuisines:
 * African, Asian, American, British, Cajun, Caribbean, Chinese, 
 * Eastern European, European, French, German, Greek, Indian, Irish, 
 * Italian, Japanese, Jewish, Korean, Latin American, Mediterranean, 
 * Mexican, Middle Eastern, Nordic, Southern, Spanish, Thai, Vietnamese
 */

const https = require('https');

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE_URL = 'api.spoonacular.com';

// Comprehensive mapping of ALL countries to Spoonacular cuisines
const COUNTRY_TO_CUISINE = {
  // South Asia
  'Afghanistan': 'Middle Eastern',
  'Bangladesh': 'Asian',  // Bengali cuisine - distinct from Indian
  'Bhutan': 'Asian',
  'India': 'Indian',
  'Maldives': 'Asian',
  'Nepal': 'Asian',
  'Pakistan': 'Middle Eastern',
  'Sri Lanka': 'Asian',
  
  // Southeast Asia
  'Brunei': 'Asian',
  'Cambodia': 'Asian',
  'Indonesia': 'Asian',
  'Laos': 'Asian',
  'Malaysia': 'Asian',
  'Myanmar': 'Asian',
  'Philippines': 'Asian',
  'Singapore': 'Asian',
  'Thailand': 'Thai',
  'Timor-Leste': 'Asian',
  'Vietnam': 'Vietnamese',
  
  // East Asia
  'China': 'Chinese',
  'Japan': 'Japanese',
  'Mongolia': 'Asian',
  'North Korea': 'Korean',
  'South Korea': 'Korean',
  'Taiwan': 'Chinese',
  
  // Central Asia
  'Kazakhstan': 'Asian',
  'Kyrgyzstan': 'Asian',
  'Tajikistan': 'Asian',
  'Turkmenistan': 'Asian',
  'Uzbekistan': 'Asian',
  
  // Middle East
  'Bahrain': 'Middle Eastern',
  'Iran': 'Middle Eastern',
  'Iraq': 'Middle Eastern',
  'Israel': 'Middle Eastern',
  'Jordan': 'Middle Eastern',
  'Kuwait': 'Middle Eastern',
  'Lebanon': 'Middle Eastern',
  'Oman': 'Middle Eastern',
  'Palestine State': 'Middle Eastern',
  'Qatar': 'Middle Eastern',
  'Saudi Arabia': 'Middle Eastern',
  'Syria': 'Middle Eastern',
  'Turkey': 'Middle Eastern',
  'United Arab Emirates': 'Middle Eastern',
  'Yemen': 'Middle Eastern',
  
  // Europe - Western
  'Austria': 'German',
  'Belgium': 'European',
  'France': 'French',
  'Germany': 'German',
  'Liechtenstein': 'German',
  'Luxembourg': 'European',
  'Monaco': 'French',
  'Netherlands': 'European',
  'Switzerland': 'German',
  
  // Europe - Northern
  'Denmark': 'Nordic',
  'Finland': 'Nordic',
  'Iceland': 'Nordic',
  'Norway': 'Nordic',
  'Sweden': 'Nordic',
  
  // Europe - British Isles
  'Ireland': 'Irish',
  'United Kingdom': 'British',
  
  // Europe - Southern
  'Andorra': 'Spanish',
  'Cyprus': 'Greek',
  'Greece': 'Greek',
  'Italy': 'Italian',
  'Malta': 'Mediterranean',
  'Portugal': 'Mediterranean',
  'San Marino': 'Italian',
  'Spain': 'Spanish',
  'Vatican City': 'Italian',
  
  // Europe - Eastern
  'Albania': 'Eastern European',
  'Belarus': 'Eastern European',
  'Bosnia and Herzegovina': 'Eastern European',
  'Bulgaria': 'Eastern European',
  'Croatia': 'Eastern European',
  'Czechia': 'Eastern European',
  'Estonia': 'Eastern European',
  'Georgia': 'Eastern European',
  'Hungary': 'Eastern European',
  'Kosovo': 'Eastern European',
  'Latvia': 'Eastern European',
  'Lithuania': 'Eastern European',
  'Moldova': 'Eastern European',
  'Montenegro': 'Eastern European',
  'North Macedonia': 'Eastern European',
  'Poland': 'Eastern European',
  'Romania': 'Eastern European',
  'Russia': 'Eastern European',
  'Serbia': 'Eastern European',
  'Slovakia': 'Eastern European',
  'Slovenia': 'Eastern European',
  'Ukraine': 'Eastern European',
  'Armenia': 'Eastern European',
  'Azerbaijan': 'Eastern European',
  
  // North America
  'Canada': 'American',
  'United States of America': 'American',
  'USA': 'American',
  'United States': 'American',
  
  // Central America & Caribbean
  'Antigua and Barbuda': 'Caribbean',
  'Bahamas': 'Caribbean',
  'Barbados': 'Caribbean',
  'Belize': 'Caribbean',
  'Costa Rica': 'Latin American',
  'Cuba': 'Caribbean',
  'Dominica': 'Caribbean',
  'Dominican Republic': 'Caribbean',
  'El Salvador': 'Latin American',
  'Grenada': 'Caribbean',
  'Guatemala': 'Latin American',
  'Haiti': 'Caribbean',
  'Honduras': 'Latin American',
  'Jamaica': 'Caribbean',
  'Mexico': 'Mexican',
  'Nicaragua': 'Latin American',
  'Panama': 'Latin American',
  'Saint Kitts and Nevis': 'Caribbean',
  'Saint Lucia': 'Caribbean',
  'Saint Vincent and the Grenadines': 'Caribbean',
  'Trinidad and Tobago': 'Caribbean',
  
  // South America
  'Argentina': 'Latin American',
  'Bolivia': 'Latin American',
  'Brazil': 'Latin American',
  'Chile': 'Latin American',
  'Colombia': 'Latin American',
  'Ecuador': 'Latin American',
  'Guyana': 'Caribbean',
  'Paraguay': 'Latin American',
  'Peru': 'Latin American',
  'Suriname': 'Caribbean',
  'Uruguay': 'Latin American',
  'Venezuela': 'Latin American',
  
  // Africa - North
  'Algeria': 'African',
  'Egypt': 'Middle Eastern',
  'Libya': 'African',
  'Morocco': 'African',
  'Sudan': 'African',
  'Tunisia': 'African',
  
  // Africa - West
  'Benin': 'African',
  'Burkina Faso': 'African',
  'Cabo Verde': 'African',
  'Cameroon': 'African',
  "Cote d'Ivoire": 'African',
  'Gambia': 'African',
  'Ghana': 'African',
  'Guinea': 'African',
  'Guinea-Bissau': 'African',
  'Liberia': 'African',
  'Mali': 'African',
  'Mauritania': 'African',
  'Niger': 'African',
  'Nigeria': 'African',
  'Senegal': 'African',
  'Sierra Leone': 'African',
  'Togo': 'African',
  
  // Africa - East
  'Burundi': 'African',
  'Comoros': 'African',
  'Djibouti': 'African',
  'Eritrea': 'African',
  'Ethiopia': 'African',
  'Kenya': 'African',
  'Madagascar': 'African',
  'Malawi': 'African',
  'Mauritius': 'African',
  'Mozambique': 'African',
  'Rwanda': 'African',
  'Seychelles': 'African',
  'Somalia': 'African',
  'South Sudan': 'African',
  'Tanzania': 'African',
  'Uganda': 'African',
  
  // Africa - Central
  'Central African Republic': 'African',
  'Chad': 'African',
  'Congo, Democratic Republic of the': 'African',
  'Congo, Republic of the': 'African',
  'Equatorial Guinea': 'African',
  'Gabon': 'African',
  'Sao Tome and Principe': 'African',
  
  // Africa - Southern
  'Angola': 'African',
  'Botswana': 'African',
  'Eswatini': 'African',
  'Lesotho': 'African',
  'Namibia': 'African',
  'South Africa': 'African',
  'Zambia': 'African',
  'Zimbabwe': 'African',
  
  // Oceania
  'Australia': 'American',
  'Fiji': 'Asian',
  'Kiribati': 'Asian',
  'Marshall Islands': 'Asian',
  'Micronesia': 'Asian',
  'Nauru': 'Asian',
  'New Zealand': 'American',
  'Palau': 'Asian',
  'Papua New Guinea': 'Asian',
  'Samoa': 'Asian',
  'Solomon Islands': 'Asian',
  'Tonga': 'Asian',
  'Tuvalu': 'Asian',
  'Vanuatu': 'Asian',
};

// Country-specific search terms to get more relevant results
const COUNTRY_FOOD_KEYWORDS = {
  'Bangladesh': ['bengali', 'bangladeshi', 'hilsa', 'biryani', 'korma', 'bhuna'],
  'Pakistan': ['pakistani', 'biryani', 'nihari', 'haleem', 'seekh kebab'],
  'Nepal': ['nepali', 'momos', 'dal bhat', 'thukpa'],
  'Sri Lanka': ['sri lankan', 'ceylon', 'hoppers', 'kottu'],
  'Indonesia': ['indonesian', 'nasi goreng', 'satay', 'rendang'],
  'Malaysia': ['malaysian', 'nasi lemak', 'laksa', 'satay'],
  'Philippines': ['filipino', 'adobo', 'sinigang', 'lumpia'],
  'Vietnam': ['vietnamese', 'pho', 'banh mi', 'spring rolls'],
  'Thailand': ['thai', 'pad thai', 'curry', 'tom yum'],
  'Japan': ['japanese', 'sushi', 'ramen', 'teriyaki'],
  'Korea': ['korean', 'bibimbap', 'kimchi', 'bulgogi'],
  'China': ['chinese', 'stir fry', 'dim sum', 'noodles'],
  'India': ['indian', 'curry', 'tandoori', 'masala', 'biryani'],
  'Mexico': ['mexican', 'tacos', 'enchiladas', 'burrito'],
  'Italy': ['italian', 'pasta', 'pizza', 'risotto'],
  'France': ['french', 'croissant', 'quiche', 'crepe'],
  'Germany': ['german', 'schnitzel', 'bratwurst', 'pretzel'],
  'Greece': ['greek', 'gyros', 'souvlaki', 'moussaka'],
  'Turkey': ['turkish', 'kebab', 'doner', 'baklava'],
  'Lebanon': ['lebanese', 'hummus', 'falafel', 'shawarma'],
  'Morocco': ['moroccan', 'tagine', 'couscous', 'harira'],
  'Ethiopia': ['ethiopian', 'injera', 'doro wat', 'kitfo'],
  'Nigeria': ['nigerian', 'jollof', 'egusi', 'suya'],
  'Brazil': ['brazilian', 'feijoada', 'churrasco', 'acai'],
  'Argentina': ['argentinian', 'asado', 'empanadas', 'chimichurri'],
  'Peru': ['peruvian', 'ceviche', 'lomo saltado', 'causa'],
  'Jamaica': ['jamaican', 'jerk', 'ackee', 'patty'],
  'Cuba': ['cuban', 'ropa vieja', 'mojo', 'picadillo'],
};

function httpsRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch { resolve({ results: [] }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (postData) req.write(postData);
    req.end();
  });
}

/**
 * Search recipes by cuisine for meal planning
 */
async function searchRecipesByCuisine(cuisine, mealType, targetCalories, count = 12) {
  if (!SPOONACULAR_API_KEY) return [];

  const type = mealType === 'snacks' ? 'snack' : mealType === 'breakfast' ? 'breakfast' : 'main course';
  const minCal = Math.max(50, targetCalories - 200);
  const maxCal = targetCalories + 200;

  const path = `/recipes/complexSearch?apiKey=${SPOONACULAR_API_KEY}&cuisine=${encodeURIComponent(cuisine)}&type=${encodeURIComponent(type)}&minCalories=${minCal}&maxCalories=${maxCal}&number=${count}&addRecipeNutrition=true&fillIngredients=true`;

  try {
    const data = await httpsRequest({ hostname: BASE_URL, path, method: 'GET', headers: { 'User-Agent': 'NutriMind/1.0' } });
    
    return (data.results || []).map(r => ({
      name: r.title,
      calories: Math.round(r.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || targetCalories),
      protein: Math.round(r.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 0),
      carbs: Math.round(r.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0),
      fat: Math.round(r.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 0),
      description: r.summary?.replace(/<[^>]*>/g, '').slice(0, 100) || 'Delicious meal',
      ingredients: (r.extendedIngredients || []).slice(0, 5).map(i => i.name),
      readyInMinutes: r.readyInMinutes,
      servings: r.servings,
      image: r.image,
      source: 'Spoonacular'
    }));
  } catch (err) {
    console.error('Spoonacular recipe search error:', err.message);
    return [];
  }
}

/**
 * Search recipes with country-specific keywords for better results
 */
async function searchRecipesForCountry(country, mealType, targetCalories, count = 12) {
  if (!SPOONACULAR_API_KEY) return [];

  const cuisine = getCuisineForCountry(country);
  const keywords = COUNTRY_FOOD_KEYWORDS[country];
  
  // First try cuisine-based search
  let results = await searchRecipesByCuisine(cuisine, mealType, targetCalories, count);
  
  // If we have country-specific keywords and not enough results, search with keywords
  if (keywords && results.length < 5) {
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];
    const type = mealType === 'snacks' ? 'snack' : mealType === 'breakfast' ? 'breakfast' : 'main course';
    const path = `/recipes/complexSearch?apiKey=${SPOONACULAR_API_KEY}&query=${encodeURIComponent(keyword)}&type=${encodeURIComponent(type)}&number=${count}&addRecipeNutrition=true`;
    
    try {
      const data = await httpsRequest({ hostname: BASE_URL, path, method: 'GET', headers: { 'User-Agent': 'NutriMind/1.0' } });
      const keywordResults = (data.results || []).map(r => ({
        name: r.title,
        calories: Math.round(r.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || targetCalories),
        protein: Math.round(r.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 0),
        carbs: Math.round(r.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0),
        fat: Math.round(r.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 0),
        description: r.summary?.replace(/<[^>]*>/g, '').slice(0, 100) || 'Delicious meal',
        ingredients: (r.extendedIngredients || []).slice(0, 5).map(i => i.name),
        source: 'Spoonacular'
      }));
      results = [...results, ...keywordResults];
    } catch (err) {
      console.error('Keyword search error:', err.message);
    }
  }
  
  // Deduplicate by name
  const seen = new Set();
  return results.filter(r => {
    const key = r.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, count);
}

/**
 * Get random recipes by cuisine (uses less API quota)
 */
async function getRandomRecipes(cuisine, count = 10) {
  if (!SPOONACULAR_API_KEY) return [];

  const tags = cuisine.toLowerCase().replace(' ', '-');
  const path = `/recipes/random?apiKey=${SPOONACULAR_API_KEY}&number=${count}&tags=${tags}&includeNutrition=true`;

  try {
    const data = await httpsRequest({ hostname: BASE_URL, path, method: 'GET', headers: { 'User-Agent': 'NutriMind/1.0' } });
    
    return (data.recipes || []).map(r => ({
      name: r.title,
      calories: Math.round(r.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 300),
      protein: Math.round(r.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 15),
      carbs: Math.round(r.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 30),
      fat: Math.round(r.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 10),
      description: r.summary?.replace(/<[^>]*>/g, '').slice(0, 100) || 'Tasty dish',
      ingredients: (r.extendedIngredients || []).slice(0, 5).map(i => i.name),
      readyInMinutes: r.readyInMinutes,
      source: 'Spoonacular'
    }));
  } catch (err) {
    console.error('Spoonacular random recipes error:', err.message);
    return [];
  }
}

/**
 * Search ingredients
 */
async function searchFood(query) {
  if (!SPOONACULAR_API_KEY) return [];

  const path = `/food/ingredients/search?apiKey=${SPOONACULAR_API_KEY}&query=${encodeURIComponent(query)}&number=15&metaInformation=true`;

  try {
    const data = await httpsRequest({ hostname: BASE_URL, path, method: 'GET', headers: { 'User-Agent': 'NutriMind/1.0' } });
    
    const results = await Promise.all(
      (data.results || []).slice(0, 8).map(item => getIngredientNutrition(item.id, item.name))
    );
    return results.filter(Boolean);
  } catch (err) {
    console.error('Spoonacular search error:', err.message);
    return [];
  }
}

async function getIngredientNutrition(ingredientId, ingredientName) {
  const path = `/food/ingredients/${ingredientId}/information?apiKey=${SPOONACULAR_API_KEY}&amount=100&unit=grams`;

  try {
    const data = await httpsRequest({ hostname: BASE_URL, path, method: 'GET', headers: { 'User-Agent': 'NutriMind/1.0' } });
    if (!data.nutrition?.nutrients) return null;

    const nutrients = {};
    data.nutrition.nutrients.forEach(n => nutrients[n.name] = n.amount);

    return {
      name: data.name || ingredientName,
      servingQuantity: 100,
      servingUnit: 'g',
      calories: Math.round(nutrients['Calories'] || 0),
      source: 'Spoonacular',
      nutrients: {
        macros: [
          { name: 'Protein', amount: Math.round(nutrients['Protein'] || 0), unit: 'g' },
          { name: 'Carbs', amount: Math.round(nutrients['Carbohydrates'] || 0), unit: 'g' },
          { name: 'Fat', amount: Math.round(nutrients['Fat'] || 0), unit: 'g' }
        ]
      }
    };
  } catch { return null; }
}

async function analyzeImageByUrl(imageUrl) {
  if (!SPOONACULAR_API_KEY) return null;
  const postData = JSON.stringify({ imageUrl });
  try {
    const data = await httpsRequest({
      hostname: BASE_URL,
      path: `/food/images/analyze?apiKey=${SPOONACULAR_API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, postData);
    return { category: data.category, nutrition: data.nutrition, recipes: data.recipes || [] };
  } catch { return null; }
}

async function parseNaturalLanguage(text) {
  if (!SPOONACULAR_API_KEY) return [];
  const postData = `ingredientList=${encodeURIComponent(text)}&servings=1`;
  try {
    return await httpsRequest({
      hostname: BASE_URL,
      path: `/recipes/parseIngredients?apiKey=${SPOONACULAR_API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) }
    }, postData);
  } catch { return []; }
}

function getCuisineForCountry(country) {
  return COUNTRY_TO_CUISINE[country] || 'American';
}

function getCountryKeywords(country) {
  return COUNTRY_FOOD_KEYWORDS[country] || null;
}

module.exports = { 
  searchFood,
  searchRecipesByCuisine,
  searchRecipesForCountry,
  getRandomRecipes,
  analyzeImageByUrl,
  parseNaturalLanguage,
  getCuisineForCountry,
  getCountryKeywords,
  COUNTRY_TO_CUISINE,
  COUNTRY_FOOD_KEYWORDS
};
