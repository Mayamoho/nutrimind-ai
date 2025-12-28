const express = require('express');
const geminiAdapter = require('./services/geminiAdapter');

const app = express();
app.use(express.json());

// Test endpoint without auth
app.post('/test-analyze-food', async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log('Test food analysis for:', prompt);
    const result = await geminiAdapter.analyzeFood(prompt);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/test-analyze-exercise', async (req, res) => {
  try {
    const { prompt, userWeight } = req.body;
    console.log('Test exercise analysis for:', prompt);
    const result = await geminiAdapter.analyzeExercise(prompt, userWeight);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
