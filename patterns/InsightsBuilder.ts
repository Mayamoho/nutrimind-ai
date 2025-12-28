/**
 * Nutrition Insights Builder Pattern
 * Constructs detailed nutrition insights step by step
 */

import { DailyLog, DailyProgress, UserGoals, WeightLog } from '../types';

export interface NutritionInsight {
  type: 'positive' | 'warning' | 'info' | 'achievement';
  category: 'calories' | 'protein' | 'carbs' | 'fat' | 'water' | 'exercise' | 'streak' | 'weight';
  title: string;
  message: string;
  value?: number;
  target?: number;
  trend?: 'up' | 'down' | 'stable';
  priority: number; // 1-10, higher = more important
}

export interface DailyInsightsReport {
  date: string;
  overallScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  insights: NutritionInsight[];
  topAchievement: string | null;
  primaryFocus: string;
  calorieBalance: number;
  macroBalance: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

/**
 * Insights Builder
 * Builds comprehensive nutrition insights report
 */
export class InsightsBuilder {
  private insights: NutritionInsight[] = [];
  private date: string = '';
  private progress: DailyProgress | null = null;
  private todayLog: DailyLog | null = null;
  private goals: UserGoals | null = null;
  private weightLog: WeightLog[] = [];
  private dailyLogs: DailyLog[] = [];

  reset(): InsightsBuilder {
    this.insights = [];
    this.date = new Date().toISOString().split('T')[0];
    return this;
  }

  setDate(date: string): InsightsBuilder {
    this.date = date;
    return this;
  }

  setProgress(progress: DailyProgress): InsightsBuilder {
    this.progress = progress;
    return this;
  }

  setTodayLog(log: DailyLog): InsightsBuilder {
    this.todayLog = log;
    return this;
  }

  setGoals(goals: UserGoals): InsightsBuilder {
    this.goals = goals;
    return this;
  }

  setWeightLog(weightLog: WeightLog[]): InsightsBuilder {
    this.weightLog = weightLog;
    return this;
  }

  setDailyLogs(logs: DailyLog[]): InsightsBuilder {
    this.dailyLogs = logs;
    return this;
  }

  analyzeCalories(): InsightsBuilder {
    if (!this.progress) return this;

    const { calories, goalCalories } = this.progress;
    const percentage = goalCalories > 0 ? (calories.achieved / goalCalories) * 100 : 0;
    const remaining = goalCalories - calories.achieved;

    if (percentage >= 95 && percentage <= 105) {
      this.insights.push({
        type: 'achievement',
        category: 'calories',
        title: 'Perfect Calorie Balance! 🎯',
        message: 'You\'re right on target with your calorie intake today.',
        value: calories.achieved,
        target: goalCalories,
        priority: 10,
      });
    } else if (percentage < 50) {
      this.insights.push({
        type: 'warning',
        category: 'calories',
        title: 'Low Calorie Intake',
        message: `You've only consumed ${Math.round(percentage)}% of your daily target. Make sure to eat enough!`,
        value: calories.achieved,
        target: goalCalories,
        priority: 8,
      });
    } else if (percentage > 120) {
      this.insights.push({
        type: 'warning',
        category: 'calories',
        title: 'Over Calorie Target',
        message: `You're ${Math.round(percentage - 100)}% over your target. Consider some exercise to balance.`,
        value: calories.achieved,
        target: goalCalories,
        priority: 7,
      });
    } else if (remaining > 0 && remaining < 300) {
      this.insights.push({
        type: 'info',
        category: 'calories',
        title: 'Almost There!',
        message: `Just ${Math.round(remaining)} calories to go. A healthy snack would be perfect.`,
        value: calories.achieved,
        target: goalCalories,
        priority: 5,
      });
    }

    return this;
  }

  analyzeProtein(): InsightsBuilder {
    if (!this.progress) return this;

    const { protein, proteinTarget } = this.progress;
    const percentage = proteinTarget > 0 ? (protein / proteinTarget) * 100 : 0;

    if (percentage >= 100) {
      this.insights.push({
        type: 'positive',
        category: 'protein',
        title: 'Protein Goal Met! 💪',
        message: 'Great job hitting your protein target. This supports muscle maintenance and satiety.',
        value: protein,
        target: proteinTarget,
        priority: 6,
      });
    } else if (percentage < 50) {
      this.insights.push({
        type: 'warning',
        category: 'protein',
        title: 'Low Protein Intake',
        message: `Only ${Math.round(percentage)}% of protein target. Add lean meats, eggs, or legumes.`,
        value: protein,
        target: proteinTarget,
        priority: 7,
      });
    }

    return this;
  }

