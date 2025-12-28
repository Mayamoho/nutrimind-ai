# Achievement System - Design Patterns Implementation

This module implements a **Smart Achievement & Gamification System** for NutriMind AI, demonstrating the practical application of multiple software design patterns working together.

## Why This Feature?

Users need **motivation and engagement** to maintain healthy habits. The achievement system addresses this by:
- 🏆 Rewarding consistent behavior with achievements
- 🔥 Tracking streaks to encourage daily logging
- 📈 Providing visual progress indicators
- 🎮 Gamifying the health journey with levels and points

## Design Patterns Used

### 1. Observer Pattern (`Observer.ts`)

**Purpose:** Allows achievement events to notify multiple subscribers (UI updates, notifications, analytics).

```typescript
// Subject notifies all observers when achievement is unlocked
achievementSubject.notify({
  type: 'unlocked',
  achievement: newAchievement,
  timestamp: new Date()
});

// Multiple observers react to the same event
class UINotificationObserver implements Observer<AchievementEvent> {
  update(data: AchievementEvent): void {
    // Show toast notification
  }
}

class AnalyticsObserver implements Observer<AchievementEvent> {
  update(data: AchievementEvent): void {
    // Track analytics event
  }
}
```

**Benefits:**
- Loose coupling between event source and handlers
- Easy to add new notification channels
- Single responsibility for each observer

---

### 2. Factory Pattern (`Factory.ts`)

**Purpose:** Creates different types of achievements dynamically based on category and tier.

```typescript
// Abstract Factory creates achievements by category
const factory = AchievementFactoryCreator.getFactory('consistency');
const achievement = factory.createAchievement('gold');

// Concrete factories for each category
class StreakAchievementFactory implements AchievementFactory {
  createAchievement(tier: AchievementTier): AchievementDefinition {
    // Creates streak-based achievements
  }
}

class CalorieMilestoneFactory implements AchievementFactory {
  createAchievement(tier: AchievementTier): AchievementDefinition {
    // Creates calorie milestone achievements
  }
}
```

**Benefits:**
- Encapsulates object creation logic
- Easy to add new achievement categories
- Consistent achievement structure across types

---

### 3. Strategy Pattern (`Strategy.ts`)

**Purpose:** Different algorithms for calculating achievement progress and unlock conditions.

```typescript
// Strategy interface
interface AchievementStrategy {
  calculateProgress(logs: DailyLog[], goals: UserGoals): number;
  checkUnlocked(progress: number, target: number): boolean;
}

// Different strategies for different achievement types
class StreakStrategy implements AchievementStrategy {
  calculateProgress(logs: DailyLog[]): number {
    // Count consecutive days with activity
  }
}

class CalorieMilestoneStrategy implements AchievementStrategy {
  calculateProgress(logs: DailyLog[]): number {
    // Sum total calories logged
  }
}

// Context uses strategy
const calculator = new AchievementCalculator(new StreakStrategy(7));
const result = calculator.calculate(logs, goals);
```

**Benefits:**
- Algorithms can be swapped at runtime
- Easy to add new calculation methods
- Separates algorithm from context

---

### 4. Singleton Pattern (`Singleton.ts`)

**Purpose:** Single instance of achievement manager across the application.

```typescript
class AchievementManager {
  private static instance: AchievementManager | null = null;
  
  private constructor() {
    // Initialize achievements
  }

  public static getInstance(): AchievementManager {
    if (!AchievementManager.instance) {
      AchievementManager.instance = new AchievementManager();
    }
    return AchievementManager.instance;
  }
}

// Usage anywhere in the app
const manager = AchievementManager.getInstance();
```

**Benefits:**
- Centralized state management
- Consistent access point across components
- Controlled initialization

---

### 5. Command Pattern (`Command.ts`)

**Purpose:** Encapsulates user actions that trigger achievement checks.

