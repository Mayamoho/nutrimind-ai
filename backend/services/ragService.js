/**
 * RAG (Retrieval-Augmented Generation) Service
 * Uses user data and web scraping to provide contextual responses
 */

const axios = require('axios');
const cheerio = require('cheerio');

class RAGService {
  constructor() {
    this.knowledgeBase = new Map();
    this.userContextCache = new Map();
    this.initializeKnowledgeBase();
  }

  /**
   * Initialize knowledge base with health/nutrition data
   */
  async initializeKnowledgeBase() {
    // Add enhanced nutrition knowledge
    this.knowledgeBase.set('nutrition', {
      water: 'Adults should drink 2-3 liters (8-12 glasses) of water daily. Your needs: ~33ml per kg body weight. More if exercising or in hot weather. Signs of dehydration: thirst, dark urine, fatigue, headache.',
      protein: 'Adults need 0.8-1.2g protein per kg body weight daily. More if active (1.2-1.6g) or building muscle (1.6-2.2g). Spread throughout day for optimal absorption. Best sources: lean meats, fish, eggs, dairy, legumes, tofu.',
      calories: 'Average adult needs 2000-2500 calories daily. Calculate: BMR (10×weight + 6.25×height - 5×age + s) + activity factor. Quality matters more than quantity - focus on nutrient-dense foods.',
      fruits: 'Eat 2-4 servings of fruits daily for vitamins, fiber, and antioxidants. Different colors provide different nutrients. Berries are high in antioxidants, bananas provide potassium, citrus offers vitamin C.',
      vegetables: 'Eat 3-5 servings of vegetables daily. Focus on leafy greens (iron, calcium) and colorful vegetables (vitamins). Dark leafy greens: spinach, kale, collards. Colorful: bell peppers, carrots, tomatoes.',
      fiber: 'Adults need 25-35g fiber daily. Good sources: whole grains, legumes, fruits, vegetables. Helps with digestion, satiety, and blood sugar control. Increase gradually to avoid digestive issues.',
      fats: 'Healthy fats should be 20-35% of calories. Focus on unsaturated fats from nuts, seeds, avocado, olive oil. Limit saturated fats, avoid trans fats. Omega-3s are crucial for brain health.',
      micronutrients: 'Key micronutrients: Iron (especially for women), Calcium (bone health), Vitamin D (immune), B vitamins (energy), Magnesium (muscle function), Zinc (immune).',
      supplements: 'Most people don\'t need supplements if eating balanced diet. Exceptions: Vitamin D (limited sun exposure), B12 (vegans), Iron (menstruating women), Omega-3 (low fish intake).',
      coffee: 'Coffee can be part of a healthy diet! Benefits: increased alertness, improved physical performance, reduced disease risk. Limit to 3-4 cups daily. Avoid after 2 PM to protect sleep. Best black or with minimal sugar/milk.'
    });

    // Add enhanced meal timing advice
    this.knowledgeBase.set('meal_timing', {
      breakfast: 'Eat within 2 hours of waking. Include protein (20-30g) and complex carbs for sustained energy. Examples: eggs with whole grain toast, Greek yogurt with berries, oatmeal with nuts.',
      lunch: 'Balanced lunch with lean protein, complex carbs, vegetables. Avoid heavy meals that cause afternoon slump. Include fiber for satiety. Example: grilled chicken salad, quinoa bowl, turkey wrap.',
      dinner: 'Lighter dinner 2-3 hours before bed. Focus on vegetables and lean protein, limit heavy carbs. Promotes better sleep and digestion. Example: baked fish with roasted vegetables, chicken stir-fry.',
      snacks: 'Healthy snacks between meals prevent overeating. Good options: nuts, yogurt, fruit, vegetables with hummus. Aim for 100-200 calories. Include protein for satiety.',
      pre_workout: 'Eat 1-2 hours before exercise: easily digestible carbs + some protein. Banana with peanut butter, oatmeal, or smoothie. Avoid high fat or fiber right before exercise.',
      post_workout: 'Within 30-60 minutes: protein + carbs for muscle recovery. Chocolate milk, protein shake with banana, chicken with rice. Ratio: 3:1 or 4:1 carbs to protein.',
      intermittent_fasting: 'Popular approaches: 16:8 (fast 16 hours, eat 8 hours), 5:2 (normal eating 5 days, low calories 2 days). Can work for some but listen to your body. Stay hydrated during fasts.',
      late_night: 'If hungry at night, choose light, protein-rich options: Greek yogurt, small handful of nuts, cottage cheese. Avoid heavy carbs or large meals that disrupt sleep.'
    });

    // Add enhanced workout advice
    this.knowledgeBase.set('workout', {
      cardio: 'Cardio: 150 minutes moderate or 75 minutes vigorous weekly. Options: running, cycling, swimming, dancing, brisk walking. Improves heart health, burns calories, boosts mood.',
      strength: 'Strength training: 2-3 sessions weekly. Work all major muscle groups. Progressive overload is key for muscle growth. Start with bodyweight, then add weights.',
      flexibility: 'Stretching/yoga: 2-3 times weekly or daily. Improves range of motion, prevents injury, reduces stress. Best after workouts when muscles are warm.',
      consistency: 'Start with 3-4 days weekly, gradually increase. Listen to your body, rest is important for progress. Quality over quantity - proper form prevents injury.',
      beginners: 'Start with 20-30 minutes sessions. Focus on form over intensity. Build habit before increasing difficulty. Walking is excellent starting point.',
      progression: 'Increase duration, intensity, or frequency gradually. Rule of thumb: increase by 10% weekly. Track progress to stay motivated.',
      home_workouts: 'Effective home exercises: bodyweight squats, push-ups, planks, lunges, burpees. Use household items as weights (water bottles, backpack). Resistance bands are affordable.',
      gym_etiquette: 'Wipe down equipment, re-rack weights, respect personal space, avoid phone calls, share equipment during busy times. Ask staff for help with form.'
    });

    // Add weight management advice
    this.knowledgeBase.set('weight_management', {
      loss: 'Healthy weight loss: 0.5-1kg per week. Create 500-calorie daily deficit through diet and exercise. Sustainable approach is key. Focus on habits, not just numbers.',
      gain: 'Healthy weight gain: 0.25-0.5kg per week. Calorie surplus of 300-500 calories with strength training. Focus on nutrient-dense foods, not just junk food.',
      maintenance: 'Maintenance: calories in = calories out. Monitor weight weekly and adjust intake accordingly. Flexibility is key - some days higher, some lower.',
      plateau: 'Weight plateau is normal. Try: change exercise routine, adjust calories, check portion sizes, improve sleep quality, manage stress, vary macronutrient ratios.',
      metabolism: 'Metabolism affected by: muscle mass, age, hormones, sleep, stress. Build muscle to boost metabolism naturally. Eat enough protein - has higher thermic effect.',
      tracking: 'Track food intake for 1-2 weeks to understand patterns. Use apps, journal, or photos. Focus on trends, not perfection. Weekly weigh-ins are more informative than daily.',
      body_composition: 'Scale weight doesn\'t tell whole story. Consider measurements, body fat percentage, how clothes fit, photos, strength gains. Muscle is denser than fat.'
    });

    // Add mental health and lifestyle advice
    this.knowledgeBase.set('mental_health', {
      stress: 'Chronic stress raises cortisol, affecting weight, sleep, and health. Management techniques: deep breathing, meditation, exercise, nature, social connection, adequate sleep.',
      sleep: 'Quality sleep (7-9 hours) is essential for: hormone regulation, muscle recovery, cognitive function, immune health. Poor sleep increases hunger hormones and cravings.',
      mindful_eating: 'Pay attention to hunger cues, eat slowly, avoid distractions. Recognize fullness signals. This improves digestion, satisfaction, and prevents overeating.',
      motivation: 'Intrinsic motivation (health, energy, confidence) is more sustainable than extrinsic (appearance). Set process goals (habits) not just outcome goals (weight).',
      consistency: 'Progress isn\'t linear. Focus on consistency, not perfection. 80/20 rule: eat well 80% of time, allow flexibility 20%. One "bad" meal doesn\'t ruin progress.'
    });

    // Add country-specific food recommendations
    this.knowledgeBase.set('country_foods', {
      US: {
        proteins: 'Chicken breast, turkey, salmon, tuna, eggs, Greek yogurt, lean beef, tofu',
        carbs: 'Brown rice, quinoa, sweet potatoes, whole wheat bread, oatmeal, corn, beans',
        vegetables: 'Broccoli, spinach, kale, bell peppers, tomatoes, carrots, avocado',
        fruits: 'Apples, bananas, berries, oranges, grapes, watermelon',
        snacks: 'Almonds, walnuts, Greek yogurt, hummus with vegetables, protein bars',
        traditional: 'Grilled chicken, salads, smoothies, oatmeal bowls, stir-fry'
      },
      UK: {
        proteins: 'Chicken, beef, lamb, fish (cod, haddock), eggs, beans, lentils',
        carbs: 'Potatoes, bread, pasta, rice, oats, whole grains',
        vegetables: 'Peas, carrots, cabbage, broccoli, onions, mushrooms',
        fruits: 'Apples, pears, berries, bananas, oranges',
        snacks: 'Nuts, seeds, yogurt, cheese, oatcakes',
        traditional: 'Roast dinners, fish and chips (grilled version), shepherd\'s pie (lean), full English breakfast (healthy version)'
      },
      India: {
        proteins: 'Chicken, fish, eggs, lentils (dal), chickpeas, paneer, tofu',
        carbs: 'Basmati rice, roti, naan (whole wheat), quinoa, millets',
        vegetables: 'Spinach (palak), cauliflower, okra, eggplant, tomatoes, onions',
        fruits: 'Mangoes, bananas, guava, papaya, oranges, apples',
        snacks: 'Roasted chickpeas, nuts, seeds, yogurt (dahi), sprouts',
        traditional: 'Dal with roti, grilled tandoori chicken, vegetable curries, sambar, idli (steamed)'
      },
      China: {
        proteins: 'Chicken, fish, tofu, eggs, pork (lean), shrimp, edamame',
        carbs: 'Rice, noodles, dumplings (steamed), bao (whole wheat), congee',
        vegetables: 'Bok choy, broccoli, cabbage, carrots, snow peas, mushrooms',
        fruits: 'Apples, pears, oranges, lychee, dragon fruit, kiwi',
        snacks: 'Edamame, nuts, seeds, seaweed snacks, steamed buns',
        traditional: 'Stir-fried vegetables with tofu, steamed fish, congee, vegetable dumplings, hot pot (broth-based)'
      },
      Japan: {
        proteins: 'Fish (salmon, tuna), tofu, edamame, chicken, eggs, miso',
        carbs: 'Rice, soba noodles, udon, seaweed, sweet potatoes',
        vegetables: 'Seaweed, daikon radish, bok choy, mushrooms, bamboo shoots',
        fruits: 'Apples, persimmons, melons, berries, citrus fruits',
        snacks: 'Edamame, roasted nuts, seaweed snacks, rice crackers',
        traditional: 'Grilled fish, miso soup, vegetable tempura (baked), sushi rolls, steamed vegetables'
      },
      Mexico: {
        proteins: 'Chicken, fish, beans, lentils, eggs, lean beef',
        carbs: 'Corn tortillas, brown rice, quinoa, beans, sweet potatoes',
        vegetables: 'Bell peppers, onions, tomatoes, avocados, cilantro, jalapeños',
        fruits: 'Mangoes, papaya, watermelon, oranges, limes',
        snacks: 'Roasted chickpeas, nuts, seeds, jicama with lime, guacamole with vegetables',
        traditional: 'Grilled chicken fajitas, fish tacos (grilled), bean bowls, vegetable soups, ceviche'
      },
      Brazil: {
        proteins: 'Chicken, fish, beef, eggs, beans, lentils',
        carbs: 'Rice, beans, manioc, sweet potatoes, corn, whole grain bread',
        vegetables: 'Collard greens, tomatoes, onions, bell peppers, squash',
        fruits: 'Acai berries, mangoes, papaya, oranges, passion fruit',
        snacks: 'Roasted nuts, seeds, fruit bowls, coconut water',
        traditional: 'Grilled meats (churrasco style), rice and beans, fish stew, vegetable salads, acai bowls'
      },
      Italy: {
        proteins: 'Chicken, fish, eggs, legumes, lean pork, cheese (moderation)',
        carbs: 'Pasta (whole wheat), risotto, bread, polenta, farro',
        vegetables: 'Tomatoes, zucchini, eggplant, bell peppers, spinach, arugula',
        fruits: 'Grapes, figs, apples, oranges, lemons, berries',
        snacks: 'Nuts, olives, cheese (small portions), fruit',
        traditional: 'Grilled fish, vegetable pasta, minestrone soup, caprese salad, bruschetta (healthy version)'
      },
      France: {
        proteins: 'Chicken, fish, eggs, cheese (moderation), lean meats',
        carbs: 'Baguette (whole grain), quinoa, rice, potatoes',
        vegetables: 'Green beans, spinach, mushrooms, tomatoes, leeks, carrots',
        fruits: 'Apples, pears, berries, grapes, citrus fruits',
        snacks: 'Nuts, yogurt, cheese (small portions), fruit',
        traditional: 'Grilled fish, vegetable soups, salads, ratatouille, quiche (vegetable-based)'
      },
      Germany: {
        proteins: 'Pork (lean), chicken, fish, eggs, cheese, legumes',
        carbs: 'Potatoes, bread (whole grain), noodles, oats, rye',
        vegetables: 'Cabbage, carrots, onions, spinach, asparagus, mushrooms',
        fruits: 'Apples, berries, plums, grapes',
        snacks: 'Nuts, seeds, yogurt, whole grain crackers',
        traditional: 'Grilled sausages (lean), potato salads, vegetable soups, roasted vegetables, whole grain breads'
      }
    });
  }

