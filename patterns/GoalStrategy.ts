/**
 * Goal Calculation Strategy Pattern
 * Different algorithms for calculating calorie and macro targets based on user goals
 */

import { User, UserGoals, DailyProgress } from '../types';

// Strategy Interface
export interface GoalCalculationStrategy {
  calculateDailyCalories(user: User, goals: UserGoals): number;
  calculateMacros(user: User, goals: UserGoals, calories: number): MacroTargets;
  getStrategyName(): string;
  getDescription(): string;
}

export interface MacroTargets {
  protein: number;  // grams
  carbs: number;    // grams
  fat: number;      // grams
  fiber: number;    // grams
}

// Base BMR Calculator (Mifflin-St Jeor)
const calculateBMR = (user: User): number => {
  const { weight = 70, height = 170, age = 30, gender = 'female' } = user;
  const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);
  return Math.round(bmr);
};

// Activity multipliers
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

/**
 * Standard Weight Loss Strategy
 * Moderate deficit of 500 calories for ~0.5kg/week loss
 */
export class StandardWeightLossStrategy implements GoalCalculationStrategy {
  calculateDailyCalories(user: User, goals: UserGoals): number {
    const bmr = calculateBMR(user);
    const tdee = bmr * ACTIVITY_MULTIPLIERS.light;
    return Math.round(tdee - 500); // 500 calorie deficit
  }

  calculateMacros(user: User, goals: UserGoals, calories: number): MacroTargets {
    const weight = user.weight || 70;
    return {
      protein: Math.round(weight * 2.0),      // Higher protein for muscle preservation
      fat: Math.round((calories * 0.25) / 9), // 25% from fat
      carbs: Math.round((calories - (weight * 2.0 * 4) - ((calories * 0.25))) / 4),
      fiber: 30,
    };
  }

  getStrategyName(): string { return 'Standard Weight Loss'; }
  getDescription(): string { return 'Moderate 500 calorie deficit for sustainable weight loss (~0.5kg/week)'; }
}

/**
 * Aggressive Weight Loss Strategy
 * Larger deficit of 750-1000 calories for faster results
 */
export class AggressiveWeightLossStrategy implements GoalCalculationStrategy {
  calculateDailyCalories(user: User, goals: UserGoals): number {
    const bmr = calculateBMR(user);
    const tdee = bmr * ACTIVITY_MULTIPLIERS.light;
    const deficit = Math.min(1000, tdee * 0.25); // Max 25% deficit or 1000 cal
    return Math.round(Math.max(tdee - deficit, bmr)); // Never go below BMR
  }

  calculateMacros(user: User, goals: UserGoals, calories: number): MacroTargets {
    const weight = user.weight || 70;
    return {
      protein: Math.round(weight * 2.2),      // Even higher protein
      fat: Math.round((calories * 0.20) / 9), // 20% from fat
      carbs: Math.round((calories - (weight * 2.2 * 4) - ((calories * 0.20))) / 4),
      fiber: 35,
    };
  }

  getStrategyName(): string { return 'Aggressive Weight Loss'; }
  getDescription(): string { return 'Larger calorie deficit for faster results (up to 1kg/week)'; }
}

/**
 * Muscle Building Strategy
 * Caloric surplus with high protein for muscle gain
 */
export class MuscleGainStrategy implements GoalCalculationStrategy {
  calculateDailyCalories(user: User, goals: UserGoals): number {
    const bmr = calculateBMR(user);
    const tdee = bmr * ACTIVITY_MULTIPLIERS.active;
    return Math.round(tdee + 300); // 300 calorie surplus for lean gains
  }

  calculateMacros(user: User, goals: UserGoals, calories: number): MacroTargets {
    const weight = user.weight || 70;
    return {
      protein: Math.round(weight * 2.2),      // High protein for muscle synthesis
      fat: Math.round((calories * 0.25) / 9), // 25% from fat
      carbs: Math.round((calories - (weight * 2.2 * 4) - ((calories * 0.25))) / 4),
      fiber: 30,
    };
  }

  getStrategyName(): string { return 'Muscle Building'; }
  getDescription(): string { return 'Moderate surplus with high protein for lean muscle gains'; }
}

/**
 * Maintenance Strategy
 * Maintain current weight with balanced macros
 */
