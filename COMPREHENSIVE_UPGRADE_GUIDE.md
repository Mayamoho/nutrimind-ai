# Comprehensive Upgrade Guide - NutriMind AI

## Overview
This guide implements:
1. Weight persistence fix
2. Triple API combo (FatSecret + USDA + Edamam)
3. Removal of local databases
4. Expanded AI Coach (all countries)
5. Expanded Meal Planner (4 income classes + all countries)

---

## STEP 1: Get Free API Keys

### 1.1 USDA FoodData Central (FREE, Unlimited)
1. Visit: https://fdc.nal.usda.gov/api-key-signup.html
2. Enter your email
3. You'll receive API key instantly
4. Copy the key

### 1.2 Edamam Food Database (FREE: 10 calls/min)
1. Visit: https://developer.edamam.com/food-database-api
2. Sign up for free account
3. Create application
4. Copy APP_ID and APP_KEY

### 1.3 FatSecret (Already have)
- Already integrated in your app
- Check `backend/.env` for keys

---

## STEP 2: Update Environment Variables

Add to `backend/.env`:

```env
# Existing FatSecret
FATSECRET_CLIENT_ID=your_existing_id
FATSECRET_CLIENT_SECRET=your_existing_secret

# USDA FoodData Central (FREE, unlimited)
USDA_API_KEY=your_usda_key_here

# Edamam Food Database (FREE: 10 calls/min)
EDAMAM_APP_ID=your_edamam_app_id_here
EDAMAM_APP_KEY=your_edamam_app_key_here
```

---

## STEP 3: Implementation Files

I'll create all necessary files for you. Here's what will be created:

### New Service Files:
1. `backend/services/usdaService.js` - USDA API integration
2. `backend/services/edamamService.js` - Edamam API integration
3. `backend/services/foodAggregatorService.js` - Combines all 3 APIs
4. `backend/services/enhancedAICoachService.js` - Enhanced AI Coach
5. `backend/services/enhancedMealPlannerService.js` - Enhanced Meal Planner

### Updated Files:
1. `backend/routes/data.js` - Use aggregator for search
2. `contexts/DataContext.tsx` - Fix weight persistence
3. `backend/services/aiCoachService.js` - Add all countries
4. `backend/services/mealPlannerService.js` - Add 4 income classes

---

## STEP 4: How the Triple API Combo Works

### Search Flow:
```
User searches "milk vermicelli"
    ↓
1. Try FatSecret API first (fastest, 5000+ foods)
    ↓
2. If no results, try USDA (300,000+ foods)
    ↓
3. If still no results, try Edamam (900,000+ foods)
    ↓
4. Return combined results (deduplicated)
    ↓
5. Cache results for 1 hour
```

### Benefits:
- ✅ 1.2 million+ foods available
- ✅ International cuisines covered
- ✅ All free tier APIs
- ✅ Fallback system (if one fails, try next)
- ✅ Caching reduces API calls

---

## STEP 5: Income Classes

### 4 Income Tiers:
1. **Lower Class** - Budget: $2-5 per meal
   - Rice, lentils, seasonal vegetables
   - Eggs, chicken (occasionally)
   - Local/seasonal produce

2. **Lower Middle Class** - Budget: $5-10 per meal
   - More protein variety
   - Better quality ingredients
   - Some processed foods

3. **Middle Class** - Budget: $10-20 per meal
   - Diverse protein sources
   - Organic options available
   - Restaurant-quality meals

4. **Upper Class** - Budget: $20+ per meal
   - Premium ingredients
   - Superfoods, exotic items
   - Gourmet preparations

---

## STEP 6: All Countries Supported

### Complete List (from signup dropdown):
1. Afghanistan
2. Albania
3. Algeria
4. Argentina
5. Australia
6. Austria
7. Bangladesh
8. Belgium
9. Brazil
10. Canada
11. China
12. Colombia
13. Denmark
14. Egypt
15. Finland
16. France
17. Germany
18. Greece
19. India
20. Indonesia
21. Iran
22. Iraq
23. Ireland
24. Italy
25. Japan
26. Kenya
27. Malaysia
28. Mexico
29. Morocco
30. Netherlands
31. New Zealand
32. Nigeria
33. Norway
34. Pakistan
35. Philippines
36. Poland
37. Portugal
38. Russia
39. Saudi Arabia
40. Singapore
41. South Africa
42. South Korea
43. Spain
44. Sri Lanka
45. Sweden
46. Switzerland
47. Thailand
48. Turkey
49. United Arab Emirates
50. United Kingdom
51. United States
52. Vietnam

