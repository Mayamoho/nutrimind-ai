/**
 * Progress State Machine Pattern
 * Manages daily progress states and transitions
 */

import { DailyProgress, DailyLog } from '../types';

// State types
export type ProgressStateType = 
  | 'not_started'
  | 'under_target'
  | 'on_track'
  | 'near_target'
  | 'target_reached'
  | 'over_target'
  | 'excellent';

export interface ProgressStateInfo {
  state: ProgressStateType;
  message: string;
  color: string;
  icon: string;
  encouragement: string;
  nextAction: string;
}

// State Interface
interface ProgressState {
  getStateInfo(): ProgressStateInfo;
  canTransitionTo(state: ProgressStateType): boolean;
  getProgress(): number; // 0-100
}

// Concrete States
class NotStartedState implements ProgressState {
  getStateInfo(): ProgressStateInfo {
    return {
      state: 'not_started',
      message: 'Ready to start your day!',
      color: 'slate',
      icon: '🌅',
      encouragement: 'Log your first meal to begin tracking',
      nextAction: 'Add breakfast to get started',
    };
  }
  canTransitionTo(state: ProgressStateType): boolean {
    return state === 'under_target';
  }
  getProgress(): number { return 0; }
}

class UnderTargetState implements ProgressState {
  constructor(private percentage: number) {}
  
  getStateInfo(): ProgressStateInfo {
    return {
      state: 'under_target',
      message: `${Math.round(this.percentage)}% of daily target`,
      color: 'sky',
      icon: '📊',
      encouragement: 'Keep going! You have room for more nutrition',
      nextAction: `${100 - Math.round(this.percentage)}% remaining to reach your goal`,
    };
  }
  canTransitionTo(state: ProgressStateType): boolean {
    return ['on_track', 'near_target', 'target_reached'].includes(state);
  }
  getProgress(): number { return this.percentage; }
}

class OnTrackState implements ProgressState {
  constructor(private percentage: number) {}
  
  getStateInfo(): ProgressStateInfo {
    return {
      state: 'on_track',
      message: 'On track for your goals!',
      color: 'emerald',
      icon: '✅',
      encouragement: 'Great progress! You\'re doing well',
      nextAction: 'Continue with balanced meals',
    };
  }
  canTransitionTo(state: ProgressStateType): boolean {
    return ['near_target', 'target_reached', 'over_target'].includes(state);
  }
  getProgress(): number { return this.percentage; }
}

class NearTargetState implements ProgressState {
  constructor(private percentage: number) {}
  
  getStateInfo(): ProgressStateInfo {
    return {
      state: 'near_target',
      message: 'Almost at your target!',
      color: 'amber',
      icon: '🎯',
      encouragement: 'Just a little more to reach your goal',
      nextAction: 'A light snack would complete your day',
    };
  }
  canTransitionTo(state: ProgressStateType): boolean {
    return ['target_reached', 'over_target', 'excellent'].includes(state);
  }
  getProgress(): number { return this.percentage; }
}

class TargetReachedState implements ProgressState {
  getStateInfo(): ProgressStateInfo {
    return {
      state: 'target_reached',
      message: 'Daily target reached! 🎉',
      color: 'emerald',
      icon: '🏆',
      encouragement: 'Excellent! You\'ve hit your calorie goal',
      nextAction: 'Focus on staying within range',
    };
  }
  canTransitionTo(state: ProgressStateType): boolean {
    return ['over_target', 'excellent'].includes(state);
  }
  getProgress(): number { return 100; }
}

class OverTargetState implements ProgressState {
  constructor(private percentage: number) {}
  
  getStateInfo(): ProgressStateInfo {
    const overBy = Math.round(this.percentage - 100);
    return {
      state: 'over_target',
      message: `${overBy}% over target`,
      color: 'orange',
      icon: '⚠️',
      encouragement: 'Consider some light exercise to balance',
      nextAction: 'A 30-min walk could help offset the extra calories',
    };
  }
  canTransitionTo(state: ProgressStateType): boolean {
    return false; // Terminal state for the day
  }
  getProgress(): number { return Math.min(this.percentage, 150); }
}

