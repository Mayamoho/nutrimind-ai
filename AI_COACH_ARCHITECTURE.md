# AI Coach & Meal Planner - Production Architecture

## Overview

The system now has a clear separation of concerns:

1. **AI Coach** → Analyzes user's LOGGED foods from database, gives personalized advice
2. **Meal Planner** → Uses FREE food APIs to suggest country-specific meals

---

## AI Coach Service (`aiCoachService.js`)

### Purpose
Analyzes what the user has ACTUALLY EATEN and provides personalized nutritionist advice.

### Data Source
- User's logged foods from PostgreSQL database
- User's logged exercises
- User profile (weight, height, age, gender, country, goal)

### Key Functions

```javascript
analyzeNutritionStatus(dailyProgress, userProfile)
// Returns: caloriePercent, proteinPercent, grade (A/B/C/D), mealTime, remaining calories

generateCoachSuggestions(userProfile, todayLog, dailyProgress)
// Analyzes logged foods and returns:
// - detailedConsultation (10-15 lines based on what they ate)
// - foodAnalysis { positives, concerns, missing }
// - nextMealSuggestion (based on remaining calories/protein)
// - immediateAction
// - motivationalMessage
```

### Example Flow
```
User logs: "Rice with Dal" (450 cal, 12g protein)
           "Fried Egg" (90 cal, 6g protein)
           "Tea with Sugar" (50 cal, 0g protein)

AI Coach analyzes:
- Total: 590 cal (33% of 1800 goal)
- Protein: 18g (15% of 120g target) ← CRITICALLY LOW
- Grade: D

Response:
"Looking at your food log, you've had rice with dal, fried egg, and tea.
Your protein intake is critically low at 15%. The tea with sugar added
empty calories. For your next meal, prioritize protein-rich foods like
grilled fish, chicken, or lentils. You need 102g more protein today..."
```

---

## Food API Service (`foodApiService.js`)

### Purpose
Fetches country-specific foods from FREE APIs for meal planning.

### APIs Used (Priority Order)

1. **TheMealDB** (FREE, no key needed)
   - 300+ recipes by country/area
   - Endpoint: `themealdb.com/api/json/v1/1/filter.php?a=Indian`
   - Areas: American, British, Canadian, Chinese, Croatian, Dutch, Egyptian, Filipino, French, Greek, Indian, Irish, Italian, Jamaican, Japanese, Kenyan, Malaysian, Mexican, Moroccan, Polish, Portuguese, Russian, Spanish, Thai, Tunisian, Turkish, Ukrainian, Vietnamese

2. **Open Food Facts** (FREE, no key needed)
   - Millions of food products with nutrition data
   - Country-specific searches
   - Endpoint: `world.openfoodfacts.org/cgi/search.pl?search_terms=biryani`

3. **Spoonacular** (150 free calls/day - backup)
   - Only used if other APIs fail
   - Requires API key

### Country Mapping

```javascript
COUNTRY_TO_AREA = {
  'Bangladesh': 'Indian',  // TheMealDB area
  'Pakistan': 'Indian',
  'Japan': 'Japanese',
  'Mexico': 'Mexican',
  // ... 50+ countries mapped
}

COUNTRY_FOODS = {
  'Bangladesh': ['biryani', 'dal', 'rice', 'fish curry', 'roti'],
  'Japan': ['sushi', 'ramen', 'rice', 'miso', 'tofu'],
  // ... keywords for Open Food Facts search
}
```

### Key Function

```javascript
getCountryFoods(country, mealType, targetCalories, count)
// 1. Fetches from TheMealDB by area
// 2. Searches Open Food Facts with country keywords
// 3. Falls back to Spoonacular if needed
// Returns: Array of foods with name, calories, protein, source
```

---

## Meal Planner Service (`mealPlannerService.js`)

### Purpose
Generates daily/weekly meal plans using foods from the API service.

### Key Function

```javascript
generateDailyPlan(userProfile, todayLog)
// 1. Calculates remaining calories (goal - logged)
// 2. Fetches country-specific foods from APIs
// 3. Sends to Gemini AI for meal plan generation
// 4. Falls back to API foods directly if AI fails
// Returns: Plan with breakfast/lunch/snacks/dinner, each with 4 budget levels
```

### Output Structure

```javascript
{
  nutritionistNote: "Personalized explanation...",
  breakfast: {
    targetCalories: 450,
    targetProtein: 30,
    time: "7:00-9:00 AM",
    nutritionistTip: "Start with protein...",
    low_income: [{ name, portion, calories, protein, benefit }],
    lower_middle: [...],
    upper_middle: [...],
    high_income: [...]
  },
  lunch: { ... },
  snacks: { ... },
  dinner: { ... },
  tips: ["5 country-specific tips"],
  apiSources: { breakfast: 8, lunch: 10, dinner: 10 }
}
```

---

## API Endpoints

### AI Coach
```
POST /api/aicoach/suggestions
- Returns comprehensive analysis of logged foods

POST /api/aicoach/quick-food-tip
- Body: { food: { name, calories, protein } }
- Returns quick 2-3 sentence tip after logging

POST /api/aicoach/quick-exercise-tip
- Body: { exercise: { name, caloriesBurned } }
- Returns post-workout nutrition tip
```

### Meal Planner
```
POST /api/planner/daily
- Returns daily meal plan with country-specific foods

POST /api/planner/weekly
- Returns 7-day overview

POST /api/planner/workout
- Returns goal-specific workout plan
```

---

## Key Differences from Before

| Before | After |
|--------|-------|
| AI Coach fetched random foods from Spoonacular | AI Coach analyzes user's LOGGED foods only |
| Same Indian food for all countries | Country-specific foods from TheMealDB + Open Food Facts |
| Single API dependency | Multi-API fallback chain |
| Generic advice | Specific advice based on actual food log |

---

## Testing

```bash
# Test Food API
node -e "
const api = require('./services/foodApiService');
api.getCountryFoods('Bangladesh', 'lunch', 500, 5).then(console.log);
"

# Test AI Coach Analysis
node -e "
const coach = require('./services/aiCoachService');
const analysis = coach.analyzeNutritionStatus(
  { calories: { achieved: 590 }, protein: 18, goalCalories: 1800, proteinTarget: 120 },
  { weight: 75, weightGoal: 'lose' }
);
console.log(analysis);
"
```
