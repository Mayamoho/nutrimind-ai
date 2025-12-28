# Meal Planner Design Patterns

## Overview
The Meal Planner feature uses rule-based logic instead of AI to avoid rate limits and provide instant, reliable meal and workout plans. It implements multiple design patterns for maintainability and extensibility.

## Design Patterns Implemented

### 1. Strategy Pattern
**Purpose**: Define different meal planning algorithms for different goals

**Implementation**:
- `MealPlanStrategy` - Abstract strategy interface
- `WeightLossPlanStrategy` - Concrete strategy for weight loss
- `WeightGainPlanStrategy` - Concrete strategy for weight gain
- `MaintenancePlanStrategy` - Concrete strategy for maintenance

**Benefits**:
- Easy to add new goal types without modifying existing code
- Each strategy is independent and testable
- Runtime strategy selection based on user goals

```javascript
// Example usage
const strategy = MealPlanFactory.createStrategy('lose');
const plan = strategy.generatePlan(userProfile, preferences);
```

### 2. Factory Pattern
**Purpose**: Create appropriate strategy based on user's weight goal

**Implementation**:
```javascript
class MealPlanFactory {
  static createStrategy(weightGoal) {
    switch (weightGoal) {
      case 'lose': return new WeightLossPlanStrategy();
      case 'gain': return new WeightGainPlanStrategy();
      case 'maintain': return new MaintenancePlanStrategy();
    }
  }
}
```

**Benefits**:
- Centralized object creation
- Decouples client code from concrete classes
- Easy to extend with new strategies

### 3. Singleton Pattern
**Purpose**: Ensure single instance of MealPlannerService with shared cache

**Implementation**:
```javascript
class MealPlannerService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }
}

module.exports = new MealPlannerService(); // Export singleton instance
```

**Benefits**:
- Shared cache across all requests
- Reduced memory usage
- Consistent state management

### 4. Cache Pattern
**Purpose**: Store generated plans temporarily to reduce computation

**Implementation**:
```javascript
_getFromCache(key) {
  const cached = this.cache.get(key);
  if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
    return cached.data;
  }
  return null;
}

_setCache(key, data) {
  this.cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}
```

**Benefits**:
- Instant response for repeated requests
- Reduced server load
- Automatic cache expiration

### 5. Template Method Pattern
**Purpose**: Define skeleton of meal generation with customizable steps

**Implementation**:
Each strategy implements common methods:
- `_getBreakfast(country, calories)`
- `_getLunch(country, calories, type)`
- `_getDinner(country, calories, type)`
- `_getSnack(country, calories)`

**Benefits**:
- Consistent structure across strategies
- Reusable meal generation logic
- Easy to customize per country/culture

## Architecture

```
┌─────────────────────────────────────────┐
│         Frontend Component              │
│      (PersonalizedPlanner.tsx)          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│          API Service                    │
│  getDailyMealPlan()                     │
│  getWeeklyMealPlan()                    │
│  getWorkoutPlan()                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Backend Routes                    │
│    (backend/routes/planner.js)          │
│  - Fetch user profile                   │
│  - Calculate BMR & goals                │
│  - Call service                         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    MealPlannerService (Singleton)       │
│  - Check cache                          │
│  - Create strategy (Factory)            │
│  - Generate plan (Strategy)             │
│  - Store in cache                       │
└─────────────────────────────────────────┘
```

## Data Flow

1. **User clicks "Generate Plan"**
2. **Frontend** calls appropriate API endpoint
3. **Backend** fetches user profile and goals from database
4. **Backend** calculates BMR and goal calories
5. **Service** checks cache for existing plan
6. **Factory** creates appropriate strategy based on goal
7. **Strategy** generates meal/workout plan with country-specific options
8. **Service** caches the result
9. **Backend** returns plan to frontend
10. **Frontend** displays plan with tips

## Extensibility

### Adding a New Goal Type
```javascript
// 1. Create new strategy
class AthleteStrategy extends MealPlanStrategy {
  generatePlan(userProfile, preferences) {
    // High protein, high calorie plan
  }
}

// 2. Update factory
case 'athlete':
  return new AthleteStrategy();
```

### Adding a New Country
```javascript
// Update meal methods in strategies
_getBreakfast(country, calories) {
  const breakfasts = {
    India: '...',
    USA: '...',
    Japan: 'Miso soup with rice and grilled fish', // New
    default: '...',
  };
  return breakfasts[country] || breakfasts.default;
}
```

### Adding Dietary Restrictions
```javascript
// Extend strategy with filters
class VegetarianStrategy extends WeightLossPlanStrategy {
  generatePlan(userProfile, preferences) {
    const plan = super.generatePlan(userProfile, preferences);
    return this._filterNonVegetarian(plan);
  }
}
```

## Benefits Over AI Approach

1. **No Rate Limits**: Instant response, no API quotas
2. **Predictable**: Same input always gives same output
3. **Fast**: No network calls to external AI services
4. **Reliable**: No dependency on third-party services
5. **Cacheable**: Results can be cached effectively
6. **Testable**: Easy to unit test each strategy
7. **Maintainable**: Clear separation of concerns
8. **Extensible**: Easy to add new goals, countries, or restrictions

## Future Enhancements

1. **Adapter Pattern**: Integrate with nutrition APIs for real-time data
2. **Decorator Pattern**: Add dietary restrictions as decorators
3. **Observer Pattern**: Notify users when new meal plans are available
4. **Builder Pattern**: Complex meal plan construction with multiple options
5. **Command Pattern**: Undo/redo meal plan modifications
