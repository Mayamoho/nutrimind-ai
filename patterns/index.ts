/**
 * Design Patterns Index
 * Central export for all design pattern implementations
 * 
 * This module demonstrates the following software design patterns:
 * 
 * 1. OBSERVER PATTERN (Observer.ts)
 *    - Purpose: Allows achievement events to notify multiple subscribers
 *    - Components: AchievementSubject, UINotificationObserver, AnalyticsObserver
 *    - Use Case: When an achievement is unlocked, notify UI, analytics, and sound systems
 * 
 * 2. FACTORY PATTERN (Factory.ts)
 *    - Purpose: Creates different types of achievements dynamically
 *    - Components: AchievementFactory, StreakAchievementFactory, CalorieMilestoneFactory, etc.
 *    - Use Case: Generate achievements for different categories (streaks, nutrition, exercise)
 * 
 * 3. STRATEGY PATTERN (Strategy.ts, GoalStrategy.ts, LeaderboardStrategy.ts)
 *    - Purpose: Different algorithms for calculating achievement progress, goal targets, and leaderboard rankings
 *    - Components: AchievementStrategy, GoalCalculationStrategy, RankingStrategy, various concrete strategies
 *    - Use Case: Calculate progress differently for streak vs milestone achievements
 *    - Use Case: Different calorie/macro calculations for weight loss, muscle gain, keto, etc.
 *    - Use Case: Different ranking criteria for leaderboard (points, streaks, calories, etc.)
 * 
 * 4. SINGLETON PATTERN (Singleton.ts)
 *    - Purpose: Single instance of achievement manager across the application
 *    - Components: AchievementManager
 *    - Use Case: Centralized state management for all achievements
 * 
 * 5. COMMAND PATTERN (Command.ts)
 *    - Purpose: Encapsulate user actions that trigger achievement checks
 *    - Components: AchievementCommand, FoodLoggedCommand, ExerciseLoggedCommand, etc.
 *    - Use Case: Track and replay user actions, maintain action history
 * 
 * 6. DECORATOR PATTERN (Decorator.ts)
 *    - Purpose: Add bonus multipliers and special effects to achievements
 *    - Components: AchievementDecorator, FirstTimeBonus, StreakMultiplier, etc.
 *    - Use Case: Apply dynamic bonuses based on context (weekend, streak, perfect day)
 * 
 * 7. STATE PATTERN (ProgressState.ts)
 *    - Purpose: Manage daily progress states and transitions
 *    - Components: ProgressStateMachine, various state classes
 *    - Use Case: Track user's daily progress state (not_started, on_track, target_reached, etc.)
 * 
 * 8. BUILDER PATTERN (InsightsBuilder.ts)
 *    - Purpose: Construct complex nutrition insights reports step by step
 *    - Components: InsightsBuilder, InsightsDirector
 *    - Use Case: Build comprehensive daily nutrition analysis with multiple metrics
 * 
 * 9. FACADE PATTERN (LeaderboardStrategy.ts - backend)
 *    - Purpose: Simple API interface hiding complex aggregation logic
 *    - Components: Leaderboard API routes
 *    - Use Case: Aggregate user data from multiple tables for leaderboard display
 */

// Observer Pattern
export {
  AchievementSubject,
  UINotificationObserver,
  AnalyticsObserver,
  type Observer,
  type Subject,
  type AchievementEvent,
  type Achievement,
  type AchievementCategory,
  type AchievementTier
} from './Observer';

// Factory Pattern
export {
  AchievementFactoryCreator,
  StreakAchievementFactory,
  CalorieMilestoneFactory,
  ExerciseAchievementFactory,
  HydrationAchievementFactory,
  type AchievementFactory,
  type AchievementDefinition
} from './Factory';

// Strategy Pattern (Achievements)
export {
  AchievementCalculator,
  StreakStrategy,
  CalorieMilestoneStrategy,
  ExerciseMilestoneStrategy,
  GoalAchievementStrategy,
  HydrationStrategy,
  type AchievementStrategy
} from './Strategy';

// Strategy Pattern (Goals)
export {
  GoalStrategyContext,
  StandardWeightLossStrategy,
  AggressiveWeightLossStrategy,
  MuscleGainStrategy,
  MaintenanceStrategy,
  KetoStrategy,
  getGoalStrategyContext,
  type GoalCalculationStrategy,
  type MacroTargets
} from './GoalStrategy';

// Singleton Pattern
export {
  AchievementManager,
  type UserAchievementState
} from './Singleton';

// Command Pattern
export {
  FoodLoggedCommand,
  ExerciseLoggedCommand,
  WaterLoggedCommand,
  DailyCheckInCommand,
  AchievementInvoker,
  getAchievementInvoker,
  type AchievementCommand
} from './Command';

// Decorator Pattern
export {
  BaseAchievementReward,
  FirstTimeBonus,
  StreakMultiplier,
  WeekendBonus,
  PerfectDayBonus,
  applyBonuses,
  type AchievementReward
} from './Decorator';

// State Pattern
export {
  ProgressStateMachine,
  getProgressStateMachine,
  type ProgressStateType,
  type ProgressStateInfo
} from './ProgressState';

// Builder Pattern
export {
  InsightsBuilder,
  InsightsDirector,
  getInsightsDirector,
  type NutritionInsight,
  type DailyInsightsReport
} from './InsightsBuilder';

// Leaderboard Strategy Pattern
export {
  LeaderboardContext,
  RankingStrategies,
  getMedalStyle,
  type RankingStrategy,
  type MedalStyle
} from './LeaderboardStrategy';

// Data Analysis Strategy Pattern
export {
  DataAnalyzer,
  AnalysisStrategyFactory,
  CalorieAnalysisStrategy,
  ProteinAnalysisStrategy,
  WaterAnalysisStrategy,
  ExerciseAnalysisStrategy,
  CarbsAnalysisStrategy,
  FatAnalysisStrategy,
  type AnalysisStrategy,
  type AnalysisResult,
  type MetricKey
} from './AnalysisStrategy';
