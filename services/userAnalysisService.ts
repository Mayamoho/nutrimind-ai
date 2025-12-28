import { getUserData } from './userService';
import { getRecentFoodLogs } from './foodLogService';
import { getActivityData } from './activityService';

export async function analyzeUserData(userId: string) {
  const [userData, foodLogs, activityData] = await Promise.all([
    getUserData(userId),
    getRecentFoodLogs(userId, 7),
    getActivityData(userId, 7)
  ]);

  const nutrition = analyzeNutrition(foodLogs);
  const activity = analyzeActivity(activityData);

  return {
    user: userData,
    nutrition,
    activity,
    energyBalance: calculateEnergyBalance(userData, nutrition, activity)
  };
}

function analyzeNutrition(foodLogs: any[]) {
  // Implementation for nutrition analysis
  const totals = foodLogs.reduce((acc, log) => {
    acc.calories += log.calories || 0;
    acc.protein += log.nutrients?.protein || 0;
    acc.carbs += log.nutrients?.carbs || 0;
    acc.fat += log.nutrients?.fat || 0;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const averages = {
    dailyCalories: totals.calories / 7,
    dailyProtein: totals.protein / 7,
    dailyCarbs: totals.carbs / 7,
    dailyFat: totals.fat / 7
  };

  return { totals, averages };
}

function analyzeActivity(activityData: any[]) {
  // Implementation for activity analysis
  const totalSteps = activityData.reduce((sum, day) => sum + (day.steps || 0), 0);
  const avgDailySteps = totalSteps / Math.max(1, activityData.length);
  
  return {
    totalSteps,
    avgDailySteps,
    activityLevel: calculateActivityLevel(avgDailySteps)
  };
}

function calculateActivityLevel(steps: number): string {
  if (steps < 3000) return 'sedentary';
  if (steps < 7000) return 'lightly active';
  if (steps < 10000) return 'moderately active';
  return 'very active';
}

function calculateEnergyBalance(user: any, nutrition: any, activity: any) {
  // Use user profile (weight/height/age/gender) when available to compute BMR
  const bmr = calculateBMRFromUser(user, nutrition);
  const tdee = calculateTDEE(bmr, activity.activityLevel);
  const calorieBalance = (nutrition.totals?.calories || 0) - tdee;

  return {
    bmr,
    tdee,
    calorieBalance,
    status: calorieBalance > 0 ? 'surplus' : 'deficit'
  };
}

function calculateBMRFromUser(user: any, nutrition?: any) {
  // Mifflin–St Jeor equation. Assumes weight in kg and height in cm where possible.
  if (user && user.weight && user.height && user.age && user.gender) {
    const weightKg = Number(user.weight);
    const heightCm = Number(user.height);
    const age = Number(user.age);
    if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || !Number.isFinite(age)) {
      return 2000;
    }
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    if (String(user.gender).toLowerCase().startsWith('m')) {
      return Math.round(base + 5);
    }
    return Math.round(base - 161);
  }
  // Fallback: estimate from provided nutrition averages if available
  if (nutrition && nutrition.averages && nutrition.averages.dailyCalories) {
    return Math.round(((nutrition.averages.dailyCalories || 2000) / 1.375));
  }
  return 2000;
}

function calculateTDEE(bmr: number, activityLevel: string) {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    'lightly active': 1.375,
    'moderately active': 1.55,
    'very active': 1.725
  };
  return bmr * (multipliers[activityLevel] || 1.2);
}
