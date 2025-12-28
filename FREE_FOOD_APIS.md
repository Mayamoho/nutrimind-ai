# 100% Free Food APIs - No Credit Card Required

Your app now uses **FOUR completely free food APIs** with advanced features:

## 1. FatSecret API ✅ (Already Configured)
- **Status**: FREE forever
- **Limits**: 10,000 calls/day
- **Database**: 1+ million foods
- **Setup**: Already working in your app
- **API Key**: Already in `.env` file

## 2. Spoonacular API ✅ (NEW - Best for Cuisines!)
- **Status**: FREE tier - 150 calls/day
- **Limits**: No credit card required
- **Database**: 330,000+ ingredients from ALL cuisines
- **Features**: 
  - ✨ **Natural Language Processing** - "1 cup rice and 200g chicken"
  - 📸 **Image Recognition** - Upload food photos
  - 🌍 **International Cuisines** - Indian, Chinese, Italian, Mexican, etc.
  - 🍳 **10,000+ Recipes** with nutrition data
- **Get Key**: https://spoonacular.com/food-api/console#Dashboard
- **Setup**: Add `SPOONACULAR_API_KEY` to `.env`

## 3. USDA FoodData Central ✅ (Already Configured)
- **Status**: 100% FREE, government-funded
- **Limits**: Unlimited API calls
- **Database**: 300,000+ foods (US-focused)
- **Setup**: Already working in your app
- **API Key**: Already in `.env` file

## 4. Open Food Facts ✅ (Already Configured - NO API KEY!)
- **Status**: 100% FREE, open-source
- **Limits**: No limits, no API key needed
- **Database**: 2.8+ million products worldwide
- **Setup**: Works immediately, no configuration

---

## 🚀 New Advanced Features

### 1. Natural Language Processing (NLP)
Parse complex food queries like:
- "1 cup of rice and 200g chicken breast"
- "2 eggs, 1 slice of bread, 1 apple"
- "100g pasta with tomato sauce"

**API Endpoint**: `POST /api/food/parse`
```json
{
  "text": "1 cup rice and 200g chicken"
}
```

### 2. Image Recognition 📸
Analyze food from photos:
- Upload image URL
- Get food category and nutrition
- Receive recipe suggestions

**API Endpoint**: `POST /api/food/analyze-image`
```json
{
  "imageUrl": "https://example.com/food-photo.jpg"
}
```

### 3. Smart Food Search
Search across all 4 APIs with intelligent fallback:

**API Endpoint**: `POST /api/food/search`
```json
{
  "query": "chicken tikka masala"
}
```

---

## How It Works

Your app uses a **smart fallback system**:

1. **FatSecret** searches first (fastest, most reliable)
2. **Spoonacular** adds international cuisines + NLP features
3. **USDA** fills in gaps (comprehensive US foods)
4. **Open Food Facts** adds global products (packaged foods)

All results are:
- Cached for 1 hour
- Deduplicated by name
- Sorted by relevance
- Limited to top 20 results

---

## Setup Instructions

### Get Spoonacular API Key (2 minutes):

1. Go to: https://spoonacular.com/food-api/console#Dashboard
2. Click "Get Started" (no credit card required)
3. Sign up with email
4. Copy your API key
5. Add to `backend/.env`:
   ```
   SPOONACULAR_API_KEY=your_key_here
   ```

### Test the APIs:

```bash
cd backend
npm start
```

Then test in your app or use curl:

```bash
# Search food
curl -X POST http://localhost:5000/api/food/search \
  -H "Content-Type: application/json" \
  -d '{"query":"chicken tikka"}'

# Parse natural language
curl -X POST http://localhost:5000/api/food/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"1 cup rice and 200g chicken"}'

# Analyze image
curl -X POST http://localhost:5000/api/food/analyze-image \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://example.com/food.jpg"}'
```

---

## API Comparison

| API | Cost | API Key | Rate Limit | Database | Special Features |
|-----|------|---------|------------|----------|------------------|
| FatSecret | FREE | Yes | 10k/day | 1M+ foods | Fast, reliable |
| Spoonacular | FREE | Yes | 150/day | 330k+ ingredients | **NLP, Image Recognition, All Cuisines** |
| USDA | FREE | Yes | Unlimited | 300k+ foods | Government data |
| Open Food Facts | FREE | No | Unlimited | 2.8M+ products | Open-source, global |

**Total: 4.4+ million foods with NLP & Image Recognition - 100% FREE!**

---

## New API Routes

All routes are now available at `http://localhost:5000/api/food/`:

- `POST /api/food/search` - Search food across all APIs
- `POST /api/food/parse` - Parse natural language input (NLP)
- `POST /api/food/analyze-image` - Analyze food from image
- `GET /api/food/cache/stats` - Get cache statistics
- `POST /api/food/cache/clear` - Clear the cache

---

## Files Created/Updated

### New Files:
- ✅ `backend/services/spoonacularService.js` - Spoonacular API integration
- ✅ `backend/services/openFoodFactsService.js` - Open Food Facts integration
- ✅ `backend/routes/food.js` - Unified food API routes

### Updated Files:
- ✅ `backend/services/foodAggregatorService.js` - Added NLP & image recognition
- ✅ `backend/server.js` - Registered food routes
- ✅ `backend/.env` - Added Spoonacular config

---

## What's Next?

1. Get your Spoonacular API key (2 minutes)
2. Add it to `.env`
3. Restart backend server
4. Start searching foods from all cuisines!
5. Try the NLP feature: "1 cup rice and 200g chicken"
6. Upload food photos for instant recognition!

**You now have the most comprehensive free food database with AI-powered features!** 🎉
