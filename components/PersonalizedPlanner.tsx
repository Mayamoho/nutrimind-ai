/**
 * New PersonalizedPlanner - simplified and compatible with new backend
 * - Calls /api/planner/generate and renders meals/workouts
 */

import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Spinner } from './icons/Spinner';


interface FoodItem {
  name: string;
  category: string;
  calories: number;
  protein?: number;
  isCombo?: boolean;
  subFoods?: FoodItem[];
  budget?: string;
  country?: string;
  modifications?: string;
}

interface PlanItem {
  name: string;
  description: string;
  calories: number;
  protein?: number;
  time?: string;
  foods?: FoodItem[];
}

interface Plan {
  meals: PlanItem[];
  workouts: PlanItem[];
  tips: string[];
  week?: Array<{
    day: string;
    theme: string;
    focus: string;
    targetCalories: number;
    targetProtein: number;
    meals: {
      breakfast: { combo: string; calories: number; protein: number; foods: any[] };
      lunch: { combo: string; calories: number; protein: number; foods: any[] };
      dinner: { combo: string; calories: number; protein: number; foods: any[] };
      snacks: { combo: string; calories: number; protein: number; foods: any[] };
    };
  }>;
  weeklyTips?: string[];
  shoppingList?: any;
}

type PlanType = 'daily' | 'weekly' | 'workout';
type BudgetType = 'budget' | 'economical' | 'moderate' | 'premium';