  /**
   * Enhanced web scraping with comprehensive content
   */
  async scrapeHealthContent(query) {
    try {
      // Enhanced curated content with multiple topics
      const content = this.getComprehensiveContent(query);
      return content;
    } catch (error) {
      console.error('Web scraping error:', error);
      return this.getFallbackContent(query);
    }
  }

  /**
   * Get comprehensive content based on keywords
   */
  getComprehensiveContent(query) {
    const lowerQuery = query.toLowerCase();
    const content = [];

    // Weight loss specific content
    if (lowerQuery.includes('weight loss') || lowerQuery.includes('lose weight')) {
      content.push(
        'Evidence-based weight loss: Create sustainable calorie deficit through portion control, nutrient-dense foods, and regular physical activity.',
        'Focus on protein (25-30% of calories) and fiber to maintain satiety. Stay hydrated, get adequate sleep (7-9 hours).',
        'Avoid crash diets. Aim for 1-2 pounds per week loss. Track progress but don\'t weigh daily - weekly is better.',
        'Consider mindful eating: pay attention to hunger cues, eat slowly, avoid distractions during meals.',
        'High-intensity interval training (HIIT) can boost metabolism. Strength training preserves muscle during weight loss.'
      );
    }

    // Muscle gain content
    if (lowerQuery.includes('muscle') || lowerQuery.includes('gain') || lowerQuery.includes('build')) {
      content.push(
        'Muscle gain requires: calorie surplus (300-500), adequate protein (1.6-2.2g per kg), progressive strength training.',
        'Compound exercises are most effective: squats, deadlifts, bench press, rows, overhead press.',
        'Rest is crucial: muscles grow during recovery, not training. Allow 48 hours between training same muscle groups.',
        'Consistency over intensity: regular training with proper form beats occasional intense workouts.',
        'Track strength gains, not just weight. Progressive overload: increase weight, reps, or sets gradually.'
      );
    }

    // Coffee specific content
    if (lowerQuery.includes('coffee')) {
      content.push(
        'Coffee can be part of a healthy diet! Benefits: increased alertness, improved physical performance, reduced disease risk.',
        'Limit to 3-4 cups daily. Avoid after 2 PM to protect sleep. Best black or with minimal sugar/milk.',
        'Coffee contains antioxidants and may reduce risk of type 2 diabetes, Parkinson\'s, and liver disease.',
        'Caffeine timing: 30-60 minutes before exercise for performance boost. Wait 90+ minutes after waking to avoid cortisol disruption.'
      );
    }

    // Nutrition specific content
    if (lowerQuery.includes('nutrition') || lowerQuery.includes('diet') || lowerQuery.includes('eat')) {
      content.push(
        'Balanced nutrition: half plate vegetables, quarter protein, quarter complex carbs, healthy fats in moderation.',
        'Eat the rainbow: different colored fruits/vegetables provide different phytonutrients and antioxidants.',
        'Limit processed foods, added sugars, and excessive saturated fats. Focus on whole, unprocessed foods.',
        'Meal prep helps maintain healthy eating habits. Plan meals, shop with a list, prepare ingredients in advance.',
        'Listen to your body\'s hunger and fullness signals. Eat when hungry, stop when satisfied, not stuffed.'
      );
    }

    // Food suggestions content (but not for coffee)
    if ((lowerQuery.includes('food') || lowerQuery.includes('suggest') || lowerQuery.includes('eat') || lowerQuery.includes('meal')) && !lowerQuery.includes('coffee')) {
      content.push(
        'For optimal nutrition, focus on whole foods that are readily available in your region.',
        'Include a variety of proteins, complex carbohydrates, healthy fats, and colorful vegetables.',
        'Choose local and seasonal produce when possible for better nutrition and taste.',
        'Consider your cultural preferences and traditional foods adapted for health.',
        'Batch cooking saves time: prepare grains, proteins, and chopped vegetables for easy meal assembly.'
      );
    }

    // Exercise specific content
    if (lowerQuery.includes('exercise') || lowerQuery.includes('workout') || lowerQuery.includes('fitness')) {
      content.push(
        'Effective exercise routine: combine cardio (heart health), strength (muscle/bone), flexibility (mobility), balance.',
        'Find activities you enjoy to maintain consistency. Mix it up to prevent boredom and work different muscles.',
        'Warm-up before exercise (5-10 minutes light cardio + dynamic stretching). Cool-down after (static stretching).',
        'Listen to your body: rest when needed, don\'t push through pain. Recovery is as important as training.',
        'Exercise buddies increase accountability and make workouts more enjoyable. Consider group classes or sports.'
      );
    }

    // Hydration content
    if (lowerQuery.includes('water') || lowerQuery.includes('hydrate') || lowerQuery.includes('thirst')) {
      content.push(
        'Hydration affects: energy levels, cognitive function, physical performance, skin health, digestion.',
        'Signs of dehydration: thirst, dark urine, fatigue, headache, dizziness, dry mouth.',
        'Beyond water: hydrate with herbal teas, water-rich fruits/vegetables, broth. Limit caffeine and alcohol.',
        'Athletes need more: add 500-750ml per hour of exercise. Include electrolytes for sessions over 60 minutes.',
        'Set reminders to drink water throughout the day. Keep a reusable water bottle visible.'
      );
    }

    // Sleep and recovery
    if (lowerQuery.includes('sleep') || lowerQuery.includes('recovery') || lowerQuery.includes('rest')) {
      content.push(
        'Quality sleep (7-9 hours) is essential for: hormone regulation, muscle recovery, cognitive function, immune health.',
        'Sleep hygiene: consistent schedule, cool dark room, no screens 1 hour before bed, avoid caffeine after 2pm.',
        'Recovery days are important: include active recovery (light activity) and complete rest days.',
        'Stress management: meditation, deep breathing, yoga, or time in nature can improve sleep and recovery.',
        'Create a relaxing bedtime routine: reading, gentle stretching, or listening to calm music.'
      );
    }

    // Motivation and consistency
    if (lowerQuery.includes('motivation') || lowerQuery.includes('consistency') || lowerQuery.includes('habit')) {
      content.push(
        'Build habits slowly: start with 1-2 small changes, master them, then add more. Consistency beats perfection.',
        'Set SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound. Break large goals into smaller milestones.',
        'Track progress to stay motivated: celebrate small wins, learn from setbacks, adjust approach as needed.',
        'Find your "why": connect health goals to deeper values (energy for family, confidence, longevity).',
        'Environment design: make healthy choices easy, unhealthy choices harder. Prep healthy snacks, keep workout clothes visible.'
      );
    }

    return content.length > 0 ? content.join(' ') : null;
  }

