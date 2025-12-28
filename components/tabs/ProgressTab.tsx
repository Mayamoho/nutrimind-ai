/**
 * Progress Tab - Enhanced with more engaging features
 * Weight progress, charts, projections, streaks, milestones, and insights
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import WeightProgress from '../WeightProgress';
import WeightProjectionChart from '../WeightProjectionChart';
import HistoryChart from '../HistoryChart';
import GoalSettingsModal from '../GoalSettingsModal';
import NutrientBreakdown from '../NutrientBreakdown';
import { TargetIcon } from '../icons/TargetIcon';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { getEffectiveDate } from '../../utils/dateUtils';

// Period filter strategy pattern
type PeriodType = '1' | '3' | '7' | '30' | 'lifetime';

const periodFilterStrategy = {
  '1': (logs: any[]) => logs.slice(-1),
  '3': (logs: any[]) => logs.slice(-3),
  '7': (logs: any[]) => logs.slice(-7),
  '30': (logs: any[]) => logs.slice(-30),
  'lifetime': (logs: any[]) => logs,
};

const ProgressTab: React.FC = () => {
  const { user } = useAuth();
  const dataContext = useData();

  const userGoals = dataContext?.userGoals || { targetWeight: 0, weightGoal: 'maintain' as const, goalTimeline: 0 };
  const updateGoals = dataContext?.updateGoals || (() => {});
  const dailyLogs = dataContext?.dailyLogs || [];
  const weightLog = dataContext?.weightLog || [];
  const currentStreak = dataContext?.currentStreak || 0;
  const bestStreak = dataContext?.bestStreak || 0;
  const projectedWeight = dataContext?.projectedWeight || 0;

  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'weight' | 'nutrition'>('overview');
  const [calorieTrendPeriod, setCalorieTrendPeriod] = useState<PeriodType>('7');

  if (!user) return null;

  const currentWeight = weightLog.length > 0 ? (weightLog[weightLog.length - 1].weight || 0) : (user.weight || 0);

  // Calculate BMR
  const bmr = useMemo(() => {
    const { weight = 70, height = 170, age = 30, gender = 'female' } = user;
    const weightNum = Number(weight) || 70;
    const heightNum = Number(height) || 170;
    const ageNum = Number(age) || 30;
    return Math.round(10 * weightNum + 6.25 * heightNum - 5 * ageNum + (gender === 'male' ? 5 : -161));
  }, [user]);

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    const logsWithActivity = dailyLogs.filter(log => log.foods?.length > 0 || log.exercises?.length > 0);
    
    let totalCaloriesIn = 0;
    let totalExerciseBurn = 0;
    let totalNeatBurn = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalWater = 0;
    let totalFoods = 0;
    let totalExercises = 0;

    dailyLogs.forEach(log => {
      (log.foods || []).forEach(f => {
        totalCaloriesIn += f.calories || 0;
        totalFoods++;
        const p = f.nutrients?.macros?.find(m => m.name === 'Protein');
        const c = f.nutrients?.macros?.find(m => m.name === 'Carbs');
        const fa = f.nutrients?.macros?.find(m => m.name === 'Fat');
        totalProtein += p?.amount || 0;
        totalCarbs += c?.amount || 0;
        totalFat += fa?.amount || 0;
      });
      (log.exercises || []).forEach(e => {
        totalExerciseBurn += e.caloriesBurned || 0;
        totalExercises++;
      });
      (log.neatActivities || []).forEach(a => {
        totalNeatBurn += a.calories || 0;
      });
      totalWater += log.waterIntake || 0;
    });

    // Calculate total burn including BMR for each day
    const totalBurn = (logsWithActivity.length * bmr) + totalExerciseBurn + totalNeatBurn + Math.round(totalCaloriesIn * 0.1);

    const avgDailyIntake = logsWithActivity.length > 0 ? (totalCaloriesIn / logsWithActivity.length) || 0 : 0;
    const avgDailyBurn = logsWithActivity.length > 0 ? (totalBurn / logsWithActivity.length) || bmr : bmr;

    return {
      totalDaysLogged: logsWithActivity.length,
      totalCaloriesIn,
      totalBurn,
      totalExerciseBurn,
      totalNeatBurn,
      totalProtein,
      totalCarbs,
      totalFat,
      totalWater,
      totalFoods,
      totalExercises,
      avgDailyIntake,
      avgDailyBurn,
      weightChange: weightLog.length > 1 ? currentWeight - weightLog[0].weight : 0,
      weightToGoal: userGoals.targetWeight ? currentWeight - userGoals.targetWeight : 0,
    };
  }, [dailyLogs, weightLog, currentWeight, userGoals.targetWeight, bmr]);

  // Calculate weekly comparison
  const weeklyComparison = useMemo(() => {
    const effectiveToday = getEffectiveDate();
    const todayDate = new Date(effectiveToday);
    const oneWeekAgo = new Date(todayDate);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(todayDate);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
    const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

    const thisWeekLogs = dailyLogs.filter(log => log.date >= oneWeekAgoStr && log.date <= effectiveToday);
    const lastWeekLogs = dailyLogs.filter(log => log.date >= twoWeeksAgoStr && log.date < oneWeekAgoStr);

    const thisWeekCalories = thisWeekLogs.reduce((sum, log) => 
      sum + (log.foods || []).reduce((s, f) => s + (f.calories || 0), 0), 0);
    const lastWeekCalories = lastWeekLogs.reduce((sum, log) => 
      sum + (log.foods || []).reduce((s, f) => s + (f.calories || 0), 0), 0);

    const thisWeekExercise = thisWeekLogs.reduce((sum, log) => 
      sum + (log.exercises || []).reduce((s, e) => s + (e.caloriesBurned || 0), 0), 0);
    const lastWeekExercise = lastWeekLogs.reduce((sum, log) => 
      sum + (log.exercises || []).reduce((s, e) => s + (e.caloriesBurned || 0), 0), 0);

    return {
      calorieChange: lastWeekCalories > 0 ? ((thisWeekCalories - lastWeekCalories) / lastWeekCalories) * 100 : 0,
      exerciseChange: lastWeekExercise > 0 ? ((thisWeekExercise - lastWeekExercise) / lastWeekExercise) * 100 : 0,
      thisWeekDays: thisWeekLogs.filter(l => l.foods?.length > 0 || l.exercises?.length > 0).length,
      lastWeekDays: lastWeekLogs.filter(l => l.foods?.length > 0 || l.exercises?.length > 0).length,
    };
  }, [dailyLogs]);

  // Milestones
  const milestones = useMemo(() => {
    const achieved = [];
    if (stats.totalDaysLogged >= 7) achieved.push({ icon: '📅', text: '1 Week Logged', tier: 'bronze' });
    if (stats.totalDaysLogged >= 30) achieved.push({ icon: '📆', text: '1 Month Logged', tier: 'silver' });
    if (stats.totalFoods >= 50) achieved.push({ icon: '🍽️', text: '50 Meals Tracked', tier: 'bronze' });
    if (stats.totalFoods >= 200) achieved.push({ icon: '🍽️', text: '200 Meals Tracked', tier: 'silver' });
    if (stats.totalExercises >= 20) achieved.push({ icon: '💪', text: '20 Workouts', tier: 'bronze' });
    if (stats.totalExercises >= 50) achieved.push({ icon: '💪', text: '50 Workouts', tier: 'silver' });
    if (bestStreak >= 7) achieved.push({ icon: '🔥', text: '7-Day Streak', tier: 'bronze' });
    if (bestStreak >= 30) achieved.push({ icon: '🔥', text: '30-Day Streak', tier: 'gold' });
    if (stats.totalWater >= 20000) achieved.push({ icon: '💧', text: '20L Water', tier: 'bronze' });
    if (Math.abs(stats.weightChange) >= 1) achieved.push({ icon: '⚖️', text: '1kg Progress', tier: 'bronze' });
    if (Math.abs(stats.weightChange) >= 5) achieved.push({ icon: '⚖️', text: '5kg Progress', tier: 'gold' });
    return achieved;
  }, [stats, bestStreak]);

  const tierColors = {
    bronze: 'from-amber-600 to-orange-700',
    silver: 'from-slate-300 to-slate-400',
    gold: 'from-yellow-400 to-amber-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <span className="text-3xl">📈</span> Your Progress
            </h2>
            <p className="text-white/80 mt-1">Track your journey and celebrate your wins</p>
          </div>
          <button
            onClick={() => setIsGoalsModalOpen(true)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-2.5 px-5 rounded-xl transition-all"
          >
            <TargetIcon />
            <span>Set Goals</span>
          </button>
        </div>

        {/* Weight Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-white/70 text-xs font-medium">Current</p>
            <p className="text-2xl font-bold mt-1">{currentWeight.toFixed(1)} kg</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-white/70 text-xs font-medium">Target</p>
            <p className="text-2xl font-bold mt-1">{userGoals.targetWeight || currentWeight} kg</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-white/70 text-xs font-medium">To Goal</p>
            <p className={`text-2xl font-bold mt-1 ${stats.weightToGoal <= 0 ? 'text-emerald-300' : ''}`}>
              {stats.weightToGoal > 0 ? '-' : '+'}{Math.abs(stats.weightToGoal).toFixed(1)} kg
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-white/70 text-xs font-medium">Projected</p>
            <p className="text-2xl font-bold mt-1">{projectedWeight.toFixed(1)} kg</p>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'weight', label: 'Weight', icon: '⚖️' },
          { id: 'nutrition', label: 'Nutrition', icon: '🍎' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeView === tab.id
                ? 'bg-violet-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Streak Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🔥</span>
              <div>
                <p className="text-white/80 text-sm">Current Streak</p>
                <p className="text-3xl font-bold">{currentStreak} days</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-xs">Keep going!</p>
              <p className="text-lg font-semibold">
                {currentStreak >= 7 ? '🏆 Amazing!' : currentStreak >= 3 ? '⭐ Great!' : '💪 Start!'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🏆</span>
              <div>
                <p className="text-white/80 text-sm">Best Streak</p>
                <p className="text-3xl font-bold">{bestStreak} days</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-xs">Personal best</p>
              <p className="text-lg font-semibold">
                {bestStreak >= 30 ? '👑 Legend!' : bestStreak >= 14 ? '🌟 Pro!' : '🎯 Growing!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {activeView === 'overview' && (
        <>
          {/* Goal Progress Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span>🎯</span> Your Goal Progress
            </h3>
            <div className="space-y-4">
              {/* Weight Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    {userGoals.weightGoal === 'lose' ? 'Weight Loss Progress' : 
                     userGoals.weightGoal === 'gain' ? 'Weight Gain Progress' : 'Weight Maintenance'}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-white">
                    {Math.abs(stats.weightChange).toFixed(1)} kg {stats.weightChange < 0 ? 'lost' : stats.weightChange > 0 ? 'gained' : ''}
                  </span>
                </div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      (userGoals.weightGoal === 'lose' && stats.weightChange < 0) || 
                      (userGoals.weightGoal === 'gain' && stats.weightChange > 0) ||
                      userGoals.weightGoal === 'maintain'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                        : 'bg-gradient-to-r from-amber-500 to-orange-500'
                    }`}
                    style={{ 
                      width: `${Math.min(Math.abs(stats.weightToGoal) > 0 
                        ? (Math.abs(stats.weightChange) / Math.abs(stats.weightToGoal + stats.weightChange)) * 100 
                        : 100, 100)}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {stats.weightToGoal === 0 
                    ? '🎉 You\'ve reached your goal!' 
                    : `${Math.abs(stats.weightToGoal).toFixed(1)} kg to go`}
                </p>
              </div>

              {/* Calorie Balance Status */}
              <div className={`p-4 rounded-xl ${
                stats.avgDailyIntake < stats.avgDailyBurn 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' 
                  : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      {stats.avgDailyIntake < stats.avgDailyBurn ? '📉 Calorie Deficit' : '📈 Calorie Surplus'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Avg {Math.round(Math.abs(stats.avgDailyIntake - stats.avgDailyBurn))} kcal/day {stats.avgDailyIntake < stats.avgDailyBurn ? 'deficit' : 'surplus'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${stats.avgDailyIntake < stats.avgDailyBurn ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {stats.avgDailyIntake < stats.avgDailyBurn ? '-' : '+'}{Math.round(Math.abs(stats.avgDailyIntake - stats.avgDailyBurn))}
                    </p>
                    <p className="text-xs text-slate-500">kcal/day</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span>💡</span> Quick Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Consistency Score */}
              <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-lg">
                    {Math.min(Math.round((stats.totalDaysLogged / 30) * 100), 100)}%
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">Consistency Score</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {stats.totalDaysLogged} days logged
                    </p>
                  </div>
                </div>
              </div>

              {/* Avg Calories */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xl">
                    🍽️
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{Math.round(stats.avgDailyIntake)} kcal</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Avg daily intake</p>
                  </div>
                </div>
              </div>

              {/* Exercise Frequency */}
              <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white text-xl">
                    💪
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      {stats.totalDaysLogged > 0 ? (stats.totalExercises / stats.totalDaysLogged).toFixed(1) : '0'} workouts/day
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{stats.totalExercises} total workouts</p>
                  </div>
                </div>
              </div>

              {/* Projected Timeline */}
              <div className="p-4 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-white text-xl">
                    📅
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      {(() => {
                        const weeklyChange = ((stats.avgDailyIntake - stats.avgDailyBurn) * 7) / 7700;
                        const weeksToGoal = Math.abs(stats.weightToGoal) / Math.abs(weeklyChange || 0.1);
                        return weeksToGoal > 52 ? '52+ weeks' : `~${Math.ceil(weeksToGoal)} weeks`;
                      })()}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Est. time to goal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Day-by-Day Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span>📋</span> Last 7 Days Summary
            </h3>
            <div className="space-y-3">
              {(() => {
                // Get effective today and filter logs up to today
                const effectiveToday = getEffectiveDate();
                const filteredLogs = dailyLogs
                  .filter(log => log.date <= effectiveToday)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 7);
                
                return filteredLogs.map((log) => {
                  const dayCaloriesIn = (log.foods || []).reduce((sum, f) => sum + (f.calories || 0), 0);
                  const dayExerciseBurn = (log.exercises || []).reduce((sum, e) => sum + (e.caloriesBurned || 0), 0);
                  const dayNeatBurn = (log.neatActivities || []).reduce((sum, a) => sum + (a.calories || 0), 0);
                  const dayTef = Math.round(dayCaloriesIn * 0.1);
                  const dayProtein = (log.foods || []).reduce((sum, f) => {
                    const p = f.nutrients?.macros?.find(m => m.name === 'Protein');
                    return sum + (p?.amount || 0);
                  }, 0);
                  const dayCarbs = (log.foods || []).reduce((sum, f) => {
                    const c = f.nutrients?.macros?.find(m => m.name === 'Carbs');
                    return sum + (c?.amount || 0);
                  }, 0);
                  const dayFat = (log.foods || []).reduce((sum, f) => {
                    const fa = f.nutrients?.macros?.find(m => m.name === 'Fat');
                    return sum + (fa?.amount || 0);
                  }, 0);
                  const totalDayBurn = bmr + dayExerciseBurn + dayNeatBurn + dayTef;
                  const netCalories = dayCaloriesIn - totalDayBurn;
                  const isDeficit = netCalories < 0;
                  const isToday = log.date === effectiveToday;
                
                  return (
                    <div key={log.date} className={`p-3 rounded-xl flex items-center justify-between ${
                      isToday 
                        ? 'bg-violet-50 dark:bg-violet-900/20 border border-violet-300 dark:border-violet-700' 
                        : 'bg-slate-50 dark:bg-slate-700/30'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{isToday ? '📍' : '📅'}</span>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white text-sm">
                            {isToday ? 'Today' : new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-xs text-slate-500">
                            {(log.foods || []).length} meals • {(log.exercises || []).length} workouts
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs text-slate-500">Cal</p>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{dayCaloriesIn}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500">P</p>
                          <p className="font-bold text-blue-600 dark:text-blue-400 text-sm">{Math.round(dayProtein)}g</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500">C</p>
                          <p className="font-bold text-amber-600 dark:text-amber-400 text-sm">{Math.round(dayCarbs)}g</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500">F</p>
                          <p className="font-bold text-rose-600 dark:text-rose-400 text-sm">{Math.round(dayFat)}g</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          isDeficit 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' 
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                        }`}>
                          {isDeficit ? '↓' : '↑'}{Math.abs(netCalories).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
              {dailyLogs.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <span className="text-4xl mb-2 block">📝</span>
                  <p>No logs yet. Start tracking to see your progress!</p>
                </div>
              )}
            </div>
          </div>

          {/* History Chart */}
          <HistoryChart dailyLogs={dailyLogs} />
        </>
      )}

      {activeView === 'weight' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeightProgress
            currentWeight={currentWeight}
            targetWeight={userGoals.targetWeight || user.weight}
            startWeight={user.startWeight || user.weight}
            weightLog={weightLog}
          />
          <WeightProjectionChart
            weightLog={weightLog}
            startWeight={user.startWeight || user.weight}
            targetWeight={userGoals.targetWeight || user.weight}
            goalTimeline={userGoals.goalTimeline || 0}
          />
        </div>
      )}

      {activeView === 'nutrition' && (
        <div className="space-y-6">
          {/* Macro Distribution Pie Chart with Detailed Analysis */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">🥧 Macro Distribution & Analysis</h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Protein', value: stats.totalProtein * 4, color: '#3B82F6' },
                        { name: 'Carbs', value: stats.totalCarbs * 4, color: '#F59E0B' },
                        { name: 'Fat', value: stats.totalFat * 9, color: '#F43F5E' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {[
                        { name: 'Protein', value: stats.totalProtein * 4, color: '#3B82F6' },
                        { name: 'Carbs', value: stats.totalCarbs * 4, color: '#F59E0B' },
                        { name: 'Fat', value: stats.totalFat * 9, color: '#F43F5E' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${Math.round(value)} kcal`, '']}
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto mb-2" />
                  <p className="text-xs text-blue-600 dark:text-blue-400">Protein</p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{Math.round(stats.totalProtein)}g</p>
                  <p className="text-xs text-blue-500">{Math.round((stats.totalProtein * 4 / (stats.totalCaloriesIn || 1)) * 100)}%</p>
                </div>
                <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
                  <div className="w-4 h-4 bg-amber-500 rounded-full mx-auto mb-2" />
                  <p className="text-xs text-amber-600 dark:text-amber-400">Carbs</p>
                  <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{Math.round(stats.totalCarbs)}g</p>
                  <p className="text-xs text-amber-500">{Math.round((stats.totalCarbs * 4 / (stats.totalCaloriesIn || 1)) * 100)}%</p>
                </div>
                <div className="text-center p-4 bg-rose-50 dark:bg-rose-900/30 rounded-xl">
                  <div className="w-4 h-4 bg-rose-500 rounded-full mx-auto mb-2" />
                  <p className="text-xs text-rose-600 dark:text-rose-400">Fat</p>
                  <p className="text-xl font-bold text-rose-700 dark:text-rose-300">{Math.round(stats.totalFat)}g</p>
                  <p className="text-xs text-rose-500">{Math.round((stats.totalFat * 9 / (stats.totalCaloriesIn || 1)) * 100)}%</p>
                </div>
              </div>
            </div>
            
            {/* Detailed Macro Analysis */}
            <div className="mt-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl">
              <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <span>🔬</span> Personalized Analysis
              </h4>
              <div className="space-y-3">
                {/* Protein Analysis */}
                {(() => {
                  const proteinPerKg = stats.totalDaysLogged > 0 ? (stats.totalProtein / stats.totalDaysLogged) / (user?.weight || 70) : 0;
                  const proteinStatus = proteinPerKg >= 1.6 ? 'optimal' : proteinPerKg >= 1.2 ? 'adequate' : 'low';
                  return (
                    <div className={`p-3 rounded-lg ${
                      proteinStatus === 'optimal' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                      proteinStatus === 'adequate' ? 'bg-amber-100 dark:bg-amber-900/30' :
                      'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Protein Intake</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          proteinStatus === 'optimal' ? 'bg-emerald-500 text-white' :
                          proteinStatus === 'adequate' ? 'bg-amber-500 text-white' :
                          'bg-red-500 text-white'
                        }`}>
                          {proteinPerKg.toFixed(1)}g/kg/day
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {proteinStatus === 'optimal' 
                          ? '✅ Excellent! You\'re getting enough protein for muscle maintenance and growth.'
                          : proteinStatus === 'adequate'
                          ? '⚠️ Adequate, but consider increasing to 1.6g/kg for better results.'
                          : '❌ Low protein intake. Aim for 1.6-2.2g/kg for your goals.'}
                      </p>
                    </div>
                  );
                })()}
                
                {/* Carb Analysis based on goal */}
                {(() => {
                  const carbPercent = Math.round((stats.totalCarbs * 4 / (stats.totalCaloriesIn || 1)) * 100);
                  const isLowCarb = carbPercent < 30;
                  const isHighCarb = carbPercent > 55;
                  return (
                    <div className={`p-3 rounded-lg ${
                      userGoals.weightGoal === 'lose' 
                        ? (isLowCarb ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30')
                        : (carbPercent >= 40 && carbPercent <= 55 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30')
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Carbohydrate Balance</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-500 text-white">{carbPercent}% of calories</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {userGoals.weightGoal === 'lose'
                          ? (isLowCarb 
                            ? '✅ Good carb control for weight loss. Keep it up!'
                            : '💡 Consider reducing carbs to 30-40% for faster fat loss.')
                          : userGoals.weightGoal === 'gain'
                          ? (isHighCarb
                            ? '✅ Good carb intake for muscle building and energy.'
                            : '💡 Increase carbs to 45-55% to fuel your workouts.')
                          : '✅ Balanced carb intake for maintenance.'}
                      </p>
                    </div>
                  );
                })()}
                
                {/* Fat Analysis */}
                {(() => {
                  const fatPercent = Math.round((stats.totalFat * 9 / (stats.totalCaloriesIn || 1)) * 100);
                  const isHealthyFat = fatPercent >= 20 && fatPercent <= 35;
                  return (
                    <div className={`p-3 rounded-lg ${isHealthyFat ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Fat Intake</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${isHealthyFat ? 'bg-emerald-500' : 'bg-amber-500'} text-white`}>
                          {fatPercent}% of calories
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {isHealthyFat 
                          ? '✅ Healthy fat range (20-35%). Good for hormone balance and nutrient absorption.'
                          : fatPercent < 20
                          ? '⚠️ Fat intake is low. Include healthy fats for hormone health.'
                          : '⚠️ Fat intake is high. Consider reducing to 25-35% of calories.'}
                      </p>
                    </div>
                  );
                })()}
                
                {/* Overall Recommendation */}
                <div className="p-3 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span>🎯</span>
                    <span className="font-medium text-sm">Goal-Based Recommendation</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {userGoals.weightGoal === 'lose'
                      ? `For weight loss: Maintain a 500 kcal deficit. Your avg intake is ${Math.round(stats.avgDailyIntake)} kcal. ${stats.avgDailyIntake > stats.avgDailyBurn ? 'Try reducing intake or increasing activity.' : 'Great job maintaining a deficit!'}`
                      : userGoals.weightGoal === 'gain'
                      ? `For muscle gain: Aim for 300-500 kcal surplus with high protein. Your avg intake is ${Math.round(stats.avgDailyIntake)} kcal. ${stats.avgDailyIntake < stats.avgDailyBurn ? 'Increase calories to support muscle growth.' : 'Good surplus for building muscle!'}`
                      : `For maintenance: Keep calories balanced. Your avg intake is ${Math.round(stats.avgDailyIntake)} kcal vs ${Math.round(stats.avgDailyBurn)} kcal burn.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Calorie Trend Chart with Period Dropdown */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">📈 Calorie Trend</h3>
              <select
                value={calorieTrendPeriod}
                onChange={(e) => setCalorieTrendPeriod(e.target.value as PeriodType)}
                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white text-sm font-medium border-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="1">Today</option>
                <option value="3">Last 3 Days</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={(() => {
                    // Get effective today and filter logs up to today
                    const effectiveToday = getEffectiveDate();
                    // Sort logs by date first, then filter by period and effective date
                    const sortedLogs = [...dailyLogs]
                      .filter(log => log.date <= effectiveToday)
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    const filteredLogs = periodFilterStrategy[calorieTrendPeriod](sortedLogs);
                    return filteredLogs.map(log => {
                      const caloriesIn = (log.foods || []).reduce((sum: number, f: any) => sum + (f.calories || 0), 0);
                      const exerciseBurn = (log.exercises || []).reduce((sum: number, e: any) => sum + (e.caloriesBurned || 0), 0);
                      const neatBurn = (log.neatActivities || []).reduce((sum: number, a: any) => sum + (a.calories || 0), 0);
                      const tef = Math.round(caloriesIn * 0.1);
                      return {
                        date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        intake: caloriesIn,
                        burn: bmr + exerciseBurn + neatBurn + tef,
                      };
                    });
                  })()}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="intakeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="burnGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: number, name: string) => [
                      `${Math.round(value)} kcal`,
                      name === 'intake' ? 'Calories In' : 'Calories Out'
                    ]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="intake" stroke="#10B981" fillOpacity={1} fill="url(#intakeGrad)" name="Intake" />
                  <Area type="monotone" dataKey="burn" stroke="#F97316" fillOpacity={1} fill="url(#burnGrad)" name="Burn" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Period Summary */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              {(() => {
                const effectiveToday = getEffectiveDate();
                const sortedLogs = [...dailyLogs]
                  .filter(log => log.date <= effectiveToday)
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                const filteredLogs = periodFilterStrategy[calorieTrendPeriod](sortedLogs);
                const periodIntake = filteredLogs.reduce((sum, log) => 
                  sum + (log.foods || []).reduce((s: number, f: any) => s + (f.calories || 0), 0), 0);
                const periodExercise = filteredLogs.reduce((sum, log) => 
                  sum + (log.exercises || []).reduce((s: number, e: any) => s + (e.caloriesBurned || 0), 0), 0);
                const periodNeat = filteredLogs.reduce((sum, log) => 
                  sum + (log.neatActivities || []).reduce((s: number, a: any) => s + (a.calories || 0), 0), 0);
                const periodTef = Math.round(periodIntake * 0.1);
                const periodBurn = (filteredLogs.length * bmr) + periodExercise + periodNeat + periodTef;
                const periodNet = periodIntake - periodBurn;
                return (
                  <>
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">Total Intake</p>
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{Math.round(periodIntake)} kcal</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                      <p className="text-xs text-orange-600 dark:text-orange-400">Total Burn</p>
                      <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{Math.round(periodBurn)} kcal</p>
                    </div>
                    <div className={`text-center p-3 rounded-xl ${periodNet < 0 ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-amber-50 dark:bg-amber-900/30'}`}>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Net Balance</p>
                      <p className={`text-lg font-bold ${periodNet < 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                        {periodNet > 0 ? '+' : ''}{Math.round(periodNet)} kcal
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <HistoryChart dailyLogs={dailyLogs} />

          {/* Micro-nutrients Breakdown */}
          <NutrientBreakdown />
        </div>
      )}

      <GoalSettingsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        currentGoals={userGoals}
        onSave={updateGoals}
      />
    </div>
  );
};

export default ProgressTab;
