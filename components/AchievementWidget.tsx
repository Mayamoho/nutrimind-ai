/**
 * Achievement Widget Component
 * Compact widget for dashboard showing quick stats and recent achievements
 */

import React, { useState, useEffect } from 'react';
import { useAchievements } from '../contexts/AchievementContext';
import { useData } from '../contexts/DataContext';
import { AchievementBadge } from './AchievementBadge';
import { AchievementPanel } from './AchievementPanel';

export const AchievementWidget: React.FC = () => {
  const { state, allAchievements, getLevelTitle, nextAchievement } = useAchievements();
  const { currentStreak, bestStreak } = useData();
  const [showFullPanel, setShowFullPanel] = useState(false);

  const recentUnlocked = allAchievements
    .filter(a => a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 4);

  const unlockedCount = allAchievements.filter(a => a.unlockedAt).length;

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Level Circle */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                  <span className="text-xl font-bold text-white">{state.level}</span>
                </div>
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="8"
                  />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none" stroke="white" strokeWidth="8"
                    strokeDasharray={`${state.levelProgress * 2.64} 264`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold">{getLevelTitle()}</h3>
                <p className="text-white/70 text-xs">{state.totalPoints} points</p>
              </div>
            </div>

            {/* Streak */}
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <span className="text-xl">🔥</span>
                <span className="text-white font-bold">{currentStreak}</span>
              </div>
              <p className="text-white/70 text-xs">current streak</p>
              <p className="text-white/50 text-[10px]">Best: {bestStreak}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Next Achievement Progress */}
          {nextAchievement && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{nextAchievement.icon}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {nextAchievement.name}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {nextAchievement.progress}/{nextAchievement.target}
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((nextAchievement.progress / nextAchievement.target) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Recent Achievements */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Recent Achievements
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {unlockedCount}/{allAchievements.length}
              </span>
            </div>
            
            {recentUnlocked.length > 0 ? (
              <div className="flex justify-center gap-3">
                {recentUnlocked.map(achievement => (
                  <AchievementBadge 
                    key={achievement.id}
                    achievement={achievement}
                    size="sm"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-400 dark:text-slate-500 text-sm">
                  Start logging to unlock achievements! 🏆
                </p>
              </div>
            )}
          </div>

          {/* View All Button */}
          <button
            onClick={() => setShowFullPanel(true)}
            className="
              w-full mt-4 py-2 px-4
              bg-slate-100 dark:bg-slate-700
              hover:bg-slate-200 dark:hover:bg-slate-600
              text-slate-700 dark:text-slate-300
              text-sm font-medium
              rounded-lg
              transition-colors
              flex items-center justify-center gap-2
            "
          >
            <span>View All Achievements</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Full Panel Modal */}
      {showFullPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-auto rounded-2xl">
            <button
              onClick={() => setShowFullPanel(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <AchievementPanel />
          </div>
        </div>
      )}
    </>
  );
};

export default AchievementWidget;