  analyzeCarbs(): InsightsBuilder {
    if (!this.progress) return this;

    const { carbs, carbTarget } = this.progress;
    const percentage = carbTarget > 0 ? (carbs / carbTarget) * 100 : 0;

    if (percentage > 130) {
      this.insights.push({
        type: 'warning',
        category: 'carbs',
        title: 'High Carb Intake',
        message: 'Carbs are significantly over target. Consider balancing with more protein and vegetables.',
        value: carbs,
        target: carbTarget,
        priority: 5,
      });
    } else if (percentage >= 80 && percentage <= 120) {
      this.insights.push({
        type: 'positive',
        category: 'carbs',
        title: 'Balanced Carbs',
        message: 'Your carbohydrate intake is well balanced for sustained energy.',
        value: carbs,
        target: carbTarget,
        priority: 3,
      });
    }

    return this;
  }

  analyzeFat(): InsightsBuilder {
    if (!this.progress) return this;

    const { fat, fatTarget } = this.progress;
    const percentage = fatTarget > 0 ? (fat / fatTarget) * 100 : 0;

    if (percentage > 140) {
      this.insights.push({
        type: 'warning',
        category: 'fat',
        title: 'High Fat Intake',
        message: 'Fat intake is high today. Choose leaner options for remaining meals.',
        value: fat,
        target: fatTarget,
        priority: 5,
      });
    } else if (percentage < 40) {
      this.insights.push({
        type: 'info',
        category: 'fat',
        title: 'Low Fat Intake',
        message: 'Healthy fats are important! Add avocado, nuts, or olive oil.',
        value: fat,
        target: fatTarget,
        priority: 4,
      });
    }

    return this;
  }

  analyzeWater(): InsightsBuilder {
    if (!this.todayLog || !this.progress) return this;

    const waterIntake = this.todayLog.waterIntake || 0;
    const waterTarget = this.progress.waterTarget || 2500;
    const percentage = (waterIntake / waterTarget) * 100;

    if (percentage >= 100) {
      this.insights.push({
        type: 'achievement',
        category: 'water',
        title: 'Hydration Goal Met! 💧',
        message: 'Excellent hydration today! This supports metabolism and energy levels.',
        value: waterIntake,
        target: waterTarget,
        priority: 6,
      });
    } else if (percentage < 30) {
      this.insights.push({
        type: 'warning',
        category: 'water',
        title: 'Drink More Water',
        message: `Only ${Math.round(percentage)}% of water goal. Dehydration affects energy and focus.`,
        value: waterIntake,
        target: waterTarget,
        priority: 8,
      });
    }

    return this;
  }

  analyzeExercise(): InsightsBuilder {
    if (!this.todayLog) return this;

    const exerciseCalories = this.todayLog.exercises.reduce((sum, e) => sum + e.caloriesBurned, 0);
    const exerciseCount = this.todayLog.exercises.length;

    if (exerciseCalories >= 300) {
      this.insights.push({
        type: 'achievement',
        category: 'exercise',
        title: 'Great Workout! 🏃',
        message: `You burned ${exerciseCalories} calories through ${exerciseCount} exercise(s). Keep it up!`,
        value: exerciseCalories,
        priority: 7,
      });
    } else if (exerciseCount === 0) {
      this.insights.push({
        type: 'info',
        category: 'exercise',
        title: 'No Exercise Logged',
        message: 'Even a 15-minute walk can boost your mood and metabolism.',
        priority: 3,
      });
    }

    return this;
  }

  analyzeWeightTrend(): InsightsBuilder {
    if (this.weightLog.length < 2 || !this.goals) return this;

    const sortedLogs = [...this.weightLog].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const currentWeight = sortedLogs[0].weight;
    const previousWeight = sortedLogs[1].weight;
    const weightChange = currentWeight - previousWeight;
    const targetWeight = this.goals.targetWeight;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (weightChange > 0.2) trend = 'up';
    else if (weightChange < -0.2) trend = 'down';

    // Check if trend aligns with goal
    const wantToLose = this.goals.weightGoal === 'lose';
    const wantToGain = this.goals.weightGoal === 'gain';

    if (wantToLose && trend === 'down') {
      this.insights.push({
        type: 'positive',
        category: 'weight',
        title: 'Weight Trending Down! 📉',
        message: `You've lost ${Math.abs(weightChange).toFixed(1)}kg. You're on track to reach ${targetWeight}kg.`,
        value: currentWeight,
        target: targetWeight,
        trend,
        priority: 9,
      });
    } else if (wantToGain && trend === 'up') {
      this.insights.push({
        type: 'positive',
        category: 'weight',
        title: 'Weight Trending Up! 📈',
        message: `You've gained ${weightChange.toFixed(1)}kg. Progress toward ${targetWeight}kg.`,
        value: currentWeight,
        target: targetWeight,
        trend,
        priority: 9,
      });
    } else if (wantToLose && trend === 'up') {
      this.insights.push({
        type: 'warning',
        category: 'weight',
        title: 'Weight Increased',
        message: 'Weight went up slightly. Review your calorie intake and stay consistent.',
        value: currentWeight,
        target: targetWeight,
        trend,
        priority: 7,
      });
    }

    return this;
  }

