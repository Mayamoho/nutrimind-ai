/**
 * Factory Pattern Implementation
 * Creates different types of achievements dynamically
 */

import { Achievement, AchievementCategory, AchievementTier } from './Observer';
import { 
  AchievementStrategy, 
  StreakStrategy, 
  CalorieMilestoneStrategy, 
  ExerciseMilestoneStrategy,
  GoalAchievementStrategy,
  HydrationStrategy
} from './Strategy';

// Achievement with strategy attached
export interface AchievementDefinition {
  achievement: Achievement;
  strategy: AchievementStrategy;
}

// Abstract Factory Interface
export interface AchievementFactory {
  createAchievement(tier: AchievementTier): AchievementDefinition;
}

// Concrete Factory: Streak Achievements
export class StreakAchievementFactory implements AchievementFactory {
  private tierConfig: Record<AchievementTier, { days: number; points: number; name: string }> = {
    bronze: { days: 3, points: 10, name: 'Getting Started' },
    silver: { days: 7, points: 25, name: 'Week Warrior' },
    gold: { days: 14, points: 50, name: 'Fortnight Fighter' },
    platinum: { days: 30, points: 100, name: 'Monthly Master' },
    diamond: { days: 100, points: 250, name: 'Century Champion' }
  };

  createAchievement(tier: AchievementTier): AchievementDefinition {
    const config = this.tierConfig[tier];
    return {
      achievement: {
        id: `streak-${tier}`,
        name: config.name,
        description: `Log your meals or exercises for ${config.days} consecutive days`,
        icon: '🔥',
        category: 'consistency',
        tier,
        points: config.points,
        progress: 0,
        target: config.days
      },
      strategy: new StreakStrategy(config.days)
    };
  }
}

// Concrete Factory: Calorie Milestone Achievements
export class CalorieMilestoneFactory implements AchievementFactory {
  private tierConfig: Record<AchievementTier, { calories: number; points: number; name: string }> = {
    bronze: { calories: 5000, points: 10, name: 'Calorie Counter' },
    silver: { calories: 25000, points: 25, name: 'Nutrition Tracker' },
    gold: { calories: 50000, points: 50, name: 'Diet Detective' },
    platinum: { calories: 100000, points: 100, name: 'Macro Master' },
    diamond: { calories: 250000, points: 250, name: 'Nutrition Legend' }
  };

  createAchievement(tier: AchievementTier): AchievementDefinition {
    const config = this.tierConfig[tier];
    return {
      achievement: {
        id: `calories-${tier}`,
        name: config.name,
        description: `Track a total of ${config.calories.toLocaleString()} calories`,
        icon: '🍎',
        category: 'nutrition',
        tier,
        points: config.points,
        progress: 0,
        target: config.calories
      },
      strategy: new CalorieMilestoneStrategy(config.calories)
    };
  }
}

// Concrete Factory: Exercise Achievements
export class ExerciseAchievementFactory implements AchievementFactory {
  private tierConfig: Record<AchievementTier, { exercises: number; points: number; name: string }> = {
    bronze: { exercises: 3, points: 10, name: 'First Steps' },
    silver: { exercises: 10, points: 25, name: 'Active Lifestyle' },
    gold: { exercises: 25, points: 50, name: 'Fitness Fanatic' },
    platinum: { exercises: 50, points: 100, name: 'Workout Warrior' },
    diamond: { exercises: 100, points: 250, name: 'Exercise Elite' }
  };

  createAchievement(tier: AchievementTier): AchievementDefinition {
    const config = this.tierConfig[tier];
    return {
      achievement: {
        id: `exercise-${tier}`,
        name: config.name,
        description: `Complete ${config.exercises} exercise sessions`,
        icon: '💪',
        category: 'exercise',
        tier,
        points: config.points,
        progress: 0,
        target: config.exercises
      },
      strategy: new ExerciseMilestoneStrategy(config.exercises)
    };
  }
}

// Concrete Factory: Hydration Achievements
export class HydrationAchievementFactory implements AchievementFactory {
  private tierConfig: Record<AchievementTier, { days: number; points: number; name: string }> = {
    bronze: { days: 3, points: 10, name: 'Hydration Starter' },
    silver: { days: 7, points: 25, name: 'Water Week' },
    gold: { days: 14, points: 50, name: 'Hydration Hero' },
    platinum: { days: 30, points: 100, name: 'Aqua Master' },
    diamond: { days: 60, points: 250, name: 'Hydration Legend' }
  };

  createAchievement(tier: AchievementTier): AchievementDefinition {
    const config = this.tierConfig[tier];
    return {
      achievement: {
        id: `hydration-${tier}`,
        name: config.name,
        description: `Meet your water goal for ${config.days} days`,
        icon: '💧',
        category: 'milestone',
        tier,
        points: config.points,
        progress: 0,
        target: config.days
      },
      strategy: new HydrationStrategy(config.days)
    };
  }
}

// Abstract Factory Creator - creates the right factory based on category
export class AchievementFactoryCreator {
  static getFactory(category: AchievementCategory): AchievementFactory {
    switch (category) {
      case 'consistency':
        return new StreakAchievementFactory();
      case 'nutrition':
        return new CalorieMilestoneFactory();
      case 'exercise':
        return new ExerciseAchievementFactory();
      case 'milestone':
        return new HydrationAchievementFactory();
      default:
        return new StreakAchievementFactory();
    }
  }

  static createAllAchievements(): AchievementDefinition[] {
    const tiers: AchievementTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const categories: AchievementCategory[] = ['consistency', 'nutrition', 'exercise', 'milestone'];
    
    const achievements: AchievementDefinition[] = [];
    
    for (const category of categories) {
      const factory = this.getFactory(category);
      for (const tier of tiers) {
        achievements.push(factory.createAchievement(tier));
      }
    }
    
    return achievements;
  }
}
