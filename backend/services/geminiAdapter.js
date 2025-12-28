/**
 * Gemini Adapter
 * Lightweight helper to call Gemini models programmatically from backend services
 */

require('dotenv').config(); // Ensure environment variables are loaded
const { GoogleGenAI } = require('@google/genai');
const aiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

console.log('Gemini API Key found:', aiKey ? 'Yes' : 'No');
console.log('API Key length:', aiKey.length);

let client;
try {
  if (aiKey) {
    client = new GoogleGenAI(aiKey); // Fixed: Pass API key directly, not as object
    console.log('Gemini client initialized successfully');
  } else {
    console.warn('No Gemini API key found in environment variables');
  }
} catch (e) {
  console.warn('Gemini adapter init failed:', e.message || e);
}

function safeParseJson(text) {
  let clean = (text || '').trim();
  if (clean.startsWith('```json')) clean = clean.slice(7);
  if (clean.startsWith('```')) clean = clean.slice(3);
  if (clean.endsWith('```')) clean = clean.slice(0, -3);
  try { return JSON.parse(clean.trim()); } catch (e) { return null; }
}

// Run a promise with a timeout. Throws an Error with code 'TIMEOUT' and status 504 on timeout.
function runWithTimeout(promise, ms = Number(process.env.GEMINI_TIMEOUT_MS || 15000)) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error('Gemini request timed out');
        err.code = 'TIMEOUT';
        err.status = 504;
        reject(err);
      }, ms);
    })
  ]).finally(() => clearTimeout(timer));
}

async function analyzeFood(prompt, imageInlineData) {
  if (!client) throw new Error('Gemini not initialized');
  console.info('GeminiAdapter: analyzeFood called (model=gemini-2.5-flash)');
  const system = `You are a nutrition expert. Analyze the food input and identify items with nutrition data. Return a JSON array of items with these keys: 
  - foodName: string
  - servingQuantity: number
  - servingUnit: string (e.g., 'g', 'ml', 'cup', 'piece')
  - calories: number (in kcal)
  - protein: number (in grams)
  - carbohydrates: number (in grams)
  - fat: number (in grams)
  - fiber: number (in grams)
  - sugar: number (in grams)
  - sodium: number (in mg)
  - potassium: number (in mg)
  - cholesterol: number (in mg)
  - vitaminA: number (in mcg RAE)
  - vitaminC: number (in mg)
  - vitaminD: number (in mcg)
  - calcium: number (in mg)
  - iron: number (in mg)
  - magnesium: number (in mg)
  - zinc: number (in mg)
  
  For any nutrient you don't have data for, set it to 0.`;
  const contents = imageInlineData ? [{ text: `${system}\n\nUser input: ${prompt}` }, { inlineData: imageInlineData }] : `${system}\n\nUser input: ${prompt}`;

  const response = await runWithTimeout(client.models.generateContent({ model: 'gemini-2.5-flash', contents }));
  const text = response?.response?.text?.() || response?.text || '';
  const parsed = safeParseJson(text);
  if (Array.isArray(parsed)) return parsed;
  // If parsing fails, try to extract JSON-ish data
  try { return JSON.parse(text); } catch (e) { return null; }
}

async function analyzeExercise(prompt, userWeight, imageInlineData) {
  if (!client) throw new Error('Gemini not initialized');
  console.info('GeminiAdapter: analyzeExercise called (model=gemini-2.5-flash)');
  let system = `You are a fitness expert. Analyze the exercise description and estimate calories burned. Return JSON: { exerciseName, duration, caloriesBurned, intensity }`;
  const contents = imageInlineData ? [{ text: `${system}\n\nUser input: ${prompt}` }, { inlineData: imageInlineData }] : `${system}\n\nUser input: ${prompt}${userWeight ? `\nUser weight: ${userWeight}kg` : ''}`;
  
  const response = await runWithTimeout(client.models.generateContent({ model: 'gemini-2.5-flash', contents }));
  const text = response?.response?.text?.() || response?.text || '';
  console.log('Exercise analysis raw response:', text);
  
  // Use safeParseJson to handle ```json wrapper
  const parsed = safeParseJson(text);
  if (parsed) {
    console.log('Exercise parsed result:', parsed);
    return parsed;
  }
  
  // Fallback: try direct JSON parse
  try { 
    const directParsed = JSON.parse(text);
    console.log('Exercise direct parsed result:', directParsed);
    return directParsed;
  } catch (e) { 
    console.error('Failed to parse exercise JSON:', text);
    return null;
  }
}

async function generateSuggestion(prompt, model = 'gemini-2.5-flash') {
  if (!client) throw new Error('Gemini not initialized');
  console.info('GeminiAdapter: generateSuggestion called (model=' + model + ')');
  const systemPrompt = `You are an AI nutritionist and fitness coach. Provide personalized, culturally-aware advice in JSON format with keys: summary, foodRecommendations (array), mealPlan, exerciseTip, hydrationTip.`;
  const contents = `${systemPrompt}\n\n${prompt}`;
  
  const response = await runWithTimeout(client.models.generateContent({ model, contents }));
  const text = response?.response?.text?.() || response?.text || '';
  const parsed = safeParseJson(text);
  if (parsed) return parsed;
  try { return JSON.parse(text); } catch (e) { return null; }
}

function isAvailable() { return !!client; }

module.exports = { analyzeFood, analyzeExercise, generateSuggestion, isAvailable };