export class MaintenanceStrategy implements GoalCalculationStrategy {
  calculateDailyCalories(user: User, goals: UserGoals): number {
    const bmr = calculateBMR(user);
    return Math.round(bmr * ACTIVITY_MULTIPLIERS.light);
  }

  calculateMacros(user: User, goals: UserGoals, calories: number): MacroTargets {
    const weight = user.weight || 70;
    return {
      protein: Math.round(weight * 1.6),      // Moderate protein
      fat: Math.round((calories * 0.30) / 9), // 30% from fat
      carbs: Math.round((calories - (weight * 1.6 * 4) - ((calories * 0.30))) / 4),
      fiber: 28,
    };
  }

  getStrategyName(): string { return 'Maintenance'; }
  getDescription(): string { return 'Maintain current weight with balanced nutrition'; }
}

/**
 * Keto Strategy
 * Very low carb, high fat for ketosis
 */
export class KetoStrategy implements GoalCalculationStrategy {
  calculateDailyCalories(user: User, goals: UserGoals): number {
    const bmr = calculateBMR(user);
    const tdee = bmr * ACTIVITY_MULTIPLIERS.light;
    // Adjust based on goal
    if (goals.weightGoal === 'lose') return Math.round(tdee - 400);
    if (goals.weightGoal === 'gain') return Math.round(tdee + 200);
    return Math.round(tdee);
  }

  calculateMacros(user: User, goals: UserGoals, calories: number): MacroTargets {
    const weight = user.weight || 70;
    return {
      protein: Math.round(weight * 1.8),       // Moderate-high protein
      fat: Math.round((calories * 0.70) / 9),  // 70% from fat
      carbs: 25,                                // Max 25g net carbs
      fiber: 20,
    };
  }

  getStrategyName(): string { return 'Ketogenic'; }
  getDescription(): string { return 'Very low carb (<25g), high fat diet for ketosis'; }
}

/**
 * Goal Strategy Context
 * Manages strategy selection and execution
 */
export class GoalStrategyContext {
  private strategy: GoalCalculationStrategy;
  private strategies: Map<string, GoalCalculationStrategy>;

  constructor() {
    this.strategies = new Map([
      ['standard_loss', new StandardWeightLossStrategy()],
      ['aggressive_loss', new AggressiveWeightLossStrategy()],
      ['muscle_gain', new MuscleGainStrategy()],
      ['maintenance', new MaintenanceStrategy()],
      ['keto', new KetoStrategy()],
    ]);
    this.strategy = this.strategies.get('maintenance')!;
  }

  setStrategy(strategyKey: string): void {
    const strategy = this.strategies.get(strategyKey);
    if (strategy) {
      this.strategy = strategy;
    }
  }

  // Auto-select strategy based on user goals
  autoSelectStrategy(goals: UserGoals): void {
    if (goals.weightGoal === 'lose') {
      // Check timeline for aggressiveness
      if (goals.goalTimeline && goals.goalTimeline < 8) {
        this.strategy = this.strategies.get('aggressive_loss')!;
      } else {
        this.strategy = this.strategies.get('standard_loss')!;
      }
    } else if (goals.weightGoal === 'gain') {
      this.strategy = this.strategies.get('muscle_gain')!;
    } else {
      this.strategy = this.strategies.get('maintenance')!;
    }
  }

  calculateTargets(user: User, goals: UserGoals): { calories: number; macros: MacroTargets; strategy: string } {
    const calories = this.strategy.calculateDailyCalories(user, goals);
    const macros = this.strategy.calculateMacros(user, goals, calories);
    return {
      calories,
      macros,
      strategy: this.strategy.getStrategyName(),
    };
  }

  getAvailableStrategies(): Array<{ key: string; name: string; description: string }> {
    return Array.from(this.strategies.entries()).map(([key, strategy]) => ({
      key,
      name: strategy.getStrategyName(),
      description: strategy.getDescription(),
    }));
  }

  getCurrentStrategy(): GoalCalculationStrategy {
    return this.strategy;
  }
}

// Singleton instance
let strategyContextInstance: GoalStrategyContext | null = null;

export const getGoalStrategyContext = (): GoalStrategyContext => {
  if (!strategyContextInstance) {
    strategyContextInstance = new GoalStrategyContext();
  }
  return strategyContextInstance;
};
