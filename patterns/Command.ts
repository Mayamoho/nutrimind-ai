/**
 * Command Pattern Implementation
 * Tracks user actions that trigger achievement checks
 */

import { AchievementManager } from './Singleton';
import { DailyLog, UserGoals, FoodLog, ExerciseLog, NeatLog } from '../types';
import { Achievement } from './Observer';

// Command Interface
export interface AchievementCommand {
  execute(): Achievement[];
  getDescription(): string;
}

// Abstract Command with common functionality
abstract class BaseAchievementCommand implements AchievementCommand {
  protected manager: AchievementManager;
  protected logs: DailyLog[];
  protected goals: UserGoals;

  constructor(logs: DailyLog[], goals: UserGoals) {
    this.manager = AchievementManager.getInstance();
    this.logs = logs;
    this.goals = goals;
  }

  abstract execute(): Achievement[];
  abstract getDescription(): string;
}

// Concrete Command: Food Logged
export class FoodLoggedCommand extends BaseAchievementCommand {
  private food: FoodLog;

  constructor(logs: DailyLog[], goals: UserGoals, food: FoodLog) {
    super(logs, goals);
    this.food = food;
  }

  execute(): Achievement[] {
    console.log(`[Command] Food logged: ${this.food.name}`);
    return this.manager.checkAchievements(this.logs, this.goals);
  }

  getDescription(): string {
    return `Logged food: ${this.food.name} (${this.food.calories} kcal)`;
  }
}

// Concrete Command: Exercise Logged
export class ExerciseLoggedCommand extends BaseAchievementCommand {
  private exercise: ExerciseLog;

  constructor(logs: DailyLog[], goals: UserGoals, exercise: ExerciseLog) {
    super(logs, goals);
    this.exercise = exercise;
  }

  execute(): Achievement[] {
    console.log(`[Command] Exercise logged: ${this.exercise.name}`);
    return this.manager.checkAchievements(this.logs, this.goals);
  }

  getDescription(): string {
    return `Logged exercise: ${this.exercise.name} (${this.exercise.caloriesBurned} kcal burned)`;
  }
}

// Concrete Command: Water Logged
export class WaterLoggedCommand extends BaseAchievementCommand {
  private amount: number;

  constructor(logs: DailyLog[], goals: UserGoals, amount: number) {
    super(logs, goals);
    this.amount = amount;
  }

  execute(): Achievement[] {
    console.log(`[Command] Water logged: ${this.amount}ml`);
    return this.manager.checkAchievements(this.logs, this.goals);
  }

  getDescription(): string {
    return `Logged water: ${this.amount}ml`;
  }
}

// Concrete Command: Daily Check-in
export class DailyCheckInCommand extends BaseAchievementCommand {
  execute(): Achievement[] {
    console.log('[Command] Daily check-in');
    return this.manager.checkAchievements(this.logs, this.goals);
  }

  getDescription(): string {
    return 'Daily check-in completed';
  }
}

// Command Invoker - stores and executes commands
export class AchievementInvoker {
  private history: { command: AchievementCommand; timestamp: Date; results: Achievement[] }[] = [];

  executeCommand(command: AchievementCommand): Achievement[] {
    const results = command.execute();
    this.history.push({
      command,
      timestamp: new Date(),
      results
    });
    return results;
  }

  getHistory(): { description: string; timestamp: Date; achievementsUnlocked: number }[] {
    return this.history.map(entry => ({
      description: entry.command.getDescription(),
      timestamp: entry.timestamp,
      achievementsUnlocked: entry.results.length
    }));
  }

  getRecentActivity(count: number = 10): { description: string; timestamp: Date }[] {
    return this.history
      .slice(-count)
      .reverse()
      .map(entry => ({
        description: entry.command.getDescription(),
        timestamp: entry.timestamp
      }));
  }
}

// Singleton invoker instance
let invokerInstance: AchievementInvoker | null = null;

export function getAchievementInvoker(): AchievementInvoker {
  if (!invokerInstance) {
    invokerInstance = new AchievementInvoker();
  }
  return invokerInstance;
}