```typescript
// Command interface
interface AchievementCommand {
  execute(): Achievement[];
  getDescription(): string;
}

// Concrete commands for different actions
class FoodLoggedCommand implements AchievementCommand {
  execute(): Achievement[] {
    return this.manager.checkAchievements(this.logs, this.goals);
  }
}

// Invoker stores and executes commands
const invoker = new AchievementInvoker();
invoker.executeCommand(new FoodLoggedCommand(logs, goals, food));

// Can retrieve history
const history = invoker.getHistory();
```

**Benefits:**
- Decouples action from execution
- Enables action history/logging
- Supports undo/redo (extensible)

---

### 6. Decorator Pattern (`Decorator.ts`)

**Purpose:** Adds bonus multipliers and special effects to achievements dynamically.

```typescript
// Base component
let reward: AchievementReward = new BaseAchievementReward(achievement);

// Wrap with decorators based on context
if (isFirstTime) {
  reward = new FirstTimeBonus(reward);  // 1.5x points
}

if (streakDays > 0) {
  reward = new StreakMultiplier(reward, streakDays);  // Up to 50% bonus
}

reward = new WeekendBonus(reward);  // 25% weekend bonus

if (isPerfectDay) {
  reward = new PerfectDayBonus(reward, true);  // 2x points
}

// Final points include all bonuses
const totalPoints = reward.getPoints();
```

**Benefits:**
- Flexible bonus combinations
- Open for extension, closed for modification
- Bonuses can be added/removed dynamically

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     AchievementContext                          │
│  (React Context - integrates all patterns)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AchievementManager (Singleton)                │
│  - Coordinates all achievement operations                       │
│  - Maintains user state                                         │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Factory Pattern │  │ Strategy Pattern│  │ Observer Pattern│
│ Creates         │  │ Calculates      │  │ Notifies        │
│ achievements    │  │ progress        │  │ subscribers     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Command Pattern │  │Decorator Pattern│  │ UI Components   │
│ Tracks user     │  │ Applies bonus   │  │ Display         │
│ actions         │  │ multipliers     │  │ achievements    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Achievement Categories

| Category    | Icon | Description                          | Tiers                    |
|-------------|------|--------------------------------------|--------------------------|
| Consistency | 🔥   | Streak-based achievements            | 3, 7, 14, 30, 100 days   |
| Nutrition   | 🍎   | Total calories tracked               | 10K to 1M calories       |
| Exercise    | 💪   | Exercise sessions completed          | 5 to 250 sessions        |
| Hydration   | 💧   | Days meeting water goal              | 3 to 60 days             |

## Tier System

| Tier     | Color Gradient                    | Point Multiplier |
|----------|-----------------------------------|------------------|
| Bronze   | Amber                             | 1x               |
| Silver   | Slate                             | 1x               |
| Gold     | Yellow                            | 1x               |
| Platinum | Cyan                              | 1x               |
| Diamond  | Purple → Pink → Blue              | 1x               |

## Bonus System (Decorator Pattern)

| Bonus Type      | Condition                    | Multiplier |
|-----------------|------------------------------|------------|
| First Time      | First achievement ever       | 1.5x       |
| Streak          | Per day of current streak    | +5% (max 50%) |
| Weekend Warrior | Unlocked on Sat/Sun          | 1.25x      |
| Perfect Day     | Food + Exercise + Water goal | 2x         |

## Usage

```tsx
// In any component
import { useAchievements } from '../contexts/AchievementContext';

const MyComponent = () => {
  const { 
    state,           // User's achievement state
    allAchievements, // All available achievements
    nextAchievement, // Closest to unlocking
    checkAchievements,
    onFoodLogged,
    onExerciseLogged,
    onWaterLogged
  } = useAchievements();

  // Trigger achievement check after logging food
  const handleFoodLog = (food) => {
    onFoodLogged(dailyLogs, userGoals, food);
  };

  return (
    <div>
      <p>Level: {state.level}</p>
      <p>Points: {state.totalPoints}</p>
      <p>Streak: {state.currentStreak} days</p>
    </div>
  );
};
```

## File Structure