const PersonalizedPlanner: React.FC = () => {
  const { user } = useAuth();
  const [activePlan, setActivePlan] = useState<PlanType>('daily');
  const [selectedBudget, setSelectedBudget] = useState<BudgetType>('moderate');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedMeals, setExpandedMeals] = useState<Set<number>>(new Set());

  const generatePlan = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getPersonalizedPlan(activePlan, selectedBudget);
      // Normalize response to our UI shape
      setPlan({
        meals: result.meals?.map((m: any) => ({
          name: m.name,
          description: m.description,
          calories: m.calories || 0,
          protein: m.protein || 0,
          time: m.time,
          foods: (Array.isArray(m.foods) ? m.foods : (m.foods ? [m.foods] : []) ).map((f: any) => {
            // Handle combo objects - show combo name with total calories
            if (f.foods && Array.isArray(f.foods)) {
              return { 
                name: f.name || 'Combo', 
                calories: f.calories || 0, 
                protein: f.protein || 0,
                isCombo: true,
                subFoods: f.foods,
                budget: f.budget,
                country: f.country,
                modifications: f.modifications
              };
            }
            // Handle simple food objects
            if (typeof f === 'object' && f.name) {
              return { 
                name: f.name || f.title || 'Item', 
                calories: f.calories || 0, 
                protein: f.protein || 0,
                budget: f.budget,
                country: f.country,
                modifications: f.modifications
              };
            }
            // Handle simple strings
            if (typeof f === 'string') return { name: f, calories: 0, protein: 0 };
            return { name: 'Unknown', calories: 0, protein: 0 };
          })
        })) || [],
        workouts: result.workouts || [],
        tips: result.tips || [],
      });
      setExpandedMeals(new Set());
    } catch (err: any) {
      console.error('Failed to generate plan:', err);
      setError(err.message || 'Failed to generate plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user, activePlan, selectedBudget]);

  const toggleMealExpansion = (index: number) => {
    const newExpanded = new Set(expandedMeals);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedMeals(newExpanded);
  };

  const budgetOptions: Array<{ id: BudgetType; label: string; icon: string }> = [
    { id: 'budget', label: 'Budget', icon: '💰' },
    { id: 'economical', label: 'Economical', icon: '💵' },
    { id: 'moderate', label: 'Moderate', icon: '💸' },
    { id: 'premium', label: 'Premium', icon: '💎' },
  ];

  const planTabs = [
    { id: 'daily' as PlanType, label: 'Daily Meals', icon: '🍽️' },
    { id: 'weekly' as PlanType, label: 'Weekly Plan', icon: '📅' },
    { id: 'workout' as PlanType, label: 'Workout', icon: '💪' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-5">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🎯</span> Personalized Planner
        </h3>
        <p className="text-white/80 text-sm mt-1">AI-powered recommendations based on your history</p>
      </div>

      {/* Plan Type Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {planTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActivePlan(tab.id); setPlan(null); }}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activePlan === tab.id
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5">
        {!plan && !isLoading && (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <span className="text-4xl">{planTabs.find(t => t.id === activePlan)?.icon}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Get a personalized {activePlan === 'workout' ? 'workout' : 'meal'} plan based on your goals and preferences
            </p>
            
            {/* Budget Selection - Only show for daily plans */}
            {activePlan === 'daily' && (
              <div className="mb-6">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Select your budget:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {budgetOptions.map((budget) => (
                    <button
                      key={budget.id}
                      onClick={() => setSelectedBudget(budget.id)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        selectedBudget === budget.id
                          ? 'bg-purple-500 text-white shadow-md scale-105'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-purple-300'
                      }`}
                    >
                      <span className="mr-1">{budget.icon}</span>
                      {budget.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={generatePlan}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
            >
              ✨ Generate Plan
            </button>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <Spinner />
            <p className="mt-3 text-slate-600 dark:text-slate-400">Creating your personalized plan...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <span className="text-4xl block mb-2">😕</span>
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={generatePlan}
              className="text-indigo-500 hover:text-indigo-600 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {plan && !isLoading && (
          <div className="space-y-4">
            {/* Meals or Workouts */}
            {(activePlan === 'workout' ? plan.workouts : plan.meals).map((item, idx) => {
              const isExpanded = expandedMeals.has(idx);
              const hasFoods = item.foods && item.foods.length > 0;
              
              return (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {activePlan === 'workout' ? '🏋️' : idx === 0 ? '🌅' : idx === 1 ? '☀️' : idx === 2 ? '🌙' : '🍎'}
                        </span>
                        <h4 className="font-semibold text-slate-800 dark:text-white">{item.name}</h4>
                        {item.time && (
                          <span className="text-xs bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                            {item.time}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.description}</p>
                      
                      {/* Food Options - Expandable */}
                      {hasFoods && (
                        <button
                          onClick={() => toggleMealExpansion(idx)}
                          className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1 hover:underline"
                        >
                          <span>{isExpanded ? '▼' : '▲'}</span>
                          {item.foods!.length} options
                        </button>
                      )}
                      
                      {isExpanded && hasFoods && (
                        <div className="mt-3 space-y-2 pl-4 border-l-2 border-purple-300 dark:border-purple-600">
                          {item.foods!.map((food, foodIdx) => (
                            <div key={foodIdx} className="text-xs text-slate-600 dark:text-slate-400">
                              <div className="font-medium flex items-center gap-2">
                                {food.name}
                                {food.budget && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                                    food.budget === 'budget' ? 'bg-green-100 text-green-700' :
                                    food.budget === 'economical' ? 'bg-blue-100 text-blue-700' :
                                    food.budget === 'moderate' ? 'bg-purple-100 text-purple-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {food.budget.charAt(0).toUpperCase() + food.budget.slice(1)}
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-400 dark:text-slate-500 ml-2">
                                ({food.calories} kcal, {food.protein}g protein)
                              </div>
                              {food.modifications && (
                                <div className="text-xs text-slate-500 dark:text-slate-500 ml-2 italic">
                                  {food.modifications}
                                </div>
                              )}
                              {/* Show sub-foods for combos */}
                              {food.isCombo && food.subFoods && (
                                <div className="mt-1 ml-2 space-y-1">
                                  {food.subFoods.map((subFood: any, subIdx: number) => (
                                    <div key={subIdx} className="text-xs text-slate-500 dark:text-slate-500">
                                      • {subFood.name} ({subFood.calories} kcal, {subFood.protein}g protein)
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <span className={`text-lg font-bold ${activePlan === 'workout' ? 'text-orange-500' : 'text-emerald-500'}`}>
                        {item.calories}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">kcal</span>
                      {item.protein !== undefined && (
                        <>
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 block mt-1">
                            {item.protein}g
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block">protein</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Tips */}
            {plan.tips.length > 0 && (
              <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                  <span>💡</span> Pro Tips
                </h4>
                <ul className="space-y-2">
                  {plan.tips.map((tip, idx) => (
                    <li key={idx} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Regenerate Button */}
            <div className="text-center pt-4">
              <button
                onClick={generatePlan}
                className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 font-medium text-sm flex items-center gap-2 mx-auto"
              >
                <span>🔄</span> Generate New Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizedPlanner;
