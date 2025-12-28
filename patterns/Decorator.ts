/**
 * Decorator Pattern Implementation
 * Adds bonus multipliers and special effects to achievements
 */

import { Achievement, AchievementTier } from './Observer';

// Component Interface
export interface AchievementReward {
  getPoints(): number;
  getDescription(): string;
  getBadgeClass(): string;
}

// Concrete Component: Base Achievement Reward
export class BaseAchievementReward implements AchievementReward {
  protected achievement: Achievement;

  constructor(achievement: Achievement) {
    this.achievement = achievement;
  }

  getPoints(): number {
    return this.achievement.points;
  }

  getDescription(): string {
    return this.achievement.description;
  }

  getBadgeClass(): string {
    return this.getTierClass(this.achievement.tier);
  }

  private getTierClass(tier: AchievementTier): string {
    const classes: Record<AchievementTier, string> = {
      bronze: 'from-amber-600 to-amber-800',
      silver: 'from-slate-300 to-slate-500',
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-cyan-300 to-cyan-500',
      diamond: 'from-purple-400 via-pink-400 to-blue-400'
    };
    return classes[tier];
  }
}

// Abstract Decorator
export abstract class AchievementDecorator implements AchievementReward {
  protected wrapped: AchievementReward;

  constructor(reward: AchievementReward) {
    this.wrapped = reward;
  }

  getPoints(): number {
    return this.wrapped.getPoints();
  }

  getDescription(): string {
    return this.wrapped.getDescription();
  }

  getBadgeClass(): string {
    return this.wrapped.getBadgeClass();
  }
}

// Concrete Decorator: First Time Bonus
export class FirstTimeBonus extends AchievementDecorator {
  private bonusMultiplier: number = 1.5;

  getPoints(): number {
    return Math.round(this.wrapped.getPoints() * this.bonusMultiplier);
  }

  getDescription(): string {
    return `${this.wrapped.getDescription()} (🎉 First time bonus: 1.5x points!)`;
  }
}

// Concrete Decorator: Streak Multiplier
export class StreakMultiplier extends AchievementDecorator {
  private streakDays: number;

  constructor(reward: AchievementReward, streakDays: number) {
    super(reward);
    this.streakDays = streakDays;
  }

  getPoints(): number {
    const multiplier = 1 + Math.min(this.streakDays * 0.05, 0.5); // Max 50% bonus
    return Math.round(this.wrapped.getPoints() * multiplier);
  }

  getDescription(): string {
    const bonus = Math.min(this.streakDays * 5, 50);
    return `${this.wrapped.getDescription()} (🔥 ${bonus}% streak bonus!)`;
  }
}

// Concrete Decorator: Weekend Warrior Bonus
export class WeekendBonus extends AchievementDecorator {
  private bonusMultiplier: number = 1.25;

  getPoints(): number {
    const today = new Date().getDay();
    const isWeekend = today === 0 || today === 6;
    return isWeekend ? Math.round(this.wrapped.getPoints() * this.bonusMultiplier) : this.wrapped.getPoints();
  }

  getDescription(): string {
    const today = new Date().getDay();
    const isWeekend = today === 0 || today === 6;
    return isWeekend 
      ? `${this.wrapped.getDescription()} (🌟 Weekend warrior: 25% bonus!)`
      : this.wrapped.getDescription();
  }
}

// Concrete Decorator: Perfect Day Bonus (all goals met)
export class PerfectDayBonus extends AchievementDecorator {
  private isPerfectDay: boolean;

  constructor(reward: AchievementReward, isPerfectDay: boolean) {
    super(reward);
    this.isPerfectDay = isPerfectDay;
  }

  getPoints(): number {
    return this.isPerfectDay ? Math.round(this.wrapped.getPoints() * 2) : this.wrapped.getPoints();
  }

  getDescription(): string {
    return this.isPerfectDay 
      ? `${this.wrapped.getDescription()} (⭐ Perfect day: 2x points!)`
      : this.wrapped.getDescription();
  }

  getBadgeClass(): string {
    return this.isPerfectDay 
      ? `${this.wrapped.getBadgeClass()} animate-pulse`
      : this.wrapped.getBadgeClass();
  }
}

// Utility function to apply decorators based on context
export function applyBonuses(
  achievement: Achievement,
  options: {
    isFirstTime?: boolean;
    streakDays?: number;
    isPerfectDay?: boolean;
  }
): AchievementReward {
  let reward: AchievementReward = new BaseAchievementReward(achievement);

  if (options.isFirstTime) {
    reward = new FirstTimeBonus(reward);
  }

  if (options.streakDays && options.streakDays > 0) {
    reward = new StreakMultiplier(reward, options.streakDays);
  }

  // Weekend bonus always applies
  reward = new WeekendBonus(reward);

  if (options.isPerfectDay) {
    reward = new PerfectDayBonus(reward, true);
  }

  return reward;
}
