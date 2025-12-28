/**
 * Singleton Pattern Implementation
 * Central achievement manager instance that coordinates all achievement operations
 */

import { 
  Achievement, 
  AchievementEvent, 
  AchievementSubject, 
  Observer,
  AchievementCategory,
  AchievementTier 
} from './Observer';
import { AchievementFactoryCreator, AchievementDefinition } from './Factory';
import { AchievementCalculator } from './Strategy';
import { applyBonuses, AchievementReward } from './Decorator';
import { DailyLog, UserGoals } from '../types';

export interface UserAchievementState {
  unlockedAchievements: Achievement[];
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  levelProgress: number;
}

/**
 * Get the "effective date" based on 6 AM day boundary
 * If it's before 6 AM, return yesterday's date
 * If it's 6 AM or later, return today's date
 */
const getEffectiveDate = (date: Date = new Date()): string => {
  const hour = date.getHours();
  
  // If before 6 AM, we're still in the previous day
  if (hour < 6) {
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
  
  return date.toISOString().split('T')[0];
};

/**
 * Get the effective date as a Date object (at midnight)
 */
const getEffectiveDateObj = (date: Date = new Date()): Date => {
  const effectiveDateStr = getEffectiveDate(date);
  const effectiveDate = new Date(effectiveDateStr);
  effectiveDate.setHours(0, 0, 0, 0);
  return effectiveDate;
};

// Singleton Achievement Manager
export class AchievementManager {
  private static instance: AchievementManager | null = null;
  
  private achievementDefinitions: AchievementDefinition[];
  private userState: UserAchievementState;
  private eventSubject: AchievementSubject<AchievementEvent>;
  
  private constructor() {
    this.achievementDefinitions = AchievementFactoryCreator.createAllAchievements();
    this.userState = {
      unlockedAchievements: [],
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      level: 1,
      levelProgress: 0
    };
    this.eventSubject = new AchievementSubject<AchievementEvent>();
  }

  // Singleton access
  public static getInstance(): AchievementManager {
    if (!AchievementManager.instance) {
      AchievementManager.instance = new AchievementManager();
    }
    return AchievementManager.instance;
  }

  // Reset instance (useful for testing)
  public static resetInstance(): void {
    AchievementManager.instance = null;
  }

  // Subscribe to achievement events
  public subscribe(observer: Observer<AchievementEvent>): void {
    this.eventSubject.subscribe(observer);
  }

  public unsubscribe(observer: Observer<AchievementEvent>): void {
    this.eventSubject.unsubscribe(observer);
  }

  // Load user's achievement state
  public loadState(state: Partial<UserAchievementState>): void {
    this.userState = { ...this.userState, ...state };
  }

  // Get current state
  public getState(): UserAchievementState {
    return { ...this.userState };
  }

  // Get all achievement definitions
  public getAllAchievements(): Achievement[] {
    return this.achievementDefinitions.map(def => ({
      ...def.achievement,
      unlockedAt: this.userState.unlockedAchievements.find(
        a => a.id === def.achievement.id
      )?.unlockedAt
    }));
  }

  // Get achievements by category
  public getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return this.getAllAchievements().filter(a => a.category === category);
  }

  // Check and update achievements based on user activity
  public checkAchievements(logs: DailyLog[], goals: UserGoals): Achievement[] {
    const newlyUnlocked: Achievement[] = [];

    for (const definition of this.achievementDefinitions) {
      const { achievement, strategy } = definition;
      
      // Skip if already unlocked
      if (this.userState.unlockedAchievements.some(a => a.id === achievement.id)) {
        continue;
      }

      const calculator = new AchievementCalculator(strategy);
      const result = calculator.calculate(logs, goals);

      // Update progress
      achievement.progress = result.progress;

      if (result.unlocked) {
        const unlockedAchievement: Achievement = {
          ...achievement,
          unlockedAt: new Date(),
          progress: result.target
        };

        // Apply decorators for bonus points
        const reward = applyBonuses(unlockedAchievement, {
          isFirstTime: this.userState.unlockedAchievements.length === 0,
          streakDays: this.userState.currentStreak,
          isPerfectDay: this.checkPerfectDay(logs, goals)
        });

        // Update state
        this.userState.unlockedAchievements.push(unlockedAchievement);
        this.userState.totalPoints += reward.getPoints();
        this.updateLevel();

        newlyUnlocked.push(unlockedAchievement);

        // Notify observers
        this.eventSubject.notify({
          type: 'unlocked',
          achievement: unlockedAchievement,
          timestamp: new Date()
        });
      }
    }

    // Update streak using 6 AM boundary
    this.updateStreak(logs);

    return newlyUnlocked;
  }

  // Update user's streak using 6 AM day boundary
  private updateStreak(logs: DailyLog[]): void {
    if (logs.length === 0) {
      this.userState.currentStreak = 0;
      return;
    }

    // Filter logs that have activity
    const logsWithActivity = logs.filter(
      log => (log.foods?.length || 0) > 0 || (log.exercises?.length || 0) > 0
    );

    if (logsWithActivity.length === 0) {
      this.userState.currentStreak = 0;
      return;
    }

    // Sort by date descending (most recent first)
    const sortedLogs = [...logsWithActivity].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Get today's effective date (using 6 AM boundary)
    const todayEffective = getEffectiveDateObj();

    let streak = 0;

    for (let i = 0; i < sortedLogs.length; i++) {
      const logDate = new Date(sortedLogs[i].date);
      logDate.setHours(0, 0, 0, 0);

      // Calculate expected date for this position in streak
      const expectedDate = new Date(todayEffective);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (logDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else if (i === 0) {
        // If the most recent log is from yesterday (and we haven't logged today yet),
        // check if it matches yesterday
        const yesterday = new Date(todayEffective);
        yesterday.setDate(yesterday.getDate() - 1);

        if (logDate.getTime() === yesterday.getTime()) {
          // Start counting from yesterday
          streak = 1;
          // Continue checking from yesterday
          for (let j = 1; j < sortedLogs.length; j++) {
            const nextLogDate = new Date(sortedLogs[j].date);
            nextLogDate.setHours(0, 0, 0, 0);

            const nextExpectedDate = new Date(yesterday);
            nextExpectedDate.setDate(nextExpectedDate.getDate() - j);

            if (nextLogDate.getTime() === nextExpectedDate.getTime()) {
              streak++;
            } else {
              break;
            }
          }
          break;
        } else {
          // No activity today or yesterday, streak is 0
          streak = 0;
          break;
        }
      } else {
        // Gap in streak
        break;
      }
    }

    this.userState.currentStreak = streak;
    if (streak > this.userState.longestStreak) {
      this.userState.longestStreak = streak;

      // Notify streak milestone
      if (streak % 7 === 0) {
        this.eventSubject.notify({
          type: 'streak',
          progress: streak,
          timestamp: new Date()
        });
      }
    }
  }

  // Check if today is a "perfect day" (using 6 AM boundary)
  private checkPerfectDay(logs: DailyLog[], goals: UserGoals): boolean {
    const today = getEffectiveDate();
    const todayLog = logs.find(l => l.date === today);
    
    if (!todayLog) return false;

    const hasFood = todayLog.foods.length > 0;
    const hasExercise = todayLog.exercises.length > 0;
    const hasWater = (todayLog.waterIntake || 0) >= 2000;

    return hasFood && hasExercise && hasWater;
  }

  // Update user level based on points
  private updateLevel(): void {
    const pointsPerLevel = 100; // Reduced from 500 to make leveling easier
    const newLevel = Math.floor(this.userState.totalPoints / pointsPerLevel) + 1;
    const progress = (this.userState.totalPoints % pointsPerLevel) / pointsPerLevel * 100;

    if (newLevel > this.userState.level) {
      this.eventSubject.notify({
        type: 'milestone',
        progress: newLevel,
        timestamp: new Date()
      });
    }

    this.userState.level = newLevel;
    this.userState.levelProgress = progress;
  }

  // Get level title
  public getLevelTitle(level: number): string {
    const titles = [
      'Beginner',
      'Apprentice', 
      'Enthusiast',
      'Dedicated',
      'Committed',
      'Expert',
      'Master',
      'Champion',
      'Legend',
      'Mythic'
    ];
    return titles[Math.min(level - 1, titles.length - 1)];
  }

  // Get next achievement to unlock (closest to completion)
  public getNextAchievement(logs: DailyLog[], goals: UserGoals): Achievement | null {
    let closest: { achievement: Achievement; remaining: number } | null = null;

    for (const definition of this.achievementDefinitions) {
      const { achievement, strategy } = definition;
      
      if (this.userState.unlockedAchievements.some(a => a.id === achievement.id)) {
        continue;
      }

      const calculator = new AchievementCalculator(strategy);
      const result = calculator.calculate(logs, goals);
      const remaining = result.target - result.progress;
      const percentComplete = result.progress / result.target;

      if (percentComplete > 0 && (!closest || remaining < closest.remaining)) {
        closest = {
          achievement: { ...achievement, progress: result.progress },
          remaining
        };
      }
    }

    return closest?.achievement || null;
  }
}
