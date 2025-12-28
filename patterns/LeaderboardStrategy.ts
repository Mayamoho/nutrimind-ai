/**
 * Leaderboard Strategy Pattern
 * Defines different ranking strategies for the community leaderboard
 * 
 * Design Patterns Used:
 * 1. Strategy Pattern - Different sorting/ranking algorithms
 * 2. Observer Pattern - Real-time leaderboard updates (via React state)
 * 3. Facade Pattern - Simple API interface hiding complex aggregation logic
 */

import { LeaderboardUser, LeaderboardSortOption } from '../types';

/**
 * Strategy Interface for ranking users
 */
export interface RankingStrategy {
  name: LeaderboardSortOption;
  label: string;
  icon: string;
  compare: (a: LeaderboardUser, b: LeaderboardUser) => number;
  getValue: (user: LeaderboardUser) => string;
}

/**
 * Concrete Strategies for different ranking criteria
 */
export const RankingStrategies: Record<LeaderboardSortOption, RankingStrategy> = {
  level: {
    name: 'level',
    label: 'Level',
    icon: '🎖️',
    compare: (a, b) => b.level - a.level || b.totalPoints - a.totalPoints,
    getValue: (user) => `Level ${user.level}`,
  },
  
  totalPoints: {
    name: 'totalPoints',
    label: 'Points',
    icon: '⭐',
    compare: (a, b) => b.totalPoints - a.totalPoints,
    getValue: (user) => `${user.totalPoints.toLocaleString()} pts`,
  },
  
  totalCaloriesIn: {
    name: 'totalCaloriesIn',
    label: 'Calories Intake',
    icon: '🍎',
    compare: (a, b) => b.totalCaloriesIn - a.totalCaloriesIn,
    getValue: (user) => `${user.totalCaloriesIn.toLocaleString()} cal`,
  },
  
  totalCaloriesBurned: {
    name: 'totalCaloriesBurned',
    label: 'Calories Burned',
    icon: '🔥',
    compare: (a, b) => b.totalCaloriesBurned - a.totalCaloriesBurned,
    getValue: (user) => `${user.totalCaloriesBurned.toLocaleString()} cal`,
  },
  
  totalWaterIntake: {
    name: 'totalWaterIntake',
    label: 'Water Intake',
    icon: '💧',
    compare: (a, b) => b.totalWaterIntake - a.totalWaterIntake,
    getValue: (user) => `${(user.totalWaterIntake / 1000).toFixed(1)} L`,
  },
  
  totalFoods: {
    name: 'totalFoods',
    label: 'Meals Logged',
    icon: '🍽️',
    compare: (a, b) => b.totalFoods - a.totalFoods,
    getValue: (user) => `${user.totalFoods} meals`,
  },
  
  totalExercises: {
    name: 'totalExercises',
    label: 'Workouts',
    icon: '💪',
    compare: (a, b) => b.totalExercises - a.totalExercises,
    getValue: (user) => `${user.totalExercises} workouts`,
  },
  
  totalProtein: {
    name: 'totalProtein',
    label: 'Protein Intake',
    icon: '🥩',
    compare: (a, b) => b.totalProtein - a.totalProtein,
    getValue: (user) => `${Math.round(user.totalProtein)}g`,
  },
  
  totalCarbs: {
    name: 'totalCarbs',
    label: 'Carbs Intake',
    icon: '🍞',
    compare: (a, b) => b.totalCarbs - a.totalCarbs,
    getValue: (user) => `${Math.round(user.totalCarbs)}g`,
  },
  
  totalFat: {
    name: 'totalFat',
    label: 'Fat Intake',
    icon: '🥑',
    compare: (a, b) => b.totalFat - a.totalFat,
    getValue: (user) => `${Math.round(user.totalFat)}g`,
  },
  
  bestStreak: {
    name: 'bestStreak',
    label: 'Best Streak',
    icon: '🔥',
    compare: (a, b) => b.bestStreak - a.bestStreak,
    getValue: (user) => `${user.bestStreak} days`,
  },
  
  totalNeat: {
    name: 'totalNeat',
    label: 'NEAT Activities',
    icon: '🚶',
    compare: (a, b) => b.totalNeat - a.totalNeat,
    getValue: (user) => `${user.totalNeat.toLocaleString()} cal`,
  },
};

/**
 * Leaderboard Context - applies strategy to rank users
 */
export class LeaderboardContext {
  private strategy: RankingStrategy;
  
  constructor(strategyName: LeaderboardSortOption = 'totalPoints') {
    this.strategy = RankingStrategies[strategyName];
  }
  
  setStrategy(strategyName: LeaderboardSortOption): void {
    this.strategy = RankingStrategies[strategyName];
  }
  
  getStrategy(): RankingStrategy {
    return this.strategy;
  }
  
  rankUsers(users: LeaderboardUser[]): LeaderboardUser[] {
    const sorted = [...users].sort(this.strategy.compare);
    return sorted.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));
  }
  
  getDisplayValue(user: LeaderboardUser): string {
    return this.strategy.getValue(user);
  }
}

/**
 * Medal/Badge Decorator for top ranked users
 */
export interface MedalStyle {
  bg: string;
  medal: string;
}

export const getMedalStyle = (rank: number): MedalStyle | null => {
  switch (rank) {
    case 1:
      return {
        bg: 'bg-gradient-to-r from-yellow-400 to-amber-500',
        medal: '🥇',
      };
    case 2:
      return {
        bg: 'bg-gradient-to-r from-slate-300 to-slate-400',
        medal: '🥈',
      };
    case 3:
      return {
        bg: 'bg-gradient-to-r from-amber-600 to-orange-700',
        medal: '🥉',
      };
    default:
      return null;
  }
};

export default LeaderboardContext;
