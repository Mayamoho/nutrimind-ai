import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { FoodLog, ExerciseLog } from '../types';
import { EXERCISE_DATABASE } from '../utils/exerciseDatabase';
import Toast from './Toast';
import { FoodIcon, DumbbellIcon, PlusCircleIcon, FireIcon } from './icons';

interface QuickActionsProps {
  onQuickAddFood?: (food: Omit<FoodLog, 'id' | 'timestamp'>) => void;
  onQuickAddExercise?: (exercise: Omit<ExerciseLog, 'id' | 'timestamp'>) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onQuickAddFood, onQuickAddExercise }) => {
  const { user } = useAuth();
  const [topFoods, setTopFoods] = useState<Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingUnit: string;
    servingQuantity: number;
    frequency: number;
  }>>([]);
  const [topExercises, setTopExercises] = useState<Array<{
    name: string;
    caloriesBurned: number;
    duration: number;
    frequency: number;
  }>>([]);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    if (!user) return;
    loadUserTopItems();
  }, [user]);

  const loadUserTopItems = async () => {
    if (!user) return;
    
    try {
      // Get user's daily logs to analyze frequency
      const userData = await api.getUserData();
      const dailyLogs = userData.dailyLogs || [];
      
      // If no user data, show default popular items
      if (dailyLogs.length === 0) {
        // Default popular foods
        const defaultFoods = [
          { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, servingUnit: 'medium', servingQuantity: 1, frequency: 0 },
          { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, servingUnit: 'medium', servingQuantity: 1, frequency: 0 },
          { name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0.7, servingUnit: 'cup', servingQuantity: 1, frequency: 0 },
          { name: 'Almonds', calories: 164, protein: 6, carbs: 6, fat: 14, servingUnit: 'oz', servingQuantity: 1, frequency: 0 },
          { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingUnit: 'oz', servingQuantity: 4, frequency: 0 }
        ];
        
        // Default popular exercises
        const defaultExercises = [
          { name: 'Walking', caloriesBurned: 85, duration: 30, frequency: 0 },
          { name: 'Running', caloriesBurned: 300, duration: 30, frequency: 0 },
          { name: 'Cycling', caloriesBurned: 250, duration: 30, frequency: 0 },
          { name: 'Push-ups', caloriesBurned: 100, duration: 15, frequency: 0 },
          { name: 'Yoga', caloriesBurned: 90, duration: 30, frequency: 0 }
        ];
        
        setTopFoods(defaultFoods);
        setTopExercises(defaultExercises);
        return;
      }
      
      // Analyze food frequency and nutrients
      const foodFrequency: { [key: string]: { count: number; totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number; servingUnit: string; servingQuantity: number } } = {};
      const exerciseFrequency: { [key: string]: { count: number; totalCaloriesBurned: number; duration: number } } = {};
      
      dailyLogs.forEach((log: any) => {
        // Process foods
        if (log.foods && Array.isArray(log.foods)) {
          log.foods.forEach((food: any) => {
            const key = food.name.toLowerCase();
            if (!foodFrequency[key]) {
              foodFrequency[key] = {
                count: 0,
                totalCalories: 0,
                totalProtein: 0,
                totalCarbs: 0,
                totalFat: 0,
                servingUnit: food.servingUnit || 'serving',
                servingQuantity: food.servingQuantity || 1
              };
            }
            
            foodFrequency[key].count++;
            foodFrequency[key].totalCalories += food.calories || 0;
            
            // Extract nutrients
            if (food.nutrients && food.nutrients.macros) {
              food.nutrients.macros.forEach((macro: any) => {
                if (macro.name === 'Protein') foodFrequency[key].totalProtein += macro.amount || 0;
                if (macro.name === 'Carbs') foodFrequency[key].totalCarbs += macro.amount || 0;
                if (macro.name === 'Fat') foodFrequency[key].totalFat += macro.amount || 0;
              });
            }
          });
        }
        
        // Process exercises
        if (log.exercises && Array.isArray(log.exercises)) {
          log.exercises.forEach((exercise: any) => {
            const key = exercise.name.toLowerCase();
            if (!exerciseFrequency[key]) {
              exerciseFrequency[key] = {
                count: 0,
                totalCaloriesBurned: 0,
                duration: exercise.duration || 30
              };
            }
            
            exerciseFrequency[key].count++;
            exerciseFrequency[key].totalCaloriesBurned += exercise.caloriesBurned || 0;
          });
        }
      });
      
      // Convert to arrays and sort by frequency, take top 5
      const sortedFoods = Object.entries(foodFrequency)
        .map(([name, data]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          calories: Math.round(data.totalCalories / data.count),
          protein: Math.round((data.totalProtein / data.count) * 10) / 10,
          carbs: Math.round((data.totalCarbs / data.count) * 10) / 10,
          fat: Math.round((data.totalFat / data.count) * 10) / 10,
          servingUnit: data.servingUnit,
          servingQuantity: data.servingQuantity,
          frequency: data.count
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5);
      
      const sortedExercises = Object.entries(exerciseFrequency)
        .map(([name, data]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          caloriesBurned: Math.round(data.totalCaloriesBurned / data.count),
          duration: data.duration,
          frequency: data.count
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5);
      
      setTopFoods(sortedFoods);
      setTopExercises(sortedExercises);
    } catch (error) {
      console.error('Error loading user top items:', error);
      // Show default items on error
      const defaultFoods = [
        { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, servingUnit: 'medium', servingQuantity: 1, frequency: 0 },
        { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, servingUnit: 'medium', servingQuantity: 1, frequency: 0 },
        { name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0.7, servingUnit: 'cup', servingQuantity: 1, frequency: 0 },
        { name: 'Almonds', calories: 164, protein: 6, carbs: 6, fat: 14, servingUnit: 'oz', servingQuantity: 1, frequency: 0 },
        { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingUnit: 'oz', servingQuantity: 4, frequency: 0 }
      ];
      
      const defaultExercises = [
        { name: 'Walking', caloriesBurned: 85, duration: 30, frequency: 0 },
        { name: 'Running', caloriesBurned: 300, duration: 30, frequency: 0 },
        { name: 'Cycling', caloriesBurned: 250, duration: 30, frequency: 0 },
        { name: 'Push-ups', caloriesBurned: 100, duration: 15, frequency: 0 },
        { name: 'Yoga', caloriesBurned: 90, duration: 30, frequency: 0 }
      ];
      
      setTopFoods(defaultFoods);
      setTopExercises(defaultExercises);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleQuickAddFood = async (food: typeof topFoods[0]) => {
    try {
      // Get detailed food information with nutrients
      const searchResults = await api.searchFoods(food.name);
      const foundFood = searchResults.find((f: any) => 
        f.name.toLowerCase().includes(food.name.toLowerCase()) ||
        food.name.toLowerCase().includes(f.name.toLowerCase())
      );
      
      const foodItem: Omit<FoodLog, 'id' | 'timestamp'> = {
        name: food.name,
        calories: foundFood?.calories || food.calories,
        mealType: 'snack' as any,
        servingQuantity: food.servingQuantity,
        servingUnit: food.servingUnit,
        nutrients: foundFood?.nutrients || {
          macros: [
            { name: 'Protein', amount: food.protein, unit: 'g' },
            { name: 'Carbs', amount: food.carbs, unit: 'g' },
            { name: 'Fat', amount: food.fat, unit: 'g' }
          ],
          micros: []
        }
      };
      
      onQuickAddFood?.(foodItem);
      showToast(`${food.name} logged successfully!`, 'success');
    } catch (error) {
      console.error('Error adding food:', error);
      showToast(`Failed to log ${food.name}`, 'error');
    }
  };

  const handleQuickAddExercise = (exercise: typeof topExercises[0]) => {
    try {
      const exerciseItem: Omit<ExerciseLog, 'id' | 'timestamp'> = {
        name: exercise.name,
        duration: exercise.duration,
        caloriesBurned: exercise.caloriesBurned
      };
      
      onQuickAddExercise?.(exerciseItem);
      showToast(`${exercise.name} logged successfully!`, 'success');
    } catch (error) {
      console.error('Error adding exercise:', error);
      showToast(`Failed to log ${exercise.name}`, 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl shadow-2xl p-8 space-y-8 border border-gray-100 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Quick Actions</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Log your favorites in one tap</p>
        </div>
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-75"></div>
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Favorite Foods Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
              <FoodIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Favorite Foods</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Your most logged meals</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {topFoods.length > 0 ? (
              topFoods.map((food, index) => (
                <div
                  key={index}
                  className="group relative bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-gray-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                  onClick={() => handleQuickAddFood(food)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {food.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {food.name}
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <FireIcon className="w-4 h-4" />
                            <span>{food.calories} cal</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                            <span>{food.protein}g protein</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg transform hover:scale-110 transition-all duration-200">
                        <PlusCircleIcon className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Frequency indicator */}
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{food.frequency}x</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-600">
                <FoodIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No favorite foods yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start logging foods to see them here!</p>
              </div>
            )}
          </div>
        </div>

        {/* Favorite Exercises Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
              <DumbbellIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Favorite Exercises</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Your top workouts</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {topExercises.length > 0 ? (
              topExercises.map((exercise, index) => (
                <div
                  key={index}
                  className="group relative bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                  onClick={() => handleQuickAddExercise(exercise)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {exercise.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {exercise.name}
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <FireIcon className="w-4 h-4" />
                            <span>{exercise.caloriesBurned} cal</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                            <span>{exercise.duration} min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg transform hover:scale-110 transition-all duration-200">
                        <PlusCircleIcon className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Frequency indicator */}
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{exercise.frequency}x</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-600">
                <DumbbellIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No favorite exercises yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start logging exercises to see them here!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {toast.show && <Toast message={toast.message} onClose={() => setToast({ show: false, message: '', type: 'success' })} />}
    </div>
  );
};

export default QuickActions;