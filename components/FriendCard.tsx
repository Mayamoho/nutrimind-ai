import React from 'react';
import { Friend } from '../types';
import { UserIcon, CalendarIcon } from './icons';

interface FriendCardProps {
  friend: Friend;
  onSendEncouragement?: (email: string) => void;
  onViewProfile?: (email: string) => void;
}

const FriendCard: React.FC<FriendCardProps> = ({ friend, onSendEncouragement, onViewProfile }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-600 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {friend.last_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white">{friend.last_name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{friend.country || 'Unknown'}</p>
            <div className="flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-500 mt-1">
              <CalendarIcon className="w-3 h-3" />
              <span>Friends since {formatDate(friend.friends_since)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => onSendEncouragement?.(friend.friend_email)}
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors"
          >
            Encourage
          </button>
          <button
            onClick={() => onViewProfile?.(friend.friend_email)}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
          >
            Profile
          </button>
        </div>
      </div>
      
      {friend.weight && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Current Weight</span>
            <span className="font-semibold text-gray-800 dark:text-white">{friend.weight} kg</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendCard;
