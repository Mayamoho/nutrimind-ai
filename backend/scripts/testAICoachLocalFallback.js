const svc = require('../services/aiCoachService');

function assert(condition, msg) {
  if (!condition) {
    console.error('ASSERT FAILED:', msg);
    process.exit(2);
  }
}

const profile = { country: 'United States', weight: 70, height: 170, weightGoal: 'maintain' };
const todayLog = { foods: [], exercises: [] };
const dailyProgress = { calories: { achieved: 0 }, protein: 0, carbs: 0, fat: 0, goalCalories: 2000, proteinTarget: 100 };

const analysis = svc.analyzeNutritionStatus(dailyProgress);
console.log('ANALYSIS:', analysis);
assert(Number.isFinite(analysis.caloriesPerMeal), 'caloriesPerMeal must be finite');
assert(Number.isFinite(analysis.proteinPerMeal), 'proteinPerMeal must be finite');

(async function() {
  // generateCoachSuggestions will use Gemini if available; for the test we expect local fallback when Gemini isn't available
  const suggestion = await svc.generateCoachSuggestions(profile, todayLog, dailyProgress);
  console.log('SUGGESTION:', JSON.stringify(suggestion, null, 2));

  assert(suggestion.progressAnalysis && typeof suggestion.progressAnalysis.feedback === 'string', 'feedback must be string');
  assert(!suggestion.progressAnalysis.feedback.includes('NaN'), 'feedback must not contain NaN');
  assert(suggestion.nextMealSuggestion && Array.isArray(suggestion.nextMealSuggestion.options) && suggestion.nextMealSuggestion.options.length > 0, 'must have next meal options');

  for (const opt of suggestion.nextMealSuggestion.options) {
    assert(Number.isFinite(opt.calories), `option calories must be number for ${opt.name}`);
    assert(Number.isFinite(opt.protein), `option protein must be number for ${opt.name}`);
  }

  console.log('All checks passed');
  process.exit(0);
})();
