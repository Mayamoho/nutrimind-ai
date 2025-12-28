/**
 * Achievements Tab
 * Full achievement panel with gamification features
 */

import React, { useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAchievements } from '../../contexts/AchievementContext';
import { AchievementPanel } from '../AchievementPanel';

const defaultGoals = { targetWeight: 0, weightGoal: 'maintain' as const, goalTimeline: 0 };

const AchievementsTab: React.FC = () => {
  const dataContext = useData();
  const { checkAchievements, state, getLevelTitle } = useAchievements();

  const userGoals = dataContext?.userGoals || defaultGoals;
  const dailyLogs = dataContext?.dailyLogs || [];
  // Use streaks from DataContext which are calculated correctly with 6 AM boundary
  const currentStreak = dataContext?.currentStreak || 0;
  const bestStreak = dataContext?.bestStreak || 0;

  // Check achievements when tab is viewed
  useEffect(() => {
    if (dailyLogs && dailyLogs.length > 0 && userGoals) {
      checkAchievements(dailyLogs, userGoals);
    }
  }, [dailyLogs, userGoals, checkAchievements]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <span className="text-3xl">🏆</span> Achievements
            </h2>
            <p className="text-white/80 mt-1">
              Track your milestones and unlock rewards
            </p>
          </div>
          
          {/* Level & Streak Display */}
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3 text-center">
              <p className="text-white/70 text-xs font-medium">Level</p>
              <p className="text-2xl font-bold">{state.level}</p>
              <p className="text-xs text-white/80">{getLevelTitle()}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3 text-center">
              <p className="text-white/70 text-xs font-medium">Current</p>
              <p className="text-2xl font-bold flex items-center justify-center gap-1">
                <span>🔥</span> {currentStreak}
              </p>
              <p className="text-xs text-white/80">day streak</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3 text-center">
              <p className="text-white/70 text-xs font-medium">Best</p>
              <p className="text-2xl font-bold flex items-center justify-center gap-1">
                <span>⭐</span> {bestStreak}
              </p>
              <p className="text-xs text-white/80">day streak</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3 text-center">
              <p className="text-white/70 text-xs font-medium">Points</p>
              <p className="text-2xl font-bold">{state.totalPoints}</p>
              <p className="text-xs text-white/80">total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Panel */}
      <AchievementPanel />

      {/* Tips Section */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">💡</span> Tips to Earn More Achievements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-3 shadow-lg shadow-orange-500/20">
              <span className="text-2xl">🔥</span>
            </div>
            <h4 className="font-semibold text-slate-800 dark:text-white">Build Streaks</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Log your meals and exercises daily to build your streak
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20">
              <span className="text-2xl">🍎</span>
            </div>
            <h4 className="font-semibold text-slate-800 dark:text-white">Hit Nutrition Goals</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Stay within your calorie target to unlock nutrition badges
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center mb-3 shadow-lg shadow-violet-500/20">
              <span className="text-2xl">💪</span>
            </div>
            <h4 className="font-semibold text-slate-800 dark:text-white">Stay Active</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Log exercises regularly to earn fitness achievements
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center mb-3 shadow-lg shadow-sky-500/20">
              <span className="text-2xl">💧</span>
            </div>
            <h4 className="font-semibold text-slate-800 dark:text-white">Stay Hydrated</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track your water intake to unlock hydration milestones
            </p>
          </div>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg text-center">
        <p className="text-2xl mb-2">💪</p>
        <p className="text-lg font-medium text-slate-700 dark:text-slate-300 italic">
          "Every achievement starts with the decision to try."
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Keep logging, keep improving, keep achieving!
        </p>
      </div>
    </div>
  );
};

export default AchievementsTab;
