/**
 * Achievement Badge Component
 * Displays individual achievement with tier-based styling
 */

import React from 'react';
import { Achievement, AchievementTier } from '../patterns/Observer';
import { useData } from '../contexts/DataContext';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  onClick?: () => void;
}

const tierColors: Record<AchievementTier, { bg: string; border: string; glow: string }> = {
  bronze: {
    bg: 'bg-gradient-to-br from-amber-600 to-amber-800',
    border: 'border-amber-500',
    glow: 'shadow-amber-500/30'
  },
  silver: {
    bg: 'bg-gradient-to-br from-slate-300 to-slate-500',
    border: 'border-slate-400',
    glow: 'shadow-slate-400/30'
  },
  gold: {
    bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    border: 'border-yellow-400',
    glow: 'shadow-yellow-400/40'
  },
  platinum: {
    bg: 'bg-gradient-to-br from-cyan-300 to-cyan-500',
    border: 'border-cyan-400',
    glow: 'shadow-cyan-400/40'
  },
  diamond: {
    bg: 'bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400',
    border: 'border-purple-400',
    glow: 'shadow-purple-400/50'
  }
};

const sizeClasses = {
  sm: 'w-12 h-12 text-xl',
  md: 'w-16 h-16 text-2xl',
  lg: 'w-20 h-20 text-3xl'
};

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = 'md',
  showProgress = false,
  onClick
}) => {
  const { currentStreak, bestStreak } = useData();
  const isUnlocked = !!achievement.unlockedAt;
  const colors = tierColors[achievement.tier];
  
  // For streak-related achievements, use bestStreak from DataContext
  // "Getting Started" and other streak achievements should track best streak for progress
  const isStreakAchievement = 
    achievement.category === 'consistency' ||
    achievement.id?.toLowerCase().includes('streak') ||
    achievement.name?.toLowerCase().includes('streak') ||
    achievement.name?.toLowerCase().includes('getting started') ||
    achievement.name?.toLowerCase().includes('week warrior') ||
    achievement.name?.toLowerCase().includes('fortnight') ||
    achievement.name?.toLowerCase().includes('monthly') ||
    achievement.name?.toLowerCase().includes('century');
  
  // Use bestStreak for achievement progress (what counts toward unlocking)
  const displayProgress = isStreakAchievement ? bestStreak : achievement.progress;
  const progress = Math.min((displayProgress / achievement.target) * 100, 100);

  return (
    <div 
      className={`relative group cursor-pointer transition-all duration-300 ${onClick ? 'hover:scale-110' : ''}`}
      onClick={onClick}
    >
      {/* Badge Circle */}
      <div
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          flex items-center justify-center
          border-2
          ${isUnlocked 
            ? `${colors.bg} ${colors.border} shadow-lg ${colors.glow}` 
            : 'bg-slate-700 border-slate-600 opacity-50'
          }
          transition-all duration-300
          ${isUnlocked ? 'hover:shadow-xl' : ''}
        `}
      >
        <span className={isUnlocked ? '' : 'grayscale opacity-50'}>
          {achievement.icon}
        </span>
      </div>

      {/* Progress Ring (for locked achievements) */}
      {!isUnlocked && showProgress && progress > 0 && (
        <svg 
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-emerald-500/30"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={`${progress * 2.83} 283`}
            className="text-emerald-500 transition-all duration-500"
          />
        </svg>
      )}

      {/* Unlock Sparkle Effect */}
      {isUnlocked && (
        <div className="absolute -top-1 -right-1">
          <span className="text-xs">✨</span>
        </div>
      )}

      {/* Tooltip */}
      <div className="
        absolute bottom-full left-1/2 -translate-x-1/2 mb-2
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        pointer-events-none
        z-50
      ">
        <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
          <p className="font-bold">{achievement.name}</p>
          <p className="text-slate-300 text-[10px]">{achievement.description}</p>
          {!isUnlocked && (
            <p className="text-emerald-400 mt-1">
              {displayProgress} / {achievement.target}
            </p>
          )}
          {isUnlocked && (
            <p className="text-yellow-400 mt-1">+{achievement.points} pts</p>
          )}
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </div>
    </div>
  );
};

export default AchievementBadge;
