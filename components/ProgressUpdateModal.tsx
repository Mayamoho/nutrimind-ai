import React, { useState } from 'react';
import { Challenge } from '../types';

interface ProgressUpdateModalProps {
  challenge: Challenge;
  currentProgress: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (progress: number) => void;
}

const ProgressUpdateModal: React.FC<ProgressUpdateModalProps> = ({
  challenge,
  currentProgress,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [progress, setProgress] = useState(currentProgress.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const progressValue = parseFloat(progress);
    if (isNaN(progressValue) || progressValue < 0) {
      alert('Please enter a valid positive number');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(progressValue);
      onClose();
    } catch (error) {
      console.error('Failed to update progress:', error);
      alert('Failed to update progress. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgressUnit = () => {
    switch (challenge.challenge_type) {
      case 'water': return 'liters';
      case 'weight_loss': return 'kg';
      case 'protein': return 'grams';
      case 'workout': return 'minutes';
      case 'streak': return 'days';
      default: return 'units';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Update Challenge Progress</h3>
        
        <div className="mb-4">
          <h4 className="font-medium text-gray-800">{challenge.title}</h4>
          <p className="text-sm text-gray-600">{challenge.description}</p>
          <p className="text-sm text-gray-500 mt-1">
            Target: {challenge.target_value} {getProgressUnit()}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-1">
              Current Progress ({getProgressUnit()})
            </label>
            <input
              type="number"
              id="progress"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              step="0.1"
              min="0"
              max={challenge.target_value || 9999}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (parseFloat(progress) / (challenge.target_value || 1)) * 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.min(100, Math.round((parseFloat(progress) / (challenge.target_value || 1)) * 100))}% complete
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgressUpdateModal;