  analyzeStreak(): InsightsBuilder {
    if (this.dailyLogs.length === 0) return this;

    // Calculate streak
    const sortedLogs = [...this.dailyLogs]
      .filter(log => log.foods.length > 0 || log.exercises.length > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedLogs.length; i++) {
      const logDate = new Date(sortedLogs[i].date);
      logDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (logDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    if (streak >= 7) {
      this.insights.push({
        type: 'achievement',
        category: 'streak',
        title: `${streak} Day Streak! 🔥`,
        message: 'Amazing consistency! You\'re building great habits.',
        value: streak,
        priority: 8,
      });
    } else if (streak >= 3) {
      this.insights.push({
        type: 'positive',
        category: 'streak',
        title: `${streak} Day Streak`,
        message: 'Keep the momentum going! Consistency is key.',
        value: streak,
        priority: 5,
      });
    }

    return this;
  }

  build(): DailyInsightsReport {
    // Sort insights by priority
    this.insights.sort((a, b) => b.priority - a.priority);

    // Calculate overall score
    const score = this.calculateOverallScore();
    const grade = this.calculateGrade(score);

    // Find top achievement
    const achievements = this.insights.filter(i => i.type === 'achievement');
    const topAchievement = achievements.length > 0 ? achievements[0].title : null;

    // Determine primary focus (highest priority warning or info)
    const focusInsight = this.insights.find(i => i.type === 'warning' || i.type === 'info');
    const primaryFocus = focusInsight?.message || 'Keep up the great work!';

    // Calculate balances
    const calorieBalance = this.progress 
      ? this.progress.calories.achieved - this.progress.goalCalories 
      : 0;

    const macroBalance = {
      protein: this.progress?.proteinTarget 
        ? Math.round((this.progress.protein / this.progress.proteinTarget) * 100) 
        : 0,
      carbs: this.progress?.carbTarget 
        ? Math.round((this.progress.carbs / this.progress.carbTarget) * 100) 
        : 0,
      fat: this.progress?.fatTarget 
        ? Math.round((this.progress.fat / this.progress.fatTarget) * 100) 
        : 0,
    };

    return {
      date: this.date,
      overallScore: score,
      grade,
      insights: this.insights,
      topAchievement,
      primaryFocus,
      calorieBalance,
      macroBalance,
    };
  }

  private calculateOverallScore(): number {
    if (!this.progress) return 0;

    let score = 50; // Base score

    // Calorie accuracy (up to 30 points)
    const calorieAccuracy = this.progress.goalCalories > 0
      ? Math.abs(100 - (this.progress.calories.achieved / this.progress.goalCalories) * 100)
      : 50;
    score += Math.max(0, 30 - calorieAccuracy);

    // Protein (up to 10 points)
    const proteinRatio = this.progress.proteinTarget > 0
      ? this.progress.protein / this.progress.proteinTarget
      : 0;
    if (proteinRatio >= 0.8 && proteinRatio <= 1.2) score += 10;
    else if (proteinRatio >= 0.5) score += 5;

    // Water (up to 10 points)
    const waterRatio = this.todayLog && this.progress.waterTarget > 0
      ? (this.todayLog.waterIntake || 0) / this.progress.waterTarget
      : 0;
    if (waterRatio >= 1) score += 10;
    else score += Math.round(waterRatio * 10);

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}

// Director for common insight reports
export class InsightsDirector {
  private builder: InsightsBuilder;

  constructor() {
    this.builder = new InsightsBuilder();
  }

  buildDailyReport(
    progress: DailyProgress,
    todayLog: DailyLog,
    goals: UserGoals,
    weightLog: WeightLog[],
    dailyLogs: DailyLog[]
  ): DailyInsightsReport {
    return this.builder
      .reset()
      .setProgress(progress)
      .setTodayLog(todayLog)
      .setGoals(goals)
      .setWeightLog(weightLog)
      .setDailyLogs(dailyLogs)
      .analyzeCalories()
      .analyzeProtein()
      .analyzeCarbs()
      .analyzeFat()
      .analyzeWater()
      .analyzeExercise()
      .analyzeWeightTrend()
      .analyzeStreak()
      .build();
  }

  buildQuickReport(progress: DailyProgress, todayLog: DailyLog): DailyInsightsReport {
    return this.builder
      .reset()
      .setProgress(progress)
      .setTodayLog(todayLog)
      .analyzeCalories()
      .analyzeProtein()
      .analyzeWater()
      .build();
  }
}

// Singleton instance
let insightsDirectorInstance: InsightsDirector | null = null;

export const getInsightsDirector = (): InsightsDirector => {
  if (!insightsDirectorInstance) {
    insightsDirectorInstance = new InsightsDirector();
  }
  return insightsDirectorInstance;
};
