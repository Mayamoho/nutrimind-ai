/**
 * Log Tab - Enhanced with day-by-day history
 * Shows food/exercise logging, daily history with macros breakdown
 */

import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import LogInput from '../LogInput';
import LogList from '../LogList';
import NeatLogger from '../NeatLogger';
import WaterTracker from '../WaterTracker';
import SuggestionCard from '../SuggestionCard';
import PersonalizedPlanner from '../PersonalizedPlanner';
import QuickActions from '../QuickActions';
import { DailyLog, FoodLog } from '../../types';
import { getEffectiveDate } from '../../utils/dateUtils';

const LogTab: React.FC = () => {
  const { user } = useAuth();
  const dataContext = useData();
  
  // Add error boundary at component level
  try {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(true);

    const dailyLogs = dataContext?.dailyLogs || [];
    const todayLog = dataContext?.todayLog || { date: '', foods: [], exercises: [], neatActivities: [], waterIntake: 0 };
    const dailyProgress = dataContext?.dailyProgress || { bmr: 1600, waterTarget: 2500 };
    const updateFood = dataContext?.updateFood || (() => {});
    const deleteFood = dataContext?.deleteFood || (() => {});
    const updateExercise = dataContext?.updateExercise || (() => {});
    const deleteExercise = dataContext?.deleteExercise || (() => {});
    const addNeatActivity = dataContext?.addNeatActivity || (() => {});
    const updateNeatActivity = dataContext?.updateNeatActivity || (() => {});
    const removeNeatActivity = dataContext?.removeNeatActivity || (() => {});
    const addFood = dataContext?.addFood || (() => {});
    const addExercise = dataContext?.addExercise || (() => {});

    // Wrapper functions for QuickActions
    const handleQuickAddFood = (food: Omit<FoodLog, 'id' | 'timestamp'>) => {
      addFood([food]);
    };

  // Calculate BMR
  const bmr = useMemo(() => {
    if (!user) return 1600;
    const { weight = 70, height = 170, age = 30, gender = 'female' } = user;
    return Math.round(10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161));
  }, [user]);

  // Process daily logs for history display (sorted by date descending)
  const sortedLogs = useMemo(() => {
    const effectiveToday = getEffectiveDate();
    return [...dailyLogs]
      .filter(log => {
        // Only show logs up to and including today
        return log.date <= effectiveToday && (log.foods?.length > 0 || log.exercises?.length > 0 || log.waterIntake > 0);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 14); // Last 14 days
  }, [dailyLogs]);

  // Calculate stats for a log
  const getLogStats = (log: DailyLog) => {
    const caloriesIn = (log.foods || []).reduce((sum, f) => sum + (f.calories || 0), 0);
    const exerciseBurn = (log.exercises || []).reduce((sum, e) => sum + (e.caloriesBurned || 0), 0);
    const neatBurn = (log.neatActivities || []).reduce((sum, a) => sum + (a.calories || 0), 0);
    const tef = Math.round(caloriesIn * 0.1);
    const totalBurn = bmr + exerciseBurn + neatBurn + tef;
    const netCalories = caloriesIn - totalBurn;

    // Macros
    const protein = (log.foods || []).reduce((sum, f) => {
      const p = f.nutrients?.macros?.find(m => m.name === 'Protein');
      return sum + (p?.amount || 0);
    }, 0);
    const carbs = (log.foods || []).reduce((sum, f) => {
      const c = f.nutrients?.macros?.find(m => m.name === 'Carbs');
      return sum + (c?.amount || 0);
    }, 0);
    const fat = (log.foods || []).reduce((sum, f) => {
      const fa = f.nutrients?.macros?.find(m => m.name === 'Fat');
      return sum + (fa?.amount || 0);
    }, 0);

    return { caloriesIn, exerciseBurn, neatBurn, tef, totalBurn, netCalories, protein, carbs, fat };
  };

  const todayStats = getLogStats(todayLog);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const effectiveToday = getEffectiveDate();
    const yesterday = new Date(effectiveToday);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (dateStr === effectiveToday) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Remove unused variable warning
  void dailyProgress;

  return (
    <div className="space-y-6">
      {/* Header with Today's Stats */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <span className="text-3xl">📝</span> Activity Log
            </h2>
            <p className="text-white/80 mt-1">Track and review your daily nutrition & fitness</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-white/70">Calories In</p>
              <p className="text-xl font-bold">{Math.round(todayStats.caloriesIn)}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-white/70">Total Burn</p>
              <p className="text-xl font-bold">{Math.round(todayStats.totalBurn)}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-white/70">Net</p>
              <p className={`text-xl font-bold ${todayStats.netCalories < 0 ? 'text-emerald-200' : 'text-amber-200'}`}>
                {todayStats.netCalories > 0 ? '+' : ''}{Math.round(todayStats.netCalories)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Logging */}
        <div className="lg:col-span-2 space-y-6">
          <LogInput />
          <SuggestionCard />
          <NeatLogger
            loggedActivities={todayLog.neatActivities || []}
            onAddActivity={addNeatActivity}
            onUpdateActivity={updateNeatActivity}
            onRemoveActivity={removeNeatActivity}
          />
          <LogList
            todayLog={todayLog}
            onUpdateFood={updateFood}
            onDeleteFood={deleteFood}
            onUpdateExercise={updateExercise}
            onDeleteExercise={deleteExercise}
          />
          
          {/* Personalized Planner */}
          <PersonalizedPlanner />

          {/* Quick Actions */}
          <QuickActions 
            onQuickAddFood={handleQuickAddFood}
            onQuickAddExercise={addExercise}
          />
        </div>

        {/* Right Column - Water & History */}
        <div className="space-y-6">
          <WaterTracker />
          
          {/* Day-by-Day History */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-violet-500 to-purple-500 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📅</span> Daily History
                </h3>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-white/80 hover:text-white text-sm"
                >
                  {showHistory ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            
            {showHistory && (
              <div className="max-h-[600px] overflow-y-auto">
                {sortedLogs.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                    <span className="text-4xl block mb-2">📭</span>
                    <p>No activity logged yet</p>
                  </div>
                ) : (
                  sortedLogs.map((log) => {
                    const stats = getLogStats(log);
                    const isExpanded = selectedDate === log.date;
                    
                    return (
                      <div key={log.date} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <button
                          onClick={() => setSelectedDate(isExpanded ? null : log.date)}
                          className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-slate-800 dark:text-white">
                              {formatDate(log.date)}
                            </span>
                            <span className={`text-sm font-bold ${stats.netCalories < 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {stats.netCalories > 0 ? '+' : ''}{Math.round(stats.netCalories)} kcal
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div className="text-center">
                              <p className="text-slate-500 dark:text-slate-400">In</p>
                              <p className="font-semibold text-emerald-600 dark:text-emerald-400">{Math.round(stats.caloriesIn)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-slate-500 dark:text-slate-400">Burn</p>
                              <p className="font-semibold text-orange-600 dark:text-orange-400">{Math.round(stats.totalBurn)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-slate-500 dark:text-slate-400">Foods</p>
                              <p className="font-semibold text-slate-700 dark:text-slate-300">{log.foods?.length || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-slate-500 dark:text-slate-400">Exercise</p>
                              <p className="font-semibold text-slate-700 dark:text-slate-300">{log.exercises?.length || 0}</p>
                            </div>
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-3 bg-slate-50 dark:bg-slate-900/50">
                            {/* Macros Breakdown */}
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Macros</p>
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2">
                                  <p className="text-xs text-blue-600 dark:text-blue-400">Protein</p>
                                  <p className="font-bold text-blue-700 dark:text-blue-300">{Math.round(stats.protein)}g</p>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-2">
                                  <p className="text-xs text-amber-600 dark:text-amber-400">Carbs</p>
                                  <p className="font-bold text-amber-700 dark:text-amber-300">{Math.round(stats.carbs)}g</p>
                                </div>
                                <div className="bg-rose-50 dark:bg-rose-900/30 rounded-lg p-2">
                                  <p className="text-xs text-rose-600 dark:text-rose-400">Fat</p>
                                  <p className="font-bold text-rose-700 dark:text-rose-300">{Math.round(stats.fat)}g</p>
                                </div>
                              </div>
                            </div>

                            {/* Calorie Breakdown */}
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Burn Breakdown</p>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-600 dark:text-slate-400">BMR</span>
                                  <span className="font-medium">{bmr} kcal</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600 dark:text-slate-400">Exercise (EAT)</span>
                                  <span className="font-medium">{Math.round(stats.exerciseBurn)} kcal</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600 dark:text-slate-400">NEAT</span>
                                  <span className="font-medium">{Math.round(stats.neatBurn)} kcal</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600 dark:text-slate-400">TEF</span>
                                  <span className="font-medium">{stats.tef} kcal</span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">Total</span>
                                  <span className="font-bold text-orange-600 dark:text-orange-400">{Math.round(stats.totalBurn)} kcal</span>
                                </div>
                              </div>
                            </div>

                            {/* Foods List */}
                            {log.foods && log.foods.length > 0 && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">🍽️ Foods ({log.foods.length})</p>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {log.foods.map((food, i) => (
                                    <div key={i} className="flex justify-between text-xs">
                                      <span className="text-slate-700 dark:text-slate-300 truncate flex-1">{food.name}</span>
                                      <span className="text-emerald-600 dark:text-emerald-400 ml-2">{food.calories} kcal</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Exercises List */}
                            {log.exercises && log.exercises.length > 0 && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">💪 Exercises ({log.exercises.length})</p>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {log.exercises.map((ex, i) => (
                                    <div key={i} className="flex justify-between text-xs">
                                      <span className="text-slate-700 dark:text-slate-300 truncate flex-1">{ex.name}</span>
                                      <span className="text-orange-600 dark:text-orange-400 ml-2">{ex.caloriesBurned} kcal</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Water */}
                            {log.waterIntake > 0 && (
                              <div className="bg-sky-50 dark:bg-sky-900/30 rounded-lg p-3 flex items-center justify-between">
                                <span className="text-xs text-sky-600 dark:text-sky-400">💧 Water Intake</span>
                                <span className="font-bold text-sky-700 dark:text-sky-300">{(log.waterIntake / 1000).toFixed(1)} L</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Error in LogTab:', error);
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold mb-2">Activity Log Error</h2>
        <p className="text-sm text-slate-600">There was an error loading the activity log. Please refresh the page.</p>
      </div>
    );
  }
};

export default LogTab;
