/**
 * Exercise Edit Modal
 * Allows users to edit exercise details (name, duration, calories) before logging
 */

import React, { useState, useEffect } from 'react';
import { ExerciseLog } from '../types';

type ExerciseItem = Omit<ExerciseLog, 'id' | 'timestamp'>;

interface ExerciseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: ExerciseItem | null;
  onSave: (exercise: ExerciseItem) => void;
}

// Common exercise intensity multipliers (calories per minute per kg body weight)
const INTENSITY_LEVELS = [
  { label: 'Light', multiplier: 0.05, description: 'Walking, stretching' },
  { label: 'Moderate', multiplier: 0.08, description: 'Brisk walking, cycling' },
  { label: 'Vigorous', multiplier: 0.12, description: 'Running, swimming' },
  { label: 'Intense', multiplier: 0.15, description: 'HIIT, sprinting' },
];

const ExerciseEditModal: React.FC<ExerciseEditModalProps> = ({ isOpen, onClose, exercise, onSave }) => {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [baseCaloriesPer30Min, setBaseCaloriesPer30Min] = useState(0);

  useEffect(() => {
    if (exercise) {
      setName(exercise.name);
      setDuration(exercise.duration);
      setCaloriesBurned(exercise.caloriesBurned);
      // Calculate base rate from the exercise data
      setBaseCaloriesPer30Min(exercise.duration > 0 
        ? Math.round((exercise.caloriesBurned / exercise.duration) * 30) 
        : exercise.caloriesBurned);
    }
  }, [exercise]);

  if (!isOpen || !exercise) return null;

  // Recalculate calories when duration changes
  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    if (baseCaloriesPer30Min > 0) {
      const newCalories = Math.round((baseCaloriesPer30Min / 30) * newDuration);
      setCaloriesBurned(newCalories);
    }
  };

  // Quick duration presets
  const durationPresets = [15, 30, 45, 60, 90];

  const handleSave = () => {
    const updatedExercise: ExerciseItem = {
      name,
      duration,
      caloriesBurned,
    };
    onSave(updatedExercise);
    onClose();
  };

  // Estimate calories based on intensity (assuming 70kg body weight)
  const estimateCalories = (intensityMultiplier: number) => {
    const estimatedWeight = 70; // Default assumption
    return Math.round(intensityMultiplier * estimatedWeight * duration);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Edit Exercise Before Logging</h2>
        
        <div className="space-y-4">
          {/* Exercise Name */}
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Exercise Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Duration (minutes)
            </label>
            <div className="flex gap-2 mb-2">
              {durationPresets.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleDurationChange(preset)}
                  className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                    duration === preset
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100'
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              max="300"
              value={duration}
              onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Calories Burned */}
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Calories Burned
            </label>
            <input
              type="number"
              min="0"
              value={caloriesBurned}
              onChange={(e) => setCaloriesBurned(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg font-semibold"
            />
          </div>

          {/* Intensity Quick Estimates */}
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Quick Estimate by Intensity
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INTENSITY_LEVELS.map(level => (
                <button
                  key={level.label}
                  type="button"
                  onClick={() => setCaloriesBurned(estimateCalories(level.multiplier))}
                  className="p-2 text-left bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <span className="block text-sm font-medium text-slate-800 dark:text-white">
                    {level.label}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    ~{estimateCalories(level.multiplier)} kcal
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              * Estimates based on 70kg body weight for {duration} minutes
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-emerald-700 dark:text-emerald-300">Total Burn:</span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {caloriesBurned} kcal
            </span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            {name} • {duration} minutes
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
          >
            Add to Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseEditModal;
