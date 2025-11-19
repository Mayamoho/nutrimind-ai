const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const auth = require('../middleware/auth');

const router = express.Router();

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper function to safely parse JSON from Gemini response
const safelyParseJsonResponse = (text) => {
    let cleanText = text.trim();
    // Handle markdown code blocks
    if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7, cleanText.length - 3).trim();
    } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.substring(3, cleanText.length - 3).trim();
    }
    return JSON.parse(cleanText);
};

router.post('/analyze-food', auth, async (req, res) => {
    const { prompt, mealType, image, schema } = req.body;
    try {
        const parts = image ? [{ text: prompt }, image] : [{ text: prompt }];
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                systemInstruction: "You are a nutrition expert. Analyze the user's text or image input to identify all distinct food items. For each item, provide a standard serving size (e.g., '1 medium apple', '2 slices of pizza', '100g chicken breast') and estimate its nutritional information for that exact serving. Respond only with an array of JSON objects based on the provided schema. If only one item is found, still return it in an array.",
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        const parsedJson = safelyParseJsonResponse(result.text);
        res.json(parsedJson);
    } catch (err) {
        console.error('Gemini API error in /analyze-food:', err.message);
        res.status(500).json({ msg: 'Error analyzing food. The AI response may have been invalid.', error: err.message });
    }
});

router.post('/analyze-exercise', auth, async (req, res) => {
    const { prompt, image, schema } = req.body;
    try {
        const parts = image ? [{ text: prompt }, image] : [{ text: prompt }];
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                systemInstruction: "You are a fitness expert. Analyze the user's text description or image of an exercise to estimate its name, duration, and calories burned. This is for active, planned workouts, not general daily activity.",
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        const parsedJson = safelyParseJsonResponse(result.text);
        res.json(parsedJson);
    } catch (err) {
        console.error('Gemini API error in /analyze-exercise:', err.message);
        res.status(500).json({ msg: 'Error analyzing exercise. The AI response may have been invalid.', error: err.message });
    }
});

router.post('/suggestion', auth, async (req, res) => {
    const { prompt, schema } = req.body;
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        const parsedJson = safelyParseJsonResponse(result.text);
        res.json(parsedJson);
    } catch (err) {
        console.error('Gemini API error in /suggestion:', err.message);
        res.status(500).json({ msg: 'Error getting suggestion. The AI response may have been invalid.', error: err.message });
    }
});

module.exports = router;
