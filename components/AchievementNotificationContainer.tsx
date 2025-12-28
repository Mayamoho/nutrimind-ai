/**
 * Achievement Notification Container
 * Manages and displays multiple achievement notifications
 */

import React from 'react';
import { useAchievements } from '../contexts/AchievementContext';
import { AchievementNotification } from './AchievementNotification';

export const AchievementNotificationContainer: React.FC = () => {
  const { recentUnlocks, dismissRecentUnlock } = useAchievements();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {recentUnlocks.map((achievement, index) => (
        <div 
          key={achievement.id}
          style={{ transform: `translateY(${index * 10}px)` }}
        >
          <AchievementNotification
            achievement={achievement}
            onDismiss={() => dismissRecentUnlock(achievement.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default AchievementNotificationContainer;
