/**
 * Enhanced Food Search Component
 * Features:
 * - Local database search (instant results)
 * - Backend API search
 * - Category browsing
 * - Edit before logging
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MealType, FoodLog } from '../types';
import { api } from '../services/api';
import { SearchIcon } from './icons/SearchIcon';
import { Spinner } from './icons/Spinner';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { searchLocalFoods, getFoodCategories, getFoodsByCategory, FoodDatabaseItem } from '../utils/foodDatabase';
import FoodEditModal from './FoodEditModal';
import { motion } from 'framer-motion';

interface FoodSearchProps {
  onAddFood: (foods: Omit<FoodLog, 'id' | 'timestamp'>[]) => void;
}

type FoodItem = Omit<FoodLog, 'id' | 'timestamp'>;

// Convert database item to FoodLog format
const convertToFoodItem = (item: FoodDatabaseItem, mealType: MealType): FoodItem => ({
  name: item.name,
  calories: Number(item.calories) || 0,
  mealType,
  servingQuantity: 1,
  servingUnit: item.servingSize,
  nutrients: {
    macros: [
      { name: 'Protein', amount: Number(item.protein) || 0, unit: 'g' },
      { name: 'Carbs', amount: Number(item.carbs) || 0, unit: 'g' },
      { name: 'Fat', amount: Number(item.fat) || 0, unit: 'g' },
    ],
    micros: [
      { name: 'Sodium', amount: Number(item.sodium) || 0, unit: 'mg' },
      { name: 'Sugar', amount: Number(item.sugar) || 0, unit: 'g' },
      { name: 'Fiber', amount: Number(item.fiber) || 0, unit: 'g' },
      { name: 'Potassium', amount: Number(item.potassium) || 0, unit: 'mg' },
      { name: 'Cholesterol', amount: item.cholesterol || 0, unit: 'mg' },
      { name: 'Vitamin A', amount: item.vitaminA || 0, unit: 'mcg' },
      { name: 'Vitamin C', amount: item.vitaminC || 0, unit: 'mg' },
      { name: 'Vitamin D', amount: item.vitaminD || 0, unit: 'mcg' },
      { name: 'Calcium', amount: item.calcium || 0, unit: 'mg' },
      { name: 'Iron', amount: item.iron || 0, unit: 'mg' },
      { name: 'Magnesium', amount: item.magnesium || 0, unit: 'mg' },
      { name: 'Zinc', amount: item.zinc || 0, unit: 'mg' }
    ],
  },
});

export const FoodSearch: React.FC<FoodSearchProps> = ({ onAddFood }) => {
  const [query, setQuery] = useState('');
  const [localResults, setLocalResults] = useState<FoodDatabaseItem[]>([]);
  const [apiResults, setApiResults] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealType>(MealType.Breakfast);
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const categories = useMemo(() => getFoodCategories(), []);

  // Local search on query change (instant)
  useEffect(() => {
    if (query.length >= 2) {
      const results = searchLocalFoods(query, 15);
      setLocalResults(results);
      setSelectedCategory(null);
    } else if (query.length === 0) {
      setLocalResults([]);
    }
  }, [query]);

  // Category browsing
  useEffect(() => {
    if (selectedCategory) {
      const results = getFoodsByCategory(selectedCategory);
      setLocalResults(results);
      setQuery('');
    }
  }, [selectedCategory]);

  // API search (debounced)
  const handleApiSearch = async () => {
    if (!query || query.length < 2) return;

    setIsLoading(true);
    setError(null);
    setApiResults([]);

    try {
      const searchResults = await api.searchFoods(query);
      // Convert API results to FoodItem format
      const converted = searchResults.map(item => ({
        ...item,
        mealType: selectedMeal,
      })) as FoodItem[];
      setApiResults(converted);
    } catch (err: any) {
      console.error('Food search failed:', err);
      setError('API search failed. Showing local results only.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFood = (food: FoodItem) => {
    onAddFood([food]);
    setAddedNames(prev => new Set(prev).add(food.name));
  };

  const handleEditAndAdd = (food: FoodItem) => {
    setEditingFood(food);
    setShowEditModal(true);
  };

  const handleSaveEdit = (editedFood: FoodItem) => {
    onAddFood([editedFood]);
    setAddedNames(prev => new Set(prev).add(editedFood.name));
    setShowEditModal(false);
    setEditingFood(null);
  };

  const handleLocalItemClick = (item: FoodDatabaseItem, edit: boolean = false) => {
    const foodItem = convertToFoodItem(item, selectedMeal);
    if (edit) {
      handleEditAndAdd(foodItem);
    } else {
      handleAddFood(foodItem);
    }
  };

  return (
    <div className="space-y-4">
      {/* Meal Type Selection */}
      <div className="flex flex-wrap gap-2 justify-center">
        {Object.values(MealType).map(meal => (
          <button
            key={meal}
            type="button"
            onClick={() => setSelectedMeal(meal)}
            className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
              selectedMeal === meal
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-slate-600'
            }`}
          >
            {meal}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setSelectedCategory(null);
          }}
          placeholder="Search foods (e.g., 'chicken', 'rice', 'apple')"
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
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400 self-center">Browse:</span>
        {categories.slice(0, 8).map(category => (
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

      {error && <p className="text-sm text-amber-500 text-center">{error}</p>}

      {/* Results */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
        {/* Local Results */}
        {localResults.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>📚</span>
              {selectedCategory ? `${selectedCategory} Foods` : 'Quick Results'}
              <span className="text-xs font-normal">({localResults.length})</span>
            </h3>
            {localResults.map((food, index) => (
              <motion.div
                key={`local-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/30 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{food.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {food.calories} kcal • P:{food.protein}g, C:{food.carbs}g, F:{food.fat}g
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {food.sodium && food.sodium > 0 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">Na:{food.sodium}mg</span>
                    )}
                    {food.fiber && food.fiber > 0 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">Fiber:{food.fiber}g</span>
                    )}
                    {food.sugar && food.sugar > 0 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">Sugar:{food.sugar}g</span>
                    )}
                    {food.calcium && food.calcium > 0 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">Ca:{food.calcium}mg</span>
                    )}
                    {food.iron && food.iron > 0 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">Fe:{food.iron}mg</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{food.servingSize}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleLocalItemClick(food, true)}
                    className="p-2 text-slate-400 hover:text-sky-500 transition-colors"
                    title="Edit before adding"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => handleLocalItemClick(food, false)}
                    className="flex items-center gap-1 text-sm bg-emerald-100 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300 font-semibold px-3 py-1.5 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-700 transition-colors disabled:bg-slate-200 dark:disabled:bg-slate-600 disabled:text-slate-500 disabled:cursor-not-allowed"
                    disabled={addedNames.has(food.name)}
                  >
                    <PlusIcon />
                    {addedNames.has(food.name) ? 'Added' : 'Add'}
                  </button>
                </div>
              </motion.div>
            ))}
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
            {apiResults.map((food, index) => {
              const protein = food.nutrients?.macros?.find(m => m.name === 'Protein')?.amount || 0;
              const carbs = food.nutrients?.macros?.find(m => m.name === 'Carbs')?.amount || 0;
              const fat = food.nutrients?.macros?.find(m => m.name === 'Fat')?.amount || 0;
              const micros = food.nutrients?.micros || [];
              
              // Get key micro-nutrients to display
              const sodium = micros.find(m => m.name === 'Sodium')?.amount || 0;
              const fiber = micros.find(m => m.name === 'Fiber')?.amount || 0;
              const sugar = micros.find(m => m.name === 'Sugar')?.amount || 0;
              const calcium = micros.find(m => m.name === 'Calcium')?.amount || 0;
              const iron = micros.find(m => m.name === 'Iron')?.amount || 0;

              return (
                <motion.div
                  key={`api-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-between bg-sky-50 dark:bg-sky-900/20 p-3 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{food.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {food.calories} kcal • P:{Math.round(protein)}g, C:{Math.round(carbs)}g, F:{Math.round(fat)}g
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {sodium > 0 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">Na:{sodium}mg</span>
                      )}
                      {fiber > 0 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">Fiber:{fiber}g</span>
                      )}
                      {sugar > 0 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">Sugar:{sugar}g</span>
                      )}
                      {calcium > 0 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">Ca:{calcium}mg</span>
                      )}
                      {iron > 0 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">Fe:{iron}mg</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {food.servingQuantity} {food.servingUnit}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditAndAdd(food)}
                      className="p-2 text-slate-400 hover:text-sky-500 transition-colors"
                      title="Edit before adding"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleAddFood(food)}
                      className="flex items-center gap-1 text-sm bg-emerald-100 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300 font-semibold px-3 py-1.5 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-700 transition-colors disabled:bg-slate-200 dark:disabled:bg-slate-600 disabled:text-slate-500 disabled:cursor-not-allowed"
                      disabled={addedNames.has(food.name)}
                    >
                      <PlusIcon />
                      {addedNames.has(food.name) ? 'Added' : 'Add'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </>
        )}

        {/* Empty State */}
        {!isLoading && localResults.length === 0 && apiResults.length === 0 && query.length >= 2 && (
          <p className="text-center text-slate-500 dark:text-slate-400 py-4">
            No results found for "{query}". Try a different search term.
          </p>
        )}

        {/* Initial State */}
        {!query && !selectedCategory && (
          <p className="text-center text-slate-500 dark:text-slate-400 py-4">
            Start typing to search, or browse by category above.
          </p>
        )}
      </div>

      {/* Edit Modal */}
      <FoodEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingFood(null);
        }}
        food={editingFood}
        onSave={handleSaveEdit}
      />
    </div>
  );
};