class ExcellentState implements ProgressState {
  getStateInfo(): ProgressStateInfo {
    return {
      state: 'excellent',
      message: 'Perfect day! All targets met',
      color: 'violet',
      icon: '⭐',
      encouragement: 'Outstanding! You\'ve balanced calories and macros perfectly',
      nextAction: 'Keep up this amazing consistency',
    };
  }
  canTransitionTo(state: ProgressStateType): boolean {
    return false; // Best possible state
  }
  getProgress(): number { return 100; }
}

/**
 * Progress State Machine
 * Determines and manages the current progress state
 */
export class ProgressStateMachine {
  private currentState: ProgressState;
  private stateHistory: ProgressStateType[] = [];

  constructor() {
    this.currentState = new NotStartedState();
  }

  /**
   * Evaluate progress and determine appropriate state
   */
  evaluateProgress(progress: DailyProgress, todayLog: DailyLog): ProgressStateInfo {
    const caloriePercentage = progress.goalCalories > 0 
      ? (progress.calories.achieved / progress.goalCalories) * 100 
      : 0;

    const hasLoggedFood = todayLog.foods.length > 0;
    const macrosBalanced = this.checkMacroBalance(progress);

    // Determine state based on progress
    let newState: ProgressState;

    if (!hasLoggedFood) {
      newState = new NotStartedState();
    } else if (caloriePercentage < 50) {
      newState = new UnderTargetState(caloriePercentage);
    } else if (caloriePercentage < 80) {
      newState = new OnTrackState(caloriePercentage);
    } else if (caloriePercentage < 95) {
      newState = new NearTargetState(caloriePercentage);
    } else if (caloriePercentage <= 105) {
      // Check if macros are also balanced for excellent state
      if (macrosBalanced && caloriePercentage >= 95 && caloriePercentage <= 105) {
        newState = new ExcellentState();
      } else {
        newState = new TargetReachedState();
      }
    } else {
      newState = new OverTargetState(caloriePercentage);
    }

    this.currentState = newState;
    const stateInfo = newState.getStateInfo();
    
    // Track state history
    if (this.stateHistory[this.stateHistory.length - 1] !== stateInfo.state) {
      this.stateHistory.push(stateInfo.state);
    }

    return stateInfo;
  }

  /**
   * Check if macros are within acceptable range
   */
  private checkMacroBalance(progress: DailyProgress): boolean {
    const proteinRatio = progress.proteinTarget > 0 
      ? progress.protein / progress.proteinTarget 
      : 0;
    const carbRatio = progress.carbTarget > 0 
      ? progress.carbs / progress.carbTarget 
      : 0;
    const fatRatio = progress.fatTarget > 0 
      ? progress.fat / progress.fatTarget 
      : 0;

    // All macros should be between 80% and 120% of target
    return (
      proteinRatio >= 0.8 && proteinRatio <= 1.2 &&
      carbRatio >= 0.8 && carbRatio <= 1.2 &&
      fatRatio >= 0.8 && fatRatio <= 1.2
    );
  }

  getCurrentState(): ProgressState {
    return this.currentState;
  }

  getStateHistory(): ProgressStateType[] {
    return [...this.stateHistory];
  }

  /**
   * Get motivational message based on time of day and progress
   */
  getTimeBasedMotivation(progress: DailyProgress): string {
    const hour = new Date().getHours();
    const caloriePercentage = progress.goalCalories > 0 
      ? (progress.calories.achieved / progress.goalCalories) * 100 
      : 0;

    if (hour < 12) {
      // Morning
      if (caloriePercentage < 30) {
        return "Good morning! Start your day with a nutritious breakfast 🌅";
      }
      return "Great start to the day! Keep the momentum going 💪";
    } else if (hour < 17) {
      // Afternoon
      if (caloriePercentage < 50) {
        return "Don't forget to fuel up for the afternoon! 🥗";
      }
      return "You're making great progress today! 📈";
    } else if (hour < 21) {
      // Evening
      if (caloriePercentage < 70) {
        return "Time for dinner! You have room for a good meal 🍽️";
      }
      return "Almost done for the day! Finish strong 🎯";
    } else {
      // Night
      if (caloriePercentage > 100) {
        return "Consider a light walk before bed to balance today's intake 🌙";
      }
      return "Great job today! Rest well and recover 😴";
    }
  }
}

// Singleton instance
let stateMachineInstance: ProgressStateMachine | null = null;

export const getProgressStateMachine = (): ProgressStateMachine => {
  if (!stateMachineInstance) {
    stateMachineInstance = new ProgressStateMachine();
  }
  return stateMachineInstance;
};