  /**
   * Fallback content for unrecognized queries
   */
  getFallbackContent(query) {
    const fallbacks = {
      general: 'I can help with nutrition, exercise, weight management, hydration, and recovery strategies.',
      specific: 'Try asking about: meal planning, workout routines, weight loss/gain, protein needs, or hydration goals.',
      action: 'Based on your health data, I can provide personalized advice. Ask me about your daily progress or specific goals!'
    };

    const keys = Object.keys(fallbacks);
    return fallbacks[keys[Math.floor(Math.random() * keys.length)]];
  }

  /**
   * Build user context from their data
   */
  buildUserContext(userData, dailyLogs, goals) {
    const contextKey = userData.email;
    
    // Check cache first (30 seconds cache for better responsiveness)
    if (this.userContextCache.has(contextKey)) {
      const cached = this.userContextCache.get(contextKey);
      if (Date.now() - cached.timestamp < 30000) { // 30 seconds cache
        return cached.context;
      }
    }

    // Use the most recent log (should be today's log if it exists)
    const todayLog = dailyLogs.length > 0 ? dailyLogs[0] : { foods: [], exercises: [], waterIntake: 0 };
    
    console.log('RAG Service: Today log data:', todayLog);
    console.log('RAG Service: Foods array:', todayLog.foods);
    
    // Enhanced calculations with more nutrients
    const caloriesIn = todayLog.foods.reduce((sum, food) => {
      // Handle different food data structures
      let calories = 0;
      if (typeof food.calories === 'number') calories = food.calories;
      else if (food.nutrients?.calories) calories = food.nutrients.calories;
      else if (food.nutrients?.macros?.calories) calories = food.nutrients.macros.calories;
      else if (typeof food === 'object' && food !== null) {
        // Check if it's a simple object with calorie data
        const calorieKeys = ['calories', 'calorie', 'energy', 'kcal'];
        for (const key of calorieKeys) {
          if (typeof food[key] === 'number') {
            calories = food[key];
            break;
          }
        }
      }
      return sum + calories;
    }, 0);
    
    const proteinIn = todayLog.foods.reduce((sum, food) => {
      let protein = 0;
      if (typeof food.protein === 'number') protein = food.protein;
      else if (food.nutrients?.protein) protein = food.nutrients.protein;
      else if (food.nutrients?.macros?.protein) protein = food.nutrients.macros.protein;
      else if (typeof food === 'object' && food !== null) {
        const proteinKeys = ['protein', 'proteins'];
        for (const key of proteinKeys) {
          if (typeof food[key] === 'number') {
            protein = food[key];
            break;
          }
        }
      }
      return sum + protein;
    }, 0);
    
    const carbsIn = todayLog.foods.reduce((sum, food) => {
      let carbs = 0;
      if (typeof food.carbs === 'number') carbs = food.carbs;
      else if (food.nutrients?.carbs) carbs = food.nutrients.carbs;
      else if (food.nutrients?.macros?.carbs) carbs = food.nutrients.macros.carbs;
      else if (typeof food === 'object' && food !== null) {
        const carbKeys = ['carbs', 'carbohydrates', 'carb'];
        for (const key of carbKeys) {
          if (typeof food[key] === 'number') {
            carbs = food[key];
            break;
          }
        }
      }
      return sum + carbs;
    }, 0);
    
    const fatIn = todayLog.foods.reduce((sum, food) => {
      let fat = 0;
      if (typeof food.fat === 'number') fat = food.fat;
      else if (food.nutrients?.fat) fat = food.nutrients.fat;
      else if (food.nutrients?.macros?.fat) food.nutrients.macros.fat;
      else if (typeof food === 'object' && food !== null) {
        const fatKeys = ['fat', 'fats', 'lipid'];
        for (const key of fatKeys) {
          if (typeof food[key] === 'number') {
            fat = food[key];
            break;
          }
        }
      }
      return sum + fat;
    }, 0);
    
    const fiberIn = todayLog.foods.reduce((sum, food) => {
      let fiber = 0;
      if (typeof food.fiber === 'number') fiber = food.fiber;
      else if (food.nutrients?.fiber) fiber = food.nutrients.fiber;
      else if (food.nutrients?.macros?.fiber) fiber = food.nutrients.macros.fiber;
      else if (typeof food === 'object' && food !== null) {
        const fiberKeys = ['fiber', 'fibers', 'dietary_fiber'];
        for (const key of fiberKeys) {
          if (typeof food[key] === 'number') {
            fiber = food[key];
            break;
          }
        }
      }
      return sum + fiber;
    }, 0);
    
    const exerciseBurn = todayLog.exercises.reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0);
    const waterIntake = todayLog.waterIntake || 0;

