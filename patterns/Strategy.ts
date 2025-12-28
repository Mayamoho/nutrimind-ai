/**
 * Strategy Pattern Implementation
 * Different strategies for calculating achievement progress and unlocking
 */

import { Achievement, AchievementTier } from './Observer';
import { DailyLog, UserGoals } from '../types';

// Strategy Interface
export interface AchievementStrategy {
  calculateProgress(logs: DailyLog[], goals: UserGoals): number;
  checkUnlocked(progress: number, target: number): boolean;
  getTarget(): number;
}

// Concrete Strategy: Streak-based achievements
export class StreakStrategy implements AchievementStrategy {
  private requiredDays: number;

  constructor(requiredDays: number) {
    this.requiredDays = requiredDays;
  }

  calculateProgress(logs: DailyLog[]): number {
    if (logs.length === 0) return 0;
    
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const log of sortedLogs) {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1 && (log.foods.length > 0 || log.exercises.length > 0)) {
        streak++;
        currentDate = logDate;
      } else if (diffDays > 1) {
        break;
      }
    }
    
    return streak;
  }

  checkUnlocked(progress: number, target: number): boolean {
    return progress >= target;
  }

  getTarget(): number {
    return this.requiredDays;
  }
}

// Concrete Strategy: Milestone-based achievements (total calories logged)
export class CalorieMilestoneStrategy implements AchievementStrategy {
  private targetCalories: number;

  constructor(targetCalories: number) {
    this.targetCalories = targetCalories;
  }

  calculateProgress(logs: DailyLog[]): number {
    return logs.reduce((total, log) => {
      const dayCalories = log.foods.reduce((sum, food) => sum + food.calories, 0);
      return total + dayCalories;
    }, 0);
  }

  checkUnlocked(progress: number, target: number): boolean {
    return progress >= target;
  }

  getTarget(): number {
    return this.targetCalories;
  }
}

// Concrete Strategy: Exercise milestone (total exercises logged)
export class ExerciseMilestoneStrategy implements AchievementStrategy {
  private targetExercises: number;

  constructor(targetExercises: number) {
    this.targetExercises = targetExercises;
  }

  calculateProgress(logs: DailyLog[]): number {
    return logs.reduce((total, log) => total + log.exercises.length, 0);
  }

  checkUnlocked(progress: number, target: number): boolean {
    return progress >= target;
  }

  getTarget(): number {
    return this.targetExercises;
  }
}

// Concrete Strategy: Goal achievement (days meeting calorie goal)
export class GoalAchievementStrategy implements AchievementStrategy {
  private targetDays: number;
  private tolerancePercent: number;

  constructor(targetDays: number, tolerancePercent: number = 10) {
    this.targetDays = targetDays;
    this.tolerancePercent = tolerancePercent;
  }

  calculateProgress(logs: DailyLog[], goals: UserGoals): number {
    // Simplified: count days where user logged food
    return logs.filter(log => log.foods.length > 0).length;
  }

  checkUnlocked(progress: number, target: number): boolean {
    return progress >= target;
  }

  getTarget(): number {
    return this.targetDays;
  }
}

// Concrete Strategy: Water intake consistency
export class HydrationStrategy implements AchievementStrategy {
  private targetDays: number;
  private minWaterMl: number;

  constructor(targetDays: number, minWaterMl: number = 2000) {
    this.targetDays = targetDays;
    this.minWaterMl = minWaterMl;
  }

  calculateProgress(logs: DailyLog[]): number {
    return logs.filter(log => (log.waterIntake || 0) >= this.minWaterMl).length;
  }

  checkUnlocked(progress: number, target: number): boolean {
    return progress >= target;
  }

  getTarget(): number {
    return this.targetDays;
  }
}

// Strategy Context - uses the strategy
export class AchievementCalculator {
  private strategy: AchievementStrategy;

  constructor(strategy: AchievementStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: AchievementStrategy): void {
    this.strategy = strategy;
  }

  calculate(logs: DailyLog[], goals: UserGoals): { progress: number; target: number; unlocked: boolean } {
    const progress = this.strategy.calculateProgress(logs, goals);
    const target = this.strategy.getTarget();
    const unlocked = this.strategy.checkUnlocked(progress, target);
    return { progress, target, unlocked };
  }
}
