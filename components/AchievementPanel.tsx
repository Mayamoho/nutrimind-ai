/**
 * Achievement Panel Component
 * Full achievement dashboard with categories, progress, and stats
 */

import React, { useState } from 'react';
import { useAchievements } from '../contexts/AchievementContext';
import { useData } from '../contexts/DataContext';
import { AchievementBadge } from './AchievementBadge';
import { AchievementCategory, AchievementTier } from '../patterns/Observer';

const categories: { id: AchievementCategory; name: string; icon: string }[] = [
  { id: 'consistency', name: 'Streaks', icon: '🔥' },
  { id: 'nutrition', name: 'Nutrition', icon: '🍎' },
  { id: 'exercise', name: 'Exercise', icon: '💪' },
  { id: 'milestone', name: 'Hydration', icon: '💧' }
];

const tierOrder: AchievementTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

export const AchievementPanel: React.FC = () => {
  const { state, allAchievements, getLevelTitle, nextAchievement } = useAchievements();
  const { currentStreak, bestStreak } = useData();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory>('consistency');

  const filteredAchievements = allAchievements
    .filter(a => a.category === selectedCategory)
    .sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier));

  const unlockedCount = allAchievements.filter(a => a.unlockedAt).length;
  const totalCount = allAchievements.length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Header with Level & Stats */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="flex items-center justify-between">
          {/* Level Badge */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                <span className="text-4xl font-bold text-white">{state.level}</span>
              </div>
              {/* Level Progress Ring */}
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="46"
                  fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="8"
                />
                <circle
                  cx="50" cy="50" r="46"
                  fill="none" stroke="white" strokeWidth="8"
                  strokeDasharray={`${state.levelProgress * 2.89} 289`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">Level {state.level}</p>
              <h2 className="text-2xl font-bold text-white">{getLevelTitle()}</h2>
              <p className="text-white/70 text-sm mt-1">
                {Math.round(state.levelProgress)}% to next level
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <p className="text-3xl font-bold text-white">{state.totalPoints}</p>
              <p className="text-white/70 text-xs">Total Points</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <p className="text-3xl font-bold text-white">{unlockedCount}/{totalCount}</p>
              <p className="text-white/70 text-xs">Achievements</p>
            </div>
          </div>
        </div>

        {/* Streak Display */}
        <div className="mt-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-white font-bold">{currentStreak} day current streak</p>
              <p className="text-white/60 text-xs">Best: {bestStreak} days</p>
            </div>
          </div>
          
          {nextAchievement && (
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-white/70 text-xs">Next Achievement</p>
              <div className="flex items-center gap-2 mt-1">
                <span>{nextAchievement.icon}</span>
                <span className="text-white font-medium text-sm">{nextAchievement.name}</span>
                <span className="text-white/60 text-xs ml-auto">
                  {nextAchievement.progress}/{nextAchievement.target}
                </span>
              </div>
              <div className="mt-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${(nextAchievement.progress / nextAchievement.target) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`
              flex-1 py-3 px-4 text-sm font-medium transition-all
              flex items-center justify-center gap-2
              ${selectedCategory === cat.id
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }
            `}
          >
            <span>{cat.icon}</span>
            <span className="hidden sm:inline">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Achievement Grid */}
      <div className="p-6">
        <div className="grid grid-cols-5 gap-4">
          {filteredAchievements.map(achievement => (
            <div key={achievement.id} className="flex flex-col items-center gap-2">
              <AchievementBadge 
                achievement={achievement} 
                size="lg"
                showProgress={true}
              />
              <p className={`
                text-xs text-center font-medium
                ${achievement.unlockedAt 
                  ? 'text-slate-700 dark:text-slate-300' 
                  : 'text-slate-400 dark:text-slate-500'
                }
              `}>
                {achievement.name}
              </p>
            </div>
          ))}
        </div>

        {/* Tier Legend */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Achievement Tiers</p>
          <div className="flex flex-wrap gap-3">
            {tierOrder.map(tier => (
              <div key={tier} className="flex items-center gap-1.5">
                <div className={`
                  w-3 h-3 rounded-full
                  ${tier === 'bronze' ? 'bg-gradient-to-br from-amber-600 to-amber-800' : ''}
                  ${tier === 'silver' ? 'bg-gradient-to-br from-slate-300 to-slate-500' : ''}
                  ${tier === 'gold' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : ''}
                  ${tier === 'platinum' ? 'bg-gradient-to-br from-cyan-300 to-cyan-500' : ''}
                  ${tier === 'diamond' ? 'bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400' : ''}
                `} />
                <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">{tier}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementPanel;