```
patterns/
├── Observer.ts      # Observer pattern implementation
├── Factory.ts       # Factory pattern implementation
├── Strategy.ts      # Strategy pattern implementation
├── Singleton.ts     # Singleton pattern implementation
├── Command.ts       # Command pattern implementation
├── Decorator.ts     # Decorator pattern implementation
├── index.ts         # Central exports
└── README.md        # This documentation

components/
├── AchievementWidget.tsx           # Compact dashboard widget
├── AchievementPanel.tsx            # Full achievement view
├── AchievementBadge.tsx            # Individual badge display
├── AchievementNotification.tsx     # Unlock popup
└── AchievementNotificationContainer.tsx

contexts/
└── AchievementContext.tsx          # React context integration
```

## Extensibility

The pattern-based architecture makes it easy to extend:

1. **New Achievement Category:** Create a new factory class
2. **New Calculation Method:** Implement a new strategy
3. **New Bonus Type:** Create a new decorator
4. **New Notification Channel:** Add a new observer
5. **New User Action:** Create a new command class

---

# Additional Features - Design Patterns

## Feature 2: Body Metrics Tracker (`BodyMetrics.ts`)

Track body measurements over time with history and progress calculation.

### Memento Pattern
Saves and restores body measurement snapshots for undo/history functionality.

```typescript
// Memento stores measurement state
class MeasurementMemento {
  private readonly state: BodyMeasurement;
  getState(): BodyMeasurement { return { ...this.state }; }
}

// Originator creates/restores mementos
class MeasurementOriginator {
  save(): MeasurementMemento { return new MeasurementMemento(this.current); }
  restore(memento: MeasurementMemento): void { this.current = memento.getState(); }
}

// Caretaker manages history
class MeasurementHistory {
  backup(): void { this.mementos.push(this.originator.save()); }
  undo(): BodyMeasurement | null { /* restore previous */ }
}
```

### Iterator Pattern
Traverses measurement history with filtering capabilities.

```typescript
class MeasurementIterator implements Iterator<BodyMeasurement> {
  hasNext(): boolean { return this.position < this.mementos.length; }
  next(): BodyMeasurement | null { return this.mementos[this.position++].getState(); }
  getRange(startDate: string, endDate: string): BodyMeasurement[] { /* filter by date */ }
}
```

---

## Feature 3: Workout Routines (`WorkoutRoutine.ts`)

Pre-defined and custom exercise routines with structured execution.

### Composite Pattern
Builds workout routines from individual exercises as a tree structure.

```typescript
// Component interface
interface WorkoutComponent {
  getName(): string;
  getDuration(): number;
  getCalories(): number;
}

// Leaf - Single Exercise
class Exercise implements WorkoutComponent { ... }

// Composite - Routine containing exercises
class WorkoutRoutine implements WorkoutComponent {
  add(exercise: WorkoutComponent): void { this.exercises.push(exercise); }
  getDuration(): number { return this.exercises.reduce((sum, e) => sum + e.getDuration(), 0); }
}
```

### Template Method Pattern
Defines workout execution structure with customizable steps.

```typescript
abstract class WorkoutTemplate {
  // Template method - fixed algorithm structure
  performWorkout(): WorkoutLog {
    this.warmUp(log);      // Hook - can override
    this.mainWorkout(log); // Abstract - must implement
    this.coolDown(log);    // Hook - can override
    return log;
  }
  protected abstract mainWorkout(log: WorkoutLog): void;
}

class CardioWorkout extends WorkoutTemplate {
  protected mainWorkout(log: WorkoutLog): void { /* cardio exercises */ }
}
```

---

## Feature 4: Nutrition Analytics (`NutritionAnalytics.ts`)

Weekly/monthly nutrition insights with personalized recommendations.

### Strategy Pattern
Different analysis algorithms for various nutrition metrics.

```typescript
interface AnalysisStrategy {
  analyze(logs: DailyLog[], targetCalories: number): NutritionInsight[];
}

class CalorieAnalysisStrategy implements AnalysisStrategy { /* calorie tracking */ }
class MacroBalanceStrategy implements AnalysisStrategy { /* macro distribution */ }
class ConsistencyStrategy implements AnalysisStrategy { /* logging consistency */ }

// Context uses strategies
class NutritionAnalyzer {
  addStrategy(strategy: AnalysisStrategy): void { this.strategies.push(strategy); }
  analyze(logs: DailyLog[]): AnalyticsReport { /* run all strategies */ }
}
```

