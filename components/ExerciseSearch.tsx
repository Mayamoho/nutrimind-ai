/**
 * Enhanced Exercise Search Component
 * Features:
 * - Local database search (instant results)
 * - Backend API search
 * - Category and intensity browsing
 * - Duration adjustment
 * - Edit before logging
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ExerciseLog } from '../types';
import { api } from '../services/api';
import { SearchIcon } from './icons/SearchIcon';
import { Spinner } from './icons/Spinner';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { 
  searchLocalExercises, 
  getExerciseCategories, 
  getExercisesByCategory,
  getExercisesByIntensity,
  calculateCaloriesForDuration,
  ExerciseDatabaseItem 
} from '../utils/exerciseDatabase';
import ExerciseEditModal from './ExerciseEditModal';

interface ExerciseSearchProps {
  onAddExercise: (exercise: Omit<ExerciseLog, 'id' | 'timestamp'>) => void;
}

type ExerciseItem = Omit<ExerciseLog, 'id' | 'timestamp'>;

// Convert database item to ExerciseLog format
const convertToExerciseItem = (item: ExerciseDatabaseItem, duration: number): ExerciseItem => ({
  name: item.name,
  duration,
  caloriesBurned: calculateCaloriesForDuration(item.caloriesPer30Min, duration),
});

export const ExerciseSearch: React.FC<ExerciseSearchProps> = ({ onAddExercise }) => {
  const [query, setQuery] = useState('');
  const [localResults, setLocalResults] = useState<ExerciseDatabaseItem[]>([]);
  const [apiResults, setApiResults] = useState<ExerciseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState<string | null>(null);
  const [duration, setDuration] = useState(30);
  const [editingExercise, setEditingExercise] = useState<ExerciseItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const categories = useMemo(() => getExerciseCategories(), []);
  const intensities = ['low', 'moderate', 'high', 'very high'];

  // Local search on query change (instant)
  useEffect(() => {
    if (query.length >= 2) {
      const results = searchLocalExercises(query, 15);
      setLocalResults(results);
      setSelectedCategory(null);
      setSelectedIntensity(null);
    } else if (query.length === 0 && !selectedCategory && !selectedIntensity) {
      setLocalResults([]);
    }
  }, [query]);

  // Category browsing
  useEffect(() => {
    if (selectedCategory) {
      const results = getExercisesByCategory(selectedCategory);
      setLocalResults(results);
      setQuery('');
      setSelectedIntensity(null);
    }
  }, [selectedCategory]);

  // Intensity browsing
  useEffect(() => {
    if (selectedIntensity) {
      const results = getExercisesByIntensity(selectedIntensity as any);
      setLocalResults(results);
      setQuery('');
      setSelectedCategory(null);
    }
  }, [selectedIntensity]);

  // API search
  const handleApiSearch = async () => {
    if (!query || query.length < 2) return;

    setIsLoading(true);
    setError(null);
    setApiResults([]);

    try {
      const searchResults = await api.searchExercises(query);
      setApiResults(searchResults);
    } catch (err: any) {
      console.error('Exercise search failed:', err);
      setError('API search failed. Showing local results only.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExercise = (exercise: ExerciseItem) => {
    onAddExercise(exercise);
    setAddedNames(prev => new Set(prev).add(exercise.name));
  };

  const handleEditAndAdd = (exercise: ExerciseItem) => {
    setEditingExercise(exercise);
    setShowEditModal(true);
  };

  const handleSaveEdit = (editedExercise: ExerciseItem) => {
    onAddExercise(editedExercise);
    setAddedNames(prev => new Set(prev).add(editedExercise.name));
    setShowEditModal(false);
    setEditingExercise(null);
  };

  const handleLocalItemClick = (item: ExerciseDatabaseItem, edit: boolean = false) => {
    const exerciseItem = convertToExerciseItem(item, duration);
    if (edit) {
      handleEditAndAdd(exerciseItem);
    } else {
      handleAddExercise(exerciseItem);
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'moderate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'very high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Duration Selection */}
      <div className="flex items-center justify-center gap-3">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Duration:</span>
        <div className="flex gap-1">
          {[15, 30, 45, 60, 90].map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                duration === d
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-slate-600'
              }`}
            >
              {d}m
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setSelectedCategory(null);
            setSelectedIntensity(null);
          }}
          placeholder="Search exercises (e.g., 'running', 'yoga', 'cycling')"
          className="w-full pl-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
        />
        <button
          type="button"
          onClick={handleApiSearch}
          className="flex items-center justify-center px-4 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-slate-400"
          disabled={isLoading || !query}
          aria-label="Search API"
          title="Search online database"
        >
          {isLoading ? <Spinner /> : <SearchIcon />}
        </button>
      </div>

      {/* Category Chips */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 self-center">Category:</span>
          {categories.slice(0, 6).map(category => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
              className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-sky-100 dark:hover:bg-slate-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 self-center">Intensity:</span>
          {intensities.map(intensity => (
            <button
              key={intensity}
              type="button"
              onClick={() => setSelectedIntensity(intensity === selectedIntensity ? null : intensity)}
              className={`px-2 py-1 text-xs font-medium rounded-full transition-colors capitalize ${
                selectedIntensity === intensity
                  ? getIntensityColor(intensity)
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {intensity}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-amber-500 text-center">{error}</p>}

      {/* Results */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
        {/* Local Results */}
        {localResults.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>🏃</span>
              {selectedCategory || selectedIntensity 
                ? `${selectedCategory || selectedIntensity} Exercises` 
                : 'Quick Results'}
              <span className="text-xs font-normal">({localResults.length})</span>
            </h3>
            {localResults.map((exercise, index) => {
              const calories = calculateCaloriesForDuration(exercise.caloriesPer30Min, duration);
              return (
                <div
                  key={`local-${index}`}
                  className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/30 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{exercise.name}</p>
                      <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${getIntensityColor(exercise.intensity)}`}>
                        {exercise.intensity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      ~{calories} kcal for {duration} min
                    </p>
                    {exercise.description && (
                      <p className="text-xs text-slate-400 dark:text-slate-500">{exercise.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleLocalItemClick(exercise, true)}
                      className="p-2 text-slate-400 hover:text-sky-500 transition-colors"
                      title="Edit before adding"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleLocalItemClick(exercise, false)}
                      className="flex items-center gap-1 text-sm bg-emerald-100 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300 font-semibold px-3 py-1.5 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-700 transition-colors disabled:bg-slate-200 dark:disabled:bg-slate-600 disabled:text-slate-500 disabled:cursor-not-allowed"
                      disabled={addedNames.has(exercise.name)}
                    >
                      <PlusIcon />
                      {addedNames.has(exercise.name) ? 'Added' : 'Add'}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* API Results */}
        {apiResults.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-4">
              <span>🌐</span>
              Online Results
              <span className="text-xs font-normal">({apiResults.length})</span>
            </h3>
            {apiResults.map((exercise, index) => (
              <div
                key={`api-${index}`}
                className="flex items-center justify-between bg-sky-50 dark:bg-sky-900/20 p-3 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{exercise.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    ~{exercise.caloriesBurned} kcal per {exercise.duration} min
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditAndAdd(exercise)}
                    className="p-2 text-slate-400 hover:text-sky-500 transition-colors"
                    title="Edit before adding"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => handleAddExercise(exercise)}
                    className="flex items-center gap-1 text-sm bg-emerald-100 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300 font-semibold px-3 py-1.5 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-700 transition-colors disabled:bg-slate-200 dark:disabled:bg-slate-600 disabled:text-slate-500 disabled:cursor-not-allowed"
                    disabled={addedNames.has(exercise.name)}
                  >
                    <PlusIcon />
                    {addedNames.has(exercise.name) ? 'Added' : 'Add'}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Empty State */}
        {!isLoading && localResults.length === 0 && apiResults.length === 0 && query.length >= 2 && (
          <p className="text-center text-slate-500 dark:text-slate-400 py-4">
            No results found for "{query}". Try a different search term.
          </p>
        )}

        {/* Initial State */}
        {!query && !selectedCategory && !selectedIntensity && (
          <p className="text-center text-slate-500 dark:text-slate-400 py-4">
            Start typing to search, or browse by category/intensity above.
          </p>
        )}
      </div>

      {/* Edit Modal */}
      <ExerciseEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingExercise(null);
        }}
        exercise={editingExercise}
        onSave={handleSaveEdit}
      />
    </div>
  );
};
