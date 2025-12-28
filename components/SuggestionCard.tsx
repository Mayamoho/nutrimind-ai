import React from 'react';
import { Spinner } from './icons/Spinner';
import { useData } from '../contexts/DataContext';

const SuggestionCard: React.FC = () => {
    const { 
        aiSuggestion, 
        isLoadingSuggestion, 
        refreshSuggestion, 
        todayLog,
        detailedAnalysis,
        isLoadingDetailedAnalysis,
        fetchDetailedAnalysis
    } = useData();
    
    const suggestion = aiSuggestion;
    const isLoading = isLoadingSuggestion;

    const caloriePercent = suggestion?.progress?.percentComplete ?? 0;
    
    const hasSuggestions = suggestion && (
        suggestion.immediateAction ||
        suggestion.positiveFood?.length > 0 ||
        suggestion.positiveExercise?.length > 0 ||
        suggestion.progressAnalysis?.whyEatThis?.length > 0 ||
        suggestion.progressAnalysis?.whyAvoidThat?.length > 0 ||
        suggestion.progressAnalysis?.goodFoods?.length > 0 ||
        suggestion.progressAnalysis?.problematicFoods?.length > 0 ||
        suggestion.progressAnalysis?.nutritionalIssues?.length > 0 ||
        suggestion.progressAnalysis?.mealPlan
    );

    const hasLoggedData = todayLog.foods.length > 0 || todayLog.exercises.length > 0;

    // Helper function to safely render array items (handles both strings and objects)
    const renderArrayItem = (item: any, index: number) => {
        if (typeof item === 'string') {
            return item;
        } else if (typeof item === 'object' && item !== null) {
            // Handle object items - extract relevant properties
            if (item.name && item.reason) {
                return `${item.name}: ${item.reason}`;
            } else if (item.name && item.benefit) {
                return `${item.name} - ${item.benefit}`;
            } else if (item.food && item.issue) {
                return `${item.food}: ${item.issue}`;
            } else if (item.issue) {
                return item.issue;
            } else if (item.name) {
                return item.name;
            }
            // Fallback: stringify the object
            return JSON.stringify(item);
        }
        return String(item);
    };

    return (
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-xl">🥗</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">AI Nutritionist</h3>
                            <p className="text-white/70 text-xs">Personalized guidance</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasLoggedData && !isLoading && (
                            <button
                                onClick={refreshSuggestion}
                                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                                title="Get new advice"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={fetchDetailedAnalysis}
                            disabled={isLoadingDetailedAnalysis}
                            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
                            title="Get detailed analysis"
                        >
                            {isLoadingDetailedAnalysis ? (
                                <Spinner />
                            ) : (
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            {suggestion?.progress && (
                <div className="px-5 pt-4">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span>Daily Progress</span>
                        <span>{caloriePercent || 0}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${
                                (caloriePercent || 0) > 100 ? 'bg-red-500' :
                                (caloriePercent || 0) > 90 ? 'bg-emerald-500' :
                                (caloriePercent || 0) > 70 ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, caloriePercent || 0)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                        <span className="text-slate-500">{suggestion.progress.caloriesConsumed || 0} / {suggestion.progress.goalCalories || 2000} kcal</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{suggestion.progress.caloriesRemaining || 0} remaining</span>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="p-5">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse flex items-center justify-center">
                            <Spinner />
                        </div>
                        <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Analyzing your nutrition...</p>
                    </div>
                ) : hasSuggestions ? (
                    <div className="space-y-4">
                        {/* Grade Badge */}
                        {suggestion.progressAnalysis?.overallGrade && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-500">Today's Grade</span>
                                <span className={`text-2xl font-bold ${
                                    suggestion.progressAnalysis.overallGrade === 'A' ? 'text-emerald-500' :
                                    suggestion.progressAnalysis.overallGrade === 'B' ? 'text-blue-500' :
                                    suggestion.progressAnalysis.overallGrade === 'C' ? 'text-amber-500' : 'text-red-500'
                                }`}>
                                    {suggestion.progressAnalysis.overallGrade}
                                </span>
                            </div>
                        )}

                        {/* Detailed Consultation */}
                        {suggestion.progressAnalysis?.feedback && (
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border-l-4 border-indigo-500">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">👨‍⚕️</span>
                                    <h4 className="font-semibold text-indigo-700 dark:text-indigo-300">Your Nutritionist Says</h4>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                    {suggestion.progressAnalysis.feedback}
                                </p>
                            </div>
                        )}

                        {/* Immediate Action */}
                        {suggestion.immediateAction && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 flex items-start gap-3">
                                <span className="text-xl">⚡</span>
                                <div>
                                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase">Do This Now</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{suggestion.immediateAction}</p>
                                </div>
                            </div>
                        )}

                        {/* Next Meal Plan */}
                        {suggestion.nextMealSuggestion && (
                            <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
                                        🍽️ {suggestion.nextMealSuggestion.meal}
                                    </span>
                                </div>
                                {suggestion.nextMealSuggestion.options?.[0] && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{suggestion.nextMealSuggestion.options[0].name}</p>
                                )}
                            </div>
                        )}

                        {/* Food Recommendations */}
                        {suggestion.positiveFood?.length > 0 && (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">🥗</span>
                                    <h4 className="font-semibold text-emerald-700 dark:text-emerald-400">Recommended Foods</h4>
                                </div>
                                <ul className="space-y-2">
                                    {suggestion.positiveFood.slice(0, 5).map((item, index) => (
                                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300 pl-3 border-l-2 border-emerald-400">
                                            {renderArrayItem(item, index)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                         
                        {/* Exercise Recommendations */}
                        {suggestion.positiveExercise?.length > 0 && (
                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">💪</span>
                                    <h4 className="font-semibold text-orange-700 dark:text-orange-400">Exercise Tips</h4>
                                </div>
                                <ul className="space-y-2">
                                    {suggestion.positiveExercise.slice(0, 3).map((item, index) => (
                                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300 pl-3 border-l-2 border-orange-400">
                                            {renderArrayItem(item, index)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Why Eat This - Detailed Nutritionist Explanations */}
                        {suggestion.progressAnalysis?.whyEatThis?.length > 0 && (
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">✅</span>
                                    <h4 className="font-semibold text-green-700 dark:text-green-400">Why Eat This</h4>
                                </div>
                                <ul className="space-y-2">
                                    {suggestion.progressAnalysis.whyEatThis.map((item, index) => (
                                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300 pl-3 border-l-2 border-green-400">
                                            {renderArrayItem(item, index)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Why Avoid That */}
                        {suggestion.progressAnalysis?.whyAvoidThat?.length > 0 && (
                            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">🚫</span>
                                    <h4 className="font-semibold text-rose-700 dark:text-rose-400">Why Avoid That</h4>
                                </div>
                                <ul className="space-y-2">
                                    {suggestion.progressAnalysis.whyAvoidThat.map((item, index) => (
                                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300 pl-3 border-l-2 border-rose-400">
                                            {renderArrayItem(item, index)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Good Foods */}
                        {suggestion.progressAnalysis?.goodFoods?.length > 0 && (
                            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">🌟</span>
                                    <h4 className="font-semibold text-teal-700 dark:text-teal-400">Good Foods Today</h4>
                                </div>
                                <ul className="space-y-2">
                                    {suggestion.progressAnalysis.goodFoods.map((item, index) => (
                                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300 pl-3 border-l-2 border-teal-400">
                                            {renderArrayItem(item, index)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Problematic Foods */}
                        {suggestion.progressAnalysis?.problematicFoods?.length > 0 && (
                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">⚠️</span>
                                    <h4 className="font-semibold text-orange-700 dark:text-orange-400">Problematic Foods</h4>
                                </div>
                                <ul className="space-y-2">
                                    {suggestion.progressAnalysis.problematicFoods.map((item, index) => (
                                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300 pl-3 border-l-2 border-orange-400">
                                            {renderArrayItem(item, index)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Nutritional Issues */}
                        {suggestion.progressAnalysis?.nutritionalIssues?.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">🔴</span>
                                    <h4 className="font-semibold text-red-700 dark:text-red-400">Nutritional Issues</h4>
                                </div>
                                <ul className="space-y-2">
                                    {suggestion.progressAnalysis.nutritionalIssues.map((item, index) => (
                                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300 pl-3 border-l-2 border-red-400">
                                            {renderArrayItem(item, index)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Meal Plan */}
                        {suggestion.progressAnalysis?.mealPlan && (
                            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">📋</span>
                                    <h4 className="font-semibold text-violet-700 dark:text-violet-400">Recommended Meal Plan</h4>
                                </div>
                                <div className="space-y-3">
                                    {suggestion.progressAnalysis.mealPlan.breakfast && (
                                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                            <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase mb-1">🌅 Breakfast</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">{suggestion.progressAnalysis.mealPlan.breakfast}</p>
                                        </div>
                                    )}
                                    {suggestion.progressAnalysis.mealPlan.lunch && (
                                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                            <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase mb-1">☀️ Lunch</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">{suggestion.progressAnalysis.mealPlan.lunch}</p>
                                        </div>
                                    )}
                                    {suggestion.progressAnalysis.mealPlan.dinner && (
                                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                            <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase mb-1">🌙 Dinner</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">{suggestion.progressAnalysis.mealPlan.dinner}</p>
                                        </div>
                                    )}
                                    {suggestion.progressAnalysis.mealPlan.snacks && (
                                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                            <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase mb-1">🍎 Snacks</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">{suggestion.progressAnalysis.mealPlan.snacks}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Cautions */}
                        {suggestion.cautionFood?.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">⛔</span>
                                    <h4 className="font-semibold text-red-600 dark:text-red-400">Foods to Limit</h4>
                                </div>
                                <ul className="space-y-1">
                                    {suggestion.cautionFood.map((item, index) => (
                                        <li key={index} className="text-sm text-red-700 dark:text-red-400 pl-3 border-l-2 border-red-400">
                                            {renderArrayItem(item, index)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Hydration */}
                        {suggestion.hydrationTip && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 flex items-center gap-3">
                                <span className="text-xl">💧</span>
                                <div>
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Hydration Tip</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{suggestion.hydrationTip}</p>
                                </div>
                            </div>
                        )}

                        {/* Motivation */}
                        {suggestion.motivationalMessage && (
                            <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 text-center border border-purple-100 dark:border-purple-900/30">
                                <p className="text-sm text-purple-700 dark:text-purple-300 italic">
                                    "{suggestion.motivationalMessage}"
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🥗</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Your AI Nutritionist is Ready</p>
                        <p className="text-sm text-slate-500 mt-1">Log a meal or exercise to get personalized advice</p>
                        {hasLoggedData && (
                            <button
                                onClick={refreshSuggestion}
                                className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                            >
                                Get Nutrition Advice
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuggestionCard;