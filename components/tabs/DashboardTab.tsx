/**
 * Dashboard Tab
 * Daily overview with targets, calorie breakdown, insights, and quick stats
 */

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { FoodLog, ExerciseLog } from '../../types';
import TargetCard from '../TargetCard';
import CalorieBreakdown from '../CalorieBreakdown';
import DailyInsights from '../DailyInsights';
import BMIStatus from '../BMIStatus';
import WaterTracker from '../WaterTracker';

const defaultProgress = {
  calories: { achieved: 0, eat: 0 },
  protein: 0, carbs: 0, fat: 0,
  bmr: 0, neat: 0, tef: 0,
  totalCaloriesOut: 0, netCalories: 0, goalCalories: 0,
  proteinTarget: 0, carbTarget: 0, fatTarget: 0, waterTarget: 2000,
  microNutrients: {
    fiber: { achieved: 0, target: 25 },
    sugar: { achieved: 0, target: 50 },
    sodium: { achieved: 0, target: 2300 },
    potassium: { achieved: 0, target: 3500 },
    vitaminA: { achieved: 0, target: 900 },
    vitaminC: { achieved: 0, target: 90 },
    vitaminD: { achieved: 0, target: 20 },
    calcium: { achieved: 0, target: 1000 },
    iron: { achieved: 0, target: 18 },
    magnesium: { achieved: 0, target: 420 },
    zinc: { achieved: 0, target: 11 },
    cholesterol: { achieved: 0, target: 300 }
  },
  microNutrientStatus: {
    overallScore: 0,
    topDeficiencies: [],
    topAdequate: [],
    recommendations: []
  }
};

const DashboardTab: React.FC = () => {
  try {
    const { user } = useAuth();
    const dataContext = useData();

    const dailyProgress = dataContext?.dailyProgress || defaultProgress;
    const weightLog = dataContext?.weightLog || [];
    const currentStreak = dataContext?.currentStreak || 0;
    const todayLog = dataContext?.todayLog || { date: '', foods: [], exercises: [], neatActivities: [], waterIntake: 0 };

    if (!user) return null;

  const currentWeight = weightLog?.length > 0 
    ? weightLog[weightLog.length - 1]?.weight 
    : user?.weight || 0;

  // Calculate quick stats
  const totalFoodsToday = todayLog.foods?.length || 0;
  const totalExercisesToday = todayLog.exercises?.length || 0;
  const totalNeatToday = todayLog.neatActivities?.length || 0;
  const caloriesConsumed = dailyProgress?.calories?.achieved || 0;
  const caloriesBurned = dailyProgress?.totalCaloriesOut || 0;
  const waterIntake = todayLog?.waterIntake || 0;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header with Stats */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">
              {getGreeting()}, {user.lastName}! 👋
            </h2>
            <p className="text-white/80 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          {/* Quick Stats Pills */}
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <div>
                <p className="text-xs text-white/70">Streak</p>
                <p className="font-bold">{currentStreak} days</p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
              <span className="text-xl">🍽️</span>
              <div>
                <p className="text-xs text-white/70">Meals</p>
                <p className="font-bold">{totalFoodsToday}</p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
              <span className="text-xl">💪</span>
              <div>
                <p className="text-xs text-white/70">Workouts</p>
                <p className="font-bold">{totalExercisesToday}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calorie Summary Bar */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white/80">Daily Calorie Balance</span>
            <span className="font-bold">
              {Math.round(caloriesConsumed)} / {Math.round(dailyProgress.goalCalories)} kcal
            </span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${Math.min((caloriesConsumed / dailyProgress.goalCalories) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/70">
            <span>Consumed: {Math.round(caloriesConsumed)} kcal</span>
            <span>Burned: {Math.round(caloriesBurned)} kcal</span>
          </div>
        </div>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <span className="text-xl">🍎</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Calories In</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{Math.round(caloriesConsumed)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <span className="text-xl">🔥</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Calories Out</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{Math.round(caloriesBurned)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
              <span className="text-xl">💧</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Water</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{(waterIntake / 1000).toFixed(1)}L</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <span className="text-xl">🚶</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">NEAT</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{totalNeatToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Target Card */}
      <TargetCard progress={dailyProgress} />

      {/* Calorie Breakdown - Full Width */}
      <CalorieBreakdown progress={dailyProgress} />

      {/* Water Tracker & BMI Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WaterTracker />
        <BMIStatus weight={currentWeight} height={user.height} />
      </div>

      {/* Daily Insights */}
      <DailyInsights />
    </div>
  );
  } catch (error) {
    console.error('Error in DashboardTab:', error);
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold mb-2">Dashboard Error</h2>
        <p className="text-sm text-slate-600">There was an error loading the dashboard. Please refresh the page.</p>
      </div>
    );
  }
};

export default DashboardTab;
