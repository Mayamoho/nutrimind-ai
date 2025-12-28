/**
 * Food API Routes
 * All food logging via FREE APIs: Spoonacular + Open Food Facts + Gemini AI
 * Features: Search, NLP (text), Image Recognition, Barcode, Voice (via text)
 */

const express = require('express');
const router = express.Router();
const foodAggregator = require('../services/foodAggregatorService');

/**
 * POST /api/food/search
 * Search food across all FREE APIs
 * Body: { query: "chicken breast", country: "India" }
 */
router.post('/search', async (req, res) => {
  try {
    const { query, country = 'world' } = req.body;
    if (!query?.trim()) return res.status(400).json({ error: 'Query required' });
    
    const results = await foodAggregator.searchFood(query, country);
    res.json({ success: true, query, count: results.length, results });
  } catch (err) {
    console.error('Food search error:', err);
    res.status(500).json({ error: 'Search failed', message: err.message });
  }
});

/**
 * POST /api/food/parse
 * Parse natural language food input (text/voice transcription)
 * Body: { text: "1 cup rice and 200g chicken" }
 * Uses Spoonacular NLP
 */
router.post('/parse', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text required' });
    
    const results = await foodAggregator.parseNaturalLanguage(text);
    res.json({ success: true, text, results });
  } catch (err) {
    console.error('NLP parse error:', err);
    res.status(500).json({ error: 'Parse failed', message: err.message });
  }
});

/**
 * POST /api/food/analyze-image
 * Analyze food from image URL
 * Body: { imageUrl: "https://..." }
 * Uses Spoonacular Image Recognition
 */
router.post('/analyze-image', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl?.trim()) return res.status(400).json({ error: 'imageUrl required' });
    
    const result = await foodAggregator.analyzeImage(imageUrl);
    if (!result) return res.status(404).json({ success: false, error: 'Could not analyze image' });
    
    res.json({ success: true, imageUrl, result });
  } catch (err) {
    console.error('Image analysis error:', err);
    res.status(500).json({ error: 'Image analysis failed', message: err.message });
  }
});

/**
 * GET /api/food/barcode/:code
 * Get food by barcode (FREE - Open Food Facts)
 */
router.get('/barcode/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await foodAggregator.getFoodByBarcode(code);
    
    if (!result) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, result });
  } catch (err) {
    console.error('Barcode error:', err);
    res.status(500).json({ error: 'Barcode lookup failed', message: err.message });
  }
});

/**
 * GET /api/food/cache/stats
 */
router.get('/cache/stats', (req, res) => {
  res.json({ success: true, stats: foodAggregator.getCacheStats() });
});

/**
 * POST /api/food/cache/clear
 */
router.post('/cache/clear', (req, res) => {
  foodAggregator.clearCache();
  res.json({ success: true, message: 'Cache cleared' });
});

module.exports = router;
