/**
 * Food Edit Modal
 * Allows users to edit food details (name, calories, serving, macros) before logging
 */

import React, { useState, useEffect } from 'react';
import { FoodLog, MealType, NutrientInfo } from '../types';

type FoodItem = Omit<FoodLog, 'id' | 'timestamp'>;

interface FoodEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: FoodItem | null;
  onSave: (food: FoodItem) => void;
}

// Default micro-nutrients with their default values and units
const DEFAULT_MICROS = [
  { name: 'Fiber', amount: 0, unit: 'g' },
  { name: 'Sugar', amount: 0, unit: 'g' },
  { name: 'Sodium', amount: 0, unit: 'mg' },
  { name: 'Potassium', amount: 0, unit: 'mg' },
  { name: 'Cholesterol', amount: 0, unit: 'mg' },
  { name: 'Vitamin A', amount: 0, unit: 'mcg' },
  { name: 'Vitamin C', amount: 0, unit: 'mg' },
  { name: 'Vitamin D', amount: 0, unit: 'mcg' },
  { name: 'Calcium', amount: 0, unit: 'mg' },
  { name: 'Iron', amount: 0, unit: 'mg' },
  { name: 'Magnesium', amount: 0, unit: 'mg' },
  { name: 'Zinc', amount: 0, unit: 'mg' }
];

const FoodEditModal: React.FC<FoodEditModalProps> = ({ isOpen, onClose, food, onSave }) => {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState(0);
  const [servingQuantity, setServingQuantity] = useState(1);
  const [servingUnit, setServingUnit] = useState('serving');
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [micros, setMicros] = useState<NutrientInfo[]>(DEFAULT_MICROS);
  const [mealType, setMealType] = useState<MealType>(MealType.Breakfast);

  useEffect(() => {
    if (food) {
      setName(food.name);
      setCalories(food.calories);
      setServingQuantity(food.servingQuantity);
      setServingUnit(food.servingUnit);
      setMealType(food.mealType);
      
      // Set macros
      const proteinNutrient = food.nutrients?.macros?.find(m => m.name === 'Protein');
      const carbsNutrient = food.nutrients?.macros?.find(m => m.name === 'Carbs');
      const fatNutrient = food.nutrients?.macros?.find(m => m.name === 'Fat');
      
      setProtein(proteinNutrient?.amount || 0);
      setCarbs(carbsNutrient?.amount || 0);
      setFat(fatNutrient?.amount || 0);
      
      // Set micros, preserving any existing micros and adding defaults for any missing
      if (food.nutrients?.micros?.length) {
        const updatedMicros = [...DEFAULT_MICROS];
        
        food.nutrients.micros.forEach(micro => {
          const index = updatedMicros.findIndex(m => m.name === micro.name);
          if (index >= 0) {
            updatedMicros[index] = { ...micro };
          } else {
            updatedMicros.push({ ...micro });
          }
        });
        
        setMicros(updatedMicros);
      } else {
        setMicros([...DEFAULT_MICROS]);
      }
    }
  }, [food]);

  if (!isOpen || !food) return null;

  const handleMicroChange = (index: number, value: number) => {
    const newMicros = [...micros];
    newMicros[index] = { ...newMicros[index], amount: value };
    setMicros(newMicros);
  };

  const handleSave = () => {
    const updatedFood: FoodItem = {
      name,
      calories,
      servingQuantity,
      servingUnit,
      mealType,
      nutrients: {
        macros: [
          { name: 'Protein', amount: protein, unit: 'g' },
          { name: 'Carbs', amount: carbs, unit: 'g' },
          { name: 'Fat', amount: fat, unit: 'g' },
        ],
        micros: micros.filter(micro => micro.amount > 0), // Only include micros with amount > 0
      },
    };
    onSave(updatedFood);
    onClose();
  };

  // Calculate calories from macros (optional helper)
  const calculateCaloriesFromMacros = () => {
    return Math.round(protein * 4 + carbs * 4 + fat * 9);
  };

  // Group micros into chunks of 3 for better layout
  const microChunks = [];
  for (let i = 0; i < micros.length; i += 3) {
    microChunks.push(micros.slice(i, i + 3));
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Food Before Logging</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Food Name and Meal Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Food Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Meal Type
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {Object.values(MealType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Serving Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Serving Quantity
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={servingQuantity}
                onChange={(e) => setServingQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Serving Unit
              </label>
              <input
                type="text"
                value={servingUnit}
                onChange={(e) => setServingUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., cup, g, oz"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Calories
              </label>
              <input
                type="number"
                min="0"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Macros */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Macronutrients</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={protein}
                  onChange={(e) => setProtein(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={carbs}
                  onChange={(e) => setCarbs(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Fat (g)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={fat}
                  onChange={(e) => setFat(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Micros */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Micronutrients</h3>
            <div className="space-y-3">
              {microChunks.map((chunk, chunkIndex) => (
                <div key={chunkIndex} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {chunk.map((micro, index) => {
                    const microIndex = chunkIndex * 3 + index;
                    return (
                      <div key={micro.name}>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                          {micro.name} ({micro.unit})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step={micro.unit === 'g' ? '0.1' : '1'}
                          value={micro.amount}
                          onChange={(e) => handleMicroChange(microIndex, Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Save & Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodEditModal;