    console.log('RAG Service: Calculated nutrients:', { caloriesIn, proteinIn, carbsIn, fatIn, fiberIn });

    // Calculate nutritional percentages
    const totalCalories = caloriesIn || 1;
    const proteinPercent = Math.round((proteinIn * 4) / totalCalories * 100);
    const carbsPercent = Math.round((carbsIn * 4) / totalCalories * 100);
    const fatPercent = Math.round((fatIn * 9) / totalCalories * 100);

    // Calculate BMR and daily needs
    const bmr = this.calculateBMR(userData);
    const activityFactor = this.getActivityFactor(todayLog);
    const totalDailyEnergyExpenditure = Math.round(bmr * activityFactor);
    const netCalories = caloriesIn - exerciseBurn;

    // Calculate progress towards goals
    const weightDiff = userData.weight - goals.targetWeight;
    const weightGoalDirection = weightDiff > 0 ? 'loss' : weightDiff < 0 ? 'gain' : 'maintain';

    const context = {
      profile: {
        weight: userData.weight,
        height: userData.height,
        age: userData.age,
        gender: userData.gender,
        country: userData.country,
        goal: goals.weightGoal || 'maintain',
        targetWeight: goals.targetWeight,
        weightDiff: Math.abs(weightDiff),
        goalDirection: weightGoalDirection
      },
      today: {
        calories: caloriesIn,
        protein: proteinIn,
        carbs: carbsIn,
        fat: fatIn,
        fiber: fiberIn,
        exercise: exerciseBurn,
        water: waterIntake,
        meals: todayLog.foods.length,
        workouts: todayLog.exercises.length,
        netCalories: netCalories,
        nutritionBreakdown: {
          protein: proteinPercent,
          carbs: carbsPercent,
          fat: fatPercent
        }
      },
      goals: {
        targetWeight: goals.targetWeight,
        timeline: goals.goalTimeline,
        bmr: bmr,
        tdee: totalDailyEnergyExpenditure,
        calorieTarget: weightGoalDirection === 'loss' ? totalDailyEnergyExpenditure - 500 : 
                       weightGoalDirection === 'gain' ? totalDailyEnergyExpenditure + 300 : 
                       totalDailyEnergyExpenditure,
        proteinTarget: Math.round(userData.weight * 1.6), // Higher end for active people
        waterTarget: Math.round(userData.weight * 0.033 * 1000) // ml
      },
      progress: {
        calorieProgress: Math.round((netCalories / (totalDailyEnergyExpenditure - 500)) * 100),
        proteinProgress: Math.round((proteinIn / (userData.weight * 1.6)) * 100),
        waterProgress: Math.round((waterIntake / (userData.weight * 0.033 * 1000)) * 100)
      }
    };

