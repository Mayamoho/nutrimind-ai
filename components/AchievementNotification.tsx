/**
 * Achievement Notification Component
 * Animated popup when user unlocks an achievement
 */

import React, { useEffect, useState } from 'react';
import { Achievement, AchievementTier } from '../patterns/Observer';

interface AchievementNotificationProps {
  achievement: Achievement;
  onDismiss: () => void;
}

const tierGradients: Record<AchievementTier, string> = {
  bronze: 'from-amber-600 via-amber-500 to-amber-700',
  silver: 'from-slate-400 via-slate-300 to-slate-500',
  gold: 'from-yellow-500 via-yellow-400 to-yellow-600',
  platinum: 'from-cyan-400 via-cyan-300 to-cyan-500',
  diamond: 'from-purple-500 via-pink-400 to-blue-500'
};

const tierNames: Record<AchievementTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  diamond: 'Diamond'
};

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true));

    // Auto dismiss after 4.5 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        transform transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div 
        className={`
          relative overflow-hidden
          bg-gradient-to-r ${tierGradients[achievement.tier]}
          rounded-2xl shadow-2xl
          p-1
        `}
      >
        {/* Inner content */}
        <div className="bg-slate-900 rounded-xl p-4 flex items-center gap-4">
          {/* Achievement Icon */}
          <div className="relative">
            <div className={`
              w-16 h-16 rounded-full 
              bg-gradient-to-br ${tierGradients[achievement.tier]}
              flex items-center justify-center
              text-3xl
              animate-bounce
            `}>
              {achievement.icon}
            </div>
            {/* Sparkles */}
            <div className="absolute -top-1 -right-1 animate-ping">
              <span className="text-yellow-400">✨</span>
            </div>
          </div>

          {/* Text Content */}
          <div className="flex-1">
            <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
              Achievement Unlocked!
            </p>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {achievement.name}
            </h3>
            <p className="text-sm text-slate-300 mt-0.5">
              {achievement.description}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`
                text-xs font-semibold px-2 py-0.5 rounded-full
                bg-gradient-to-r ${tierGradients[achievement.tier]}
                text-white
              `}>
                {tierNames[achievement.tier]}
              </span>
              <span className="text-yellow-400 text-sm font-bold">
                +{achievement.points} pts
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar animation */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
          <div 
            className="h-full bg-white/50 animate-shrink"
            style={{ animation: 'shrink 4.5s linear forwards' }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default AchievementNotification;
