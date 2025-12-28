import React, { useState } from 'react';
import { Challenge, UserChallenge } from '../types';
import { TargetIcon, UsersIcon, ClockIcon, TrophyIcon, FireIcon, WaterDropIcon, WeightIcon, DumbbellIcon } from './icons';
import ProgressUpdateModal from './ProgressUpdateModal';

interface ChallengeCardProps {
  challenge: Challenge & Partial<UserChallenge>;
  onJoin?: (challengeId: number) => void;
  onComplete?: (challengeId: number) => void;
  onUpdateProgress?: (challengeId: number, progress: number) => void;
  userProgress?: number;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ 
  challenge, 
  onJoin, 
  onComplete,
  onUpdateProgress,
  userProgress = 0 
}) => {
  const [showProgressModal, setShowProgressModal] = useState(false);
  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case 'streak': return <FireIcon className="w-5 h-5 text-orange-500" />;
      case 'protein': return <DumbbellIcon className="w-5 h-5 text-blue-500" />;
      case 'weight_loss': return <WeightIcon className="w-5 h-5 text-green-500" />;
      case 'water': return <WaterDropIcon className="w-5 h-5 text-blue-300" />;
      case 'workout': return <DumbbellIcon className="w-5 h-5 text-purple-500" />;
      default: return <TargetIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const progressPercentage = Math.min(100, Math.round((userProgress / (challenge.target_value || 1)) * 100));
  const isJoined = challenge.current_progress !== null && challenge.current_progress !== undefined;
  const isCompleted = challenge.is_completed === true;
  const canComplete = isJoined && userProgress >= (challenge.target_value || 0) && !isCompleted;

  const handleProgressUpdate = async (progress: number) => {
    if (onUpdateProgress) {
      await onUpdateProgress(challenge.id, progress);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-full">
            {getChallengeTypeIcon(challenge.challenge_type)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{challenge.title}</h3>
            {challenge.description && (
              <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {challenge.reward_points > 0 && (
            <div className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full text-sm">
              <TrophyIcon className="w-4 h-4 mr-1" />
              {challenge.reward_points} pts
            </div>
          )}
          <div className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm">
            <ClockIcon className="w-4 h-4 mr-1" />
            {challenge.duration_days} days
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
          <div className="flex items-center">
            <UsersIcon className="w-4 h-4 mr-1" />
            <span>{challenge.participant_count || 0} participants</span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="w-4 h-4 mr-1" />
            <span>Ends {new Date(challenge.end_date).toLocaleDateString()}</span>
          </div>
        </div>

        {isJoined && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Progress: {userProgress}/{challenge.target_value}</span>
              <span>{progressPercentage}%</span>
            </div>
          </div>
        )}
      </div>

      {!isJoined && onJoin && (
        <button
          onClick={() => onJoin(challenge.id)}
          className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Join Challenge
        </button>
      )}
      
      {isJoined && canComplete && onComplete && (
        <button
          onClick={() => onComplete(challenge.id)}
          className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
        >
          <TrophyIcon className="w-4 h-4" />
          <span>Complete Challenge</span>
        </button>
      )}
      
      {isJoined && !canComplete && !(challenge as any).is_completed && (
        <div className="mt-3 flex space-x-2">
          <button
            onClick={() => setShowProgressModal(true)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Edit Progress
          </button>
          <div className="flex-1 bg-gray-100 text-gray-600 font-medium py-2 px-4 rounded-md text-center">
            Joined
          </div>
        </div>
      )}
      
      {isJoined && (challenge as any).is_completed && (
        <div className="mt-3 w-full bg-gray-100 text-gray-600 font-medium py-2 px-4 rounded-md text-center flex items-center justify-center space-x-2">
          <TrophyIcon className="w-4 h-4" />
          <span>Completed</span>
        </div>
      )}

      <ProgressUpdateModal
        challenge={challenge}
        currentProgress={userProgress}
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        onUpdate={handleProgressUpdate}
      />
    </div>
  );
};

export default ChallengeCard;
