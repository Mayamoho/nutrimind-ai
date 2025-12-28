import React, { useState } from 'react';
import { TrophyIcon, TargetIcon, FireIcon, DumbbellIcon, WeightIcon, WaterDropIcon, PlusIcon } from './icons';

interface ChallengeCreationFormProps {
  onCreateChallenge: (challengeData: {
    title: string;
    description: string;
    challenge_type: 'streak' | 'protein' | 'weight_loss' | 'workout' | 'water' | 'custom';
    duration_days: number;
    target_value?: number;
    reward_points: number;
    max_participants: number;
  }) => void;
  onCancel: () => void;
}

const ChallengeCreationForm: React.FC<ChallengeCreationFormProps> = ({ onCreateChallenge, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    challenge_type: 'custom' as 'streak' | 'protein' | 'weight_loss' | 'workout' | 'water' | 'custom',
    duration_days: 7,
    target_value: 1,
    reward_points: 50,
    max_participants: 20
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const challengeTypes = [
    { value: 'streak', label: 'Streak', icon: FireIcon, description: 'Daily consistency challenges' },
    { value: 'protein', label: 'Protein', icon: DumbbellIcon, description: 'Protein intake targets' },
    { value: 'weight_loss', label: 'Weight Loss', icon: WeightIcon, description: 'Weight reduction goals' },
    { value: 'workout', label: 'Workout', icon: DumbbellIcon, description: 'Exercise frequency goals' },
    { value: 'water', label: 'Water', icon: WaterDropIcon, description: 'Daily hydration targets' },
    { value: 'custom', label: 'Custom', icon: TargetIcon, description: 'Your own challenge type' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a challenge title');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateChallenge(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTargetLabel = () => {
    switch (formData.challenge_type) {
      case 'streak': return 'Target Streak (days)';
      case 'protein': return 'Target Protein (g/day)';
      case 'weight_loss': return 'Target Weight Loss (kg)';
      case 'workout': return 'Target Workouts';
      case 'water': return 'Target Glasses (per day)';
      default: return 'Target Value';
    }
  };

  const getTargetPlaceholder = () => {
    switch (formData.challenge_type) {
      case 'streak': return 'e.g., 7';
      case 'protein': return 'e.g., 100';
      case 'weight_loss': return 'e.g., 2';
      case 'workout': return 'e.g., 20';
      case 'water': return 'e.g., 8';
      default: return 'e.g., 10';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <TrophyIcon className="w-8 h-8 mr-3 text-yellow-500" />
          Create Challenge
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <PlusIcon className="w-6 h-6 rotate-45" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Challenge Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Give your challenge a catchy name..."
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what participants need to do..."
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Challenge Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Challenge Type *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {challengeTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, challenge_type: type.value as any })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    formData.challenge_type === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Icon className="w-6 h-6 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{type.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{type.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration (days) *
            </label>
            <input
              type="number"
              value={formData.duration_days}
              onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 1 })}
              min="1"
              max="365"
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Target Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {getTargetLabel()}
            </label>
            <input
              type="number"
              value={formData.target_value}
              onChange={(e) => setFormData({ ...formData, target_value: parseFloat(e.target.value) || 1 })}
              min="0.1"
              step="0.1"
              placeholder={getTargetPlaceholder()}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reward Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reward Points *
            </label>
            <input
              type="number"
              value={formData.reward_points}
              onChange={(e) => setFormData({ ...formData, reward_points: parseInt(e.target.value) || 0 })}
              min="0"
              max="1000"
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Max Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Participants *
            </label>
            <input
              type="number"
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 1 })}
              min="2"
              max="1000"
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? 'Creating...' : 'Create Challenge'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChallengeCreationForm;