### Chain of Responsibility Pattern
Processes nutrition data through a chain of insight handlers.

```typescript
abstract class InsightHandler {
  setNext(handler: InsightHandler): InsightHandler { this.next = handler; return handler; }
  handle(logs: DailyLog[], insights: NutritionInsight[]): NutritionInsight[] {
    const result = this.process(logs, insights);
    return this.next ? this.next.handle(logs, result) : result;
  }
}

class MealTimingHandler extends InsightHandler { /* breakfast analysis */ }
class HydrationHandler extends InsightHandler { /* water intake */ }
class ExerciseBalanceHandler extends InsightHandler { /* activity level */ }

// Build chain
mealHandler.setNext(hydrationHandler).setNext(exerciseHandler);
```

---

## Complete Pattern Summary

| Feature | Patterns Used | Purpose |
|---------|--------------|---------|
| Achievement System | Observer, Factory, Strategy, Singleton, Command, Decorator | Gamification & rewards |
| Goal Calculation | Strategy | Different calorie/macro calculation algorithms |
| Progress Tracking | State | Daily progress state management |
| Nutrition Insights | Builder | Comprehensive daily insights reports |

**Total: 8 Design Patterns implemented across core features**

---

## New Patterns Added

### 7. State Pattern (`ProgressState.ts`)

**Purpose:** Manages daily progress states and transitions based on user activity.

```typescript
// State types
type ProgressStateType = 
  | 'not_started'
  | 'under_target'
  | 'on_track'
  | 'near_target'
  | 'target_reached'
  | 'over_target'
  | 'excellent';

// State Machine evaluates progress
const stateMachine = getProgressStateMachine();
const stateInfo = stateMachine.evaluateProgress(dailyProgress, todayLog);

// Returns contextual information
console.log(stateInfo.message);      // "On track for your goals!"
console.log(stateInfo.encouragement); // "Great progress! You're doing well"
console.log(stateInfo.nextAction);    // "Continue with balanced meals"
```

**Benefits:**
- Clear state transitions
- Contextual messaging based on progress
- Time-based motivational messages

---

### 8. Builder Pattern (`InsightsBuilder.ts`)

**Purpose:** Constructs complex nutrition insights reports step by step.

```typescript
// Builder constructs insights incrementally
const report = new InsightsBuilder()
  .reset()
  .setProgress(dailyProgress)
  .setTodayLog(todayLog)
  .setGoals(userGoals)
  .analyzeCalories()
  .analyzeProtein()
  .analyzeCarbs()
  .analyzeFat()
  .analyzeWater()
  .analyzeExercise()
  .analyzeWeightTrend()
  .analyzeStreak()
  .build();

// Director provides common configurations
const director = getInsightsDirector();
const fullReport = director.buildDailyReport(progress, log, goals, weightLog, dailyLogs);
const quickReport = director.buildQuickReport(progress, log);
```

**Benefits:**
- Step-by-step construction of complex objects
- Different report configurations via Director
- Reusable analysis components

---

### Goal Strategy Pattern (`GoalStrategy.ts`)

**Purpose:** Different algorithms for calculating calorie and macro targets.

```typescript
// Available strategies
const strategies = [
  'standard_loss',    // 500 cal deficit
  'aggressive_loss',  // Up to 1000 cal deficit
  'muscle_gain',      // 300 cal surplus
  'maintenance',      // TDEE maintenance
  'keto',             // Very low carb
];

// Context manages strategy selection
const context = getGoalStrategyContext();
context.autoSelectStrategy(userGoals);  // Auto-select based on goals
// OR
context.setStrategy('keto');  // Manual selection

const targets = context.calculateTargets(user, goals);
// Returns: { calories: 1800, macros: { protein: 140, carbs: 25, fat: 140 }, strategy: 'Ketogenic' }
```

**Benefits:**
- Multiple diet approaches supported
- Easy to add new strategies
- Auto-selection based on user goals
