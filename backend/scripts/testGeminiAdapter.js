const gemini = require('../services/geminiAdapter');

(async () => {
  console.log('Gemini available:', gemini.isAvailable());
  try {
    const r = await gemini.generateSuggestion('Test suggestion for healthy dinner', 'gemini-2.5-flash');
    console.log('Suggestion result:', r);
  } catch (e) {
    console.error('Suggestion failed:', e && (e.code || e.status) || e.message || e);
  }

  try {
    const food = await gemini.analyzeFood('1 bowl of oatmeal with banana and nuts');
    console.log('Analyze food result:', food);
  } catch (e) {
    console.error('Analyze food failed:', e && (e.code || e.status) || e.message || e);
  }

  try {
    const ex = await gemini.analyzeExercise('30 minute run', 70);
    console.log('Analyze exercise result:', ex);
  } catch (e) {
    console.error('Analyze exercise failed:', e && (e.code || e.status) || e.message || e);
  }
})();