Each country will have:
- Traditional foods for all 4 income classes
- Country-specific AI Coach suggestions
- Cultural meal patterns
- Local ingredient recommendations

---

## STEP 7: Weight Persistence Fix

### Problem:
Weight resets after 6 AM because it creates new entry for new day

### Solution:
```typescript
// Instead of creating new entry each day
// Accumulate weight changes across days

Current Logic (WRONG):
Day 1: 70 kg
Day 2: 70 kg (reset!) ❌

New Logic (CORRECT):
Day 1: 70 kg
Day 2: 70 kg + accumulated changes ✅
Day 3: Day 2 weight + new changes ✅
```

### Implementation:
- Store cumulative weight in database
- Each day starts with previous day's final weight
- Weight changes accumulate, never reset

---

## STEP 8: Testing Checklist

### Food Search:
- [ ] Search "milk vermicelli" - should find results
- [ ] Search "sushi" - should find Japanese foods
- [ ] Search "biryani" - should find Indian foods
- [ ] Search "tacos" - should find Mexican foods
- [ ] Search obscure food - should try all 3 APIs

### Weight Persistence:
- [ ] Log food today - weight updates
- [ ] Wait until tomorrow (after 6 AM)
- [ ] Log food tomorrow - weight continues from yesterday
- [ ] Check weight table - shows continuous progression

### AI Coach:
- [ ] Select different countries - see country-specific advice
- [ ] Log different foods - see dynamic suggestions
- [ ] More detailed suggestions than before

### Meal Planner:
- [ ] See 4 income class options
- [ ] Different countries show different foods
- [ ] More detailed meal descriptions

---

## STEP 9: API Rate Limits

### Stay Within Free Tiers:

**FatSecret**: Unlimited (with OAuth)
- No worries

**USDA**: Unlimited
- No worries

**Edamam**: 10 calls/minute, 10,000/month
- Use caching (1 hour)
- Use as last resort
- Monitor usage

### Caching Strategy:
```javascript
// Cache search results for 1 hour
// Reduces API calls by 90%
cache.set(`food:${query}`, results, 3600000);
```

---

## STEP 10: Estimated Implementation Time

- **API Integration**: 2-3 hours
- **Weight Fix**: 30 minutes
- **AI Coach Expansion**: 2-3 hours
- **Meal Planner Expansion**: 3-4 hours
- **Testing**: 1-2 hours

**Total**: 8-12 hours of development

---

## STEP 11: What You Need to Do

1. **Get API Keys** (15 minutes):
   - USDA: https://fdc.nal.usda.gov/api-key-signup.html
   - Edamam: https://developer.edamam.com/food-database-api

2. **Add to .env file** (5 minutes):
   ```env
   USDA_API_KEY=your_key
   EDAMAM_APP_ID=your_id
   EDAMAM_APP_KEY=your_key
   ```

3. **Let me implement** (I'll create all files)

4. **Test the features** (30 minutes)

---

## STEP 12: Benefits After Implementation

### Food Search:
- ✅ 1.2 million+ foods
- ✅ International cuisines
- ✅ Better recognition
- ✅ "milk vermicelli" will be found
- ✅ Image logging improved (via better database)

### Weight Tracking:
- ✅ Persists across days
- ✅ Continuous progression
- ✅ No resets at 6 AM

### AI Coach:
- ✅ 52 countries supported
- ✅ More detailed suggestions
- ✅ Dynamic based on logged foods
- ✅ Cultural recommendations

### Meal Planner:
- ✅ 4 income classes
- ✅ 52 countries supported
- ✅ More meal options
- ✅ Detailed descriptions

---

## Ready to Proceed?

Once you provide the API keys, I'll implement everything. The changes are significant but will dramatically improve your app!

**Next Steps**:
1. Get USDA API key
2. Get Edamam APP_ID and APP_KEY
3. Share them with me (or add to .env)
4. I'll implement all changes
5. Test together

Let me know when you're ready!