    // Cache the context
    this.userContextCache.set(contextKey, {
      context,
      timestamp: Date.now()
    });

    return context;
  }

  /**
   * Generate response using enhanced RAG approach
   */
  async generateResponse(message, userContext) {
    try {
      // Special handling for coffee questions
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('coffee')) {
        return this.getCoffeeResponse(message, userContext);
      }
      
      // Step 1: Get relevant web content
      const webContent = await this.scrapeHealthContent(message);
      
      // Step 2: Retrieve relevant knowledge base (with user context for country-specific data)
      const relevantKnowledge = this.retrieveRelevantKnowledge(message, userContext);
      
      // Step 3: Generate highly contextual advice
      const contextualAdvice = this.generateEnhancedContextualAdvice(message, userContext);
      
      // Step 4: Combine and format response
      const response = this.formatEnhancedResponse(message, webContent, relevantKnowledge, contextualAdvice, userContext);
      
      return response;
    } catch (error) {
      console.error('RAG generation error:', error);
      return this.getEnhancedFallbackResponse(message, userContext);
    }
  }

  /**
   * Coffee-specific response handler
   */
  getCoffeeResponse(message, userContext) {
    const coffeeInfo = this.knowledgeBase.get('nutrition').coffee;
    
    let response = coffeeInfo;
    
    // Add some personalization based on user data
    if (userContext.today.exercise > 200) {
      response += ' Since you exercised today, coffee before workouts can enhance performance.';
    }
    
    if (userContext.progress.waterProgress < 50) {
      response += ' Remember that coffee is diuretic - drink extra water to stay hydrated.';
    }
    
    response += ' Would you like to know more about caffeine timing or alternatives?';
    
    return response;
  }

  /**
   * Retrieve relevant knowledge based on message and user context
   */
  retrieveRelevantKnowledge(message, userContext) {
    const lowerMessage = message.toLowerCase();
    const relevant = [];

    // Check nutrition knowledge
    const nutrition = this.knowledgeBase.get('nutrition');
    Object.keys(nutrition).forEach(key => {
      if (lowerMessage.includes(key)) {
        relevant.push({ type: 'nutrition', topic: key, content: nutrition[key] });
      }
    });

    // Specific coffee matching
    if (lowerMessage.includes('coffee')) {
      relevant.push({ type: 'nutrition', topic: 'coffee', content: nutrition.coffee });
    }

    // Check meal timing
    const mealTiming = this.knowledgeBase.get('meal_timing');
    Object.keys(mealTiming).forEach(key => {
      if (lowerMessage.includes(key)) {
        relevant.push({ type: 'meal_timing', topic: key, content: mealTiming[key] });
      }
    });

    // Check workout advice
    const workout = this.knowledgeBase.get('workout');
    Object.keys(workout).forEach(key => {
      if (lowerMessage.includes(key)) {
        relevant.push({ type: 'workout', topic: key, content: workout[key] });
      }
    });

    // Check mental health and lifestyle advice
    const mentalHealth = this.knowledgeBase.get('mental_health');
    Object.keys(mentalHealth).forEach(key => {
      if (lowerMessage.includes(key) || 
          lowerMessage.includes('stress') || 
          lowerMessage.includes('sleep') || 
          lowerMessage.includes('motivation') || 
          lowerMessage.includes('mindful')) {
        relevant.push({ type: 'mental_health', topic: key, content: mentalHealth[key] });
      }
    });

    // Check weight management advice
    const weightMgmt = this.knowledgeBase.get('weight_management');
    Object.keys(weightMgmt).forEach(key => {
      if (lowerMessage.includes(key)) {
        relevant.push({ type: 'weight_management', topic: key, content: weightMgmt[key] });
      }
    });

    // Check country-specific foods for food suggestions
    if (lowerMessage.includes('food') || lowerMessage.includes('suggest') || lowerMessage.includes('eat') || lowerMessage.includes('meal')) {
      const countryFoods = this.knowledgeBase.get('country_foods');
      let userCountry = userContext?.profile?.country || 'US'; // Default to US if no country
      
      // Map country codes to full names
      const countryMapping = {
        'US': 'US',
        'USA': 'US',
        'GB': 'UK',
        'UK': 'UK',
        'IN': 'India',
        'IND': 'India',
        'CN': 'China',
        'JP': 'Japan',
        'MX': 'Mexico',
        'BR': 'Brazil',
        'IT': 'Italy',
        'FR': 'France',
        'DE': 'Germany'
      };
      
      userCountry = countryMapping[userCountry] || userCountry;
      
      if (countryFoods[userCountry]) {
        const foods = countryFoods[userCountry];
        relevant.push({ 
          type: 'country_foods', 
          topic: userCountry, 
          content: `Based on your location (${userCountry}), here are local food options: Proteins: ${foods.proteins}. Carbs: ${foods.carbs}. Vegetables: ${foods.vegetables}. Fruits: ${foods.fruits}. Healthy snacks: ${foods.snacks}. Traditional healthy meals: ${foods.traditional}.` 
        });
      } else {
        // Fallback to US foods if country not found
        const foods = countryFoods.US;
        relevant.push({ 
          type: 'country_foods', 
          topic: 'default', 
          content: `Here are some healthy food options: Proteins: ${foods.proteins}. Carbs: ${foods.carbs}. Vegetables: ${foods.vegetables}. Fruits: ${foods.fruits}. Healthy snacks: ${foods.snacks}.` 
        });
      }
    }

    return relevant;
  }

  /**
   * Generate contextual advice based on user data
   */
  generateContextualAdvice(message, userContext) {
    const advice = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('water') || lowerMessage.includes('hydrate')) {
      const waterNeeded = userContext.profile.weight * 0.033; // 33ml per kg
      const waterProgress = (userContext.today.water / 1000 / waterNeeded) * 100;
      
      if (waterProgress < 50) {
        advice.push(`You've had ${userContext.today.water}ml today. Aim for ${Math.round(waterNeeded * 1000)}ml total.`);
      } else if (waterProgress >= 100) {
        advice.push(`Great job! You've reached your water goal of ${Math.round(waterNeeded * 1000)}ml.`);
      } else {
        advice.push(`You're at ${Math.round(waterProgress)}% of your water goal. Keep it up!`);
      }
    }

    if (lowerMessage.includes('protein')) {
      const proteinNeeded = userContext.profile.weight * 1.2; // 1.2g per kg
      const proteinProgress = (userContext.today.protein / proteinNeeded) * 100;
      
      if (proteinProgress < 50) {
        advice.push(`You've had ${userContext.today.protein}g protein today. Try to reach ${Math.round(proteinNeeded)}g.`);
      } else if (proteinProgress >= 100) {
        advice.push(`Excellent! You've hit your protein target of ${Math.round(proteinNeeded)}g.`);
      } else {
        advice.push(`Good progress on protein! You're at ${Math.round(userContext.today.protein)}g of ${Math.round(proteinNeeded)}g.`);
      }
    }

    if (lowerMessage.includes('calorie') || lowerMessage.includes('food')) {
      const bmr = this.calculateBMR(userContext.profile);
      const caloriesNeeded = bmr + (userContext.today.exercise || 0);
      
      if (userContext.today.calories < caloriesNeeded * 0.8) {
        advice.push(`You're under your calorie target. Consider adding healthy snacks.`);
      } else if (userContext.today.calories > caloriesNeeded * 1.2) {
        advice.push(`You're over your calorie target. Focus on portion control for remaining meals.`);
      } else {
        advice.push(`Your calorie intake looks balanced for today.`);
      }
    }

    if (lowerMessage.includes('weight') || lowerMessage.includes('goal')) {
      const weightDiff = userContext.profile.weight - userContext.goals.targetWeight;
      if (Math.abs(weightDiff) > 1) {
        const direction = weightDiff > 0 ? 'lose' : 'gain';
        advice.push(`You need to ${direction} ${Math.abs(weightDiff)}kg to reach your goal of ${userContext.goals.targetWeight}kg.`);
      } else {
        advice.push(`You're very close to your target weight! Keep up the great work.`);
      }
    }

    return advice;
  }

  /**
   * Calculate BMR using Mifflin-St Jeor equation
   */
  calculateBMR(profile) {
    const { weight, height, age, gender } = profile;
    const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);
    return Math.round(bmr);
  }

  /**
   * Format the final response
   */
  formatResponse(message, knowledge, contextualAdvice, userContext) {
    let response = '';

    // Add contextual advice first (most personalized)
    if (contextualAdvice.length > 0) {
      response += contextualAdvice.join(' ') + ' ';
    }

    // Add relevant knowledge
    if (knowledge.length > 0) {
      const knowledgeText = knowledge.map(k => k.content).join(' ');
      response += knowledgeText;
    }

    // Add friendly closing
    if (!response) {
      response = this.getFallbackResponse(message);
    } else {
      response += ' Is there anything specific about this you\'d like to know more about?';
    }

    return response.trim();
  }

  /**
   * Fallback response for unrecognized queries
   */
  getFallbackResponse(message) {
    const fallbacks = [
      "I can help with nutrition, exercise, and health goals. Try asking about water intake, protein needs, or workout suggestions!",
      "Based on your health data, I can provide personalized advice. Ask me about your daily progress or nutrition goals!",
      "I'm here to help with your health journey! Try asking about meal timing, exercise routines, or hydration tips."
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  /**
   * Get activity factor based on exercise data
   */
  getActivityFactor(todayLog) {
    const exerciseCalories = todayLog.exercises?.reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0) || 0;
    
    if (exerciseCalories > 500) return 1.725; // Very active
    if (exerciseCalories > 250) return 1.55;  // Moderately active
    if (exerciseCalories > 0) return 1.375;   // Lightly active
    return 1.2; // Sedentary
  }

  /**
   * Enhanced contextual advice generation
   */
  generateEnhancedContextualAdvice(message, userContext) {
    const advice = [];
    const lowerMessage = message.toLowerCase();

    // Water advice with detailed context
    if (lowerMessage.includes('water') || lowerMessage.includes('hydrate')) {
      const waterProgress = userContext.progress.waterProgress;
      const waterTarget = userContext.goals.waterTarget;
      const currentWater = userContext.today.water;
      
      if (waterProgress < 50) {
        advice.push(`You've had ${currentWater}ml water today (${waterProgress}% of goal). Try to reach ${waterTarget}ml. Keep a water bottle nearby as a reminder!`);
      } else if (waterProgress >= 100) {
        advice.push(`Excellent hydration! You've reached your ${waterTarget}ml water goal. Your body is well-hydrated for optimal performance.`);
      } else {
        advice.push(`Good progress on hydration! You're at ${currentWater}ml (${waterProgress}% of ${waterTarget}ml goal). Keep it up!`);
      }
      
      // Add exercise-specific advice
      if (userContext.today.exercise > 300) {
        advice.push('Since you exercised today, consider an extra 500ml to replace fluids lost through sweat.');
      }
    }

    // Protein advice with detailed context
    if (lowerMessage.includes('protein')) {
      const proteinProgress = userContext.progress.proteinProgress;
      const proteinTarget = userContext.goals.proteinTarget;
      const currentProtein = userContext.today.protein;
      
      if (proteinProgress < 50) {
        advice.push(`You've had ${currentProtein}g protein today (${proteinProgress}% of ${proteinTarget}g goal). Consider adding: Greek yogurt, eggs, chicken, or legumes to reach your target.`);
      } else if (proteinProgress >= 100) {
        advice.push(`Perfect! You've hit your protein goal of ${proteinTarget}g. This supports muscle maintenance and satiety.`);
      } else {
        advice.push(`Great protein intake! You're at ${currentProtein}g (${proteinProgress}% of goal). Consider a protein-rich snack if you need more.`);
      }
      
      // Add goal-specific advice
      if (userContext.profile.goalDirection === 'gain') {
        advice.push('For muscle gain, aim for the higher end of your protein range, especially after workouts.');
      }
    }

    // Calorie and nutrition advice (but not for coffee)
    if ((lowerMessage.includes('calorie') || lowerMessage.includes('food') || lowerMessage.includes('eat')) && !lowerMessage.includes('coffee')) {
      const netCalories = userContext.today.calories;
      const calorieTarget = userContext.goals.calorieTarget;
      const exerciseCalories = userContext.today.exercise;
      
      if (userContext.today.meals === 0) {
        advice.push(`I don't see any foods logged yet today. Start by logging your meals to get personalized nutrition advice!`);
      } else {
        advice.push(`Today's nutrition: ${netCalories} calories consumed, ${exerciseCalories} burned through exercise.`);
        
        // Only show macronutrient breakdown if we have actual data
        const { protein, carbs, fat } = userContext.today.nutritionBreakdown;
        if (protein > 0 || carbs > 0 || fat > 0) {
          advice.push(`Macronutrient breakdown: Protein ${protein}%, Carbs ${carbs}%, Fat ${fat}%`);
          
          if (protein < 20) {
            advice.push('Consider increasing protein intake for better satiety and muscle maintenance.');
          }
          if (fat < 20) {
            advice.push('Include healthy fats from nuts, seeds, or avocado for hormone function and vitamin absorption.');
          }
        } else {
          advice.push('For detailed macronutrient analysis, make sure your food entries include nutritional information.');
        }
        
        // Goal-specific calorie advice
        if (userContext.profile.goalDirection === 'loss' && netCalories > calorieTarget) {
          advice.push(`For weight loss, try to stay around ${calorieTarget} calories. Consider portion control or lower-calorie snacks.`);
        } else if (userContext.profile.goalDirection === 'gain' && netCalories < calorieTarget) {
          advice.push(`For healthy weight gain, aim for ${calorieTarget} calories. Add nutrient-dense foods like nuts, avocado, or whole grains.`);
        }
      }
    }

    // Exercise advice
    if (lowerMessage.includes('exercise') || lowerMessage.includes('workout') || lowerMessage.includes('activity')) {
      const exerciseCalories = userContext.today.exercise;
      const workouts = userContext.today.workouts;
      
      if (workouts === 0) {
        advice.push('No exercise logged yet today. Even a 15-minute walk can boost your mood and metabolism!');
      } else if (workouts === 1) {
        advice.push(`Great job getting ${workouts} workout in today! ${exerciseCalories} calories burned.`);
      } else {
        advice.push(`Excellent! ${workouts} workouts today with ${exerciseCalories} calories burned. Don\'t forget to recover properly.`);
      }
      
      // Add goal-specific exercise advice
      if (userContext.profile.goalDirection === 'loss') {
        advice.push('For weight loss, combine cardio with strength training for optimal results.');
      } else if (userContext.profile.goalDirection === 'gain') {
        advice.push('For muscle gain, focus on progressive strength training with adequate protein intake.');
      }
    }

    // Weight and goal progress advice
    if (lowerMessage.includes('weight') || lowerMessage.includes('goal') || lowerMessage.includes('progress')) {
      const weightDiff = userContext.profile.weightDiff;
      const goalDirection = userContext.profile.goalDirection;
      
      if (weightDiff > 2) {
        advice.push(`You need to ${goalDirection} ${weightDiff}kg to reach your target of ${userContext.goals.targetWeight}kg. Stay consistent with your nutrition and exercise!`);
      } else if (weightDiff <= 2 && weightDiff > 0) {
        advice.push(`You're very close to your goal! Just ${weightDiff}kg to go. Keep up the great work!`);
      } else {
        advice.push(`You're at or very close to your target weight! Focus on maintaining these healthy habits.`);
      }
      
      // Add timeline context
      if (userContext.goals.timeline > 0) {
        advice.push(`With your current timeline of ${userContext.goals.timeline} weeks, you're on track for sustainable progress.`);
      }
    }

    return advice;
  }

  /**
   * Enhanced response formatting
   */
  formatEnhancedResponse(message, webContent, knowledge, contextualAdvice, userContext) {
    let response = '';

    // Start with most personalized advice
    if (contextualAdvice.length > 0) {
      response += contextualAdvice.join(' ') + ' ';
    }

    // Add web-scraped content
    if (webContent) {
      response += webContent + ' ';
    }

    // Add knowledge base content
    if (knowledge.length > 0) {
      const knowledgeText = knowledge.map(k => k.content).join(' ');
      response += knowledgeText + ' ';
    }

    // Add engaging closing
    if (!response) {
      response = this.getEnhancedFallbackResponse(message, userContext);
    } else {
      const closings = [
        'Would you like specific meal suggestions or workout ideas?',
        'How can I help you implement this advice in your daily routine?',
        'Is there a particular aspect of this you\'d like to explore further?',
        'What other health questions can I help you with today?'
      ];
      response += closings[Math.floor(Math.random() * closings.length)];
    }

    return response.trim();
  }

  /**
   * Enhanced fallback response
   */
  getEnhancedFallbackResponse(message, userContext) {
    const fallbacks = [
      `Based on your current progress (${userContext.today.meals} meals logged, ${userContext.today.workouts} workouts), I can help optimize your nutrition and fitness routine. What specific area would you like to focus on?`,
      `I see you're working towards ${userContext.profile.goalDirection === 'loss' ? 'weight loss' : userContext.profile.goalDirection === 'gain' ? 'muscle gain' : 'maintenance'}. Ask me about meal planning, workout routines, or progress tracking!`,
      `Your hydration is at ${userContext.progress.waterProgress}% and protein at ${userContext.progress.proteinProgress}%. I can provide personalized advice to help you reach your health goals!`
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  /**
   * Clear user context cache
   */
  clearUserCache(email) {
    this.userContextCache.delete(email);
    console.log('RAG Service: Cleared cache for user:', email);
  }

  /**
   * Clear all caches (for testing/debugging)
   */
  clearAllCaches() {
    this.userContextCache.clear();
    console.log('RAG Service: Cleared all user caches');
  }
}

module.exports = RAGService;
