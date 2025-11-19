import React from 'react';
import { DailyProgress } from '../types';

interface TargetCardProps {
    progress: DailyProgress;
}

const TargetCard: React.FC<TargetCardProps> = ({ progress }) => {
    const caloriesIn = progress.calories.achieved;
    
    const goalCalories = progress.goalCalories || 0;
    
    const remainingCalories = goalCalories - caloriesIn;

    // Helper to calculate progress and check if target is exceeded
    const getMacroProgress = (current: number, target: number) => {
        if (target <= 0) return { displayPercent: '0%', isOver: false };
        const percentage = (current / target) * 100;
        return {
            displayPercent: `${Math.min(percentage, 100)}%`,
            // Consider "over" if they exceed by more than 5% to avoid flickering on exact matches
            isOver: percentage > 105,
        };
    };
    
    const proteinProgress = getMacroProgress(progress.protein, progress.proteinTarget);
    const carbsProgress = getMacroProgress(progress.carbs, progress.carbTarget);
    const fatProgress = getMacroProgress(progress.fat, progress.fatTarget);


    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Today's Targets</h2>
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Calories In */}
                    <div className="flex-1 text-center bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Calories In</p>
                        <p className="text-2xl font-bold text-sky-500">{Math.round(caloriesIn)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">kcal</p>
                    </div>
                    {/* Goal Calories */}
                    <div className="flex-1 text-center bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Daily Calorie Target</p>
                        <p className="text-2xl font-bold text-emerald-500">{Math.round(goalCalories)}</p>
                         <p className="text-xs text-slate-500 dark:text-slate-400">kcal</p>
                    </div>
                    {/* Remaining */}
                    <div className="flex-1 text-center bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Remaining</p>
                        <p className={`text-2xl font-bold ${remainingCalories >= 0 ? 'text-slate-800 dark:text-slate-200' : 'text-orange-500'}`}>{Math.round(remainingCalories)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">kcal</p>
                    </div>
                </div>
                 <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4 px-2">
                    * Your calorie and macro targets are dynamically calculated based on your TDEE (Total Daily Energy Expenditure) and your weight goals.
                </p>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 text-center">Macronutrient Breakdown</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Protein Card */}
                    <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                        <div className="flex justify-between items-baseline mb-2">
                            <span className="font-bold text-sky-500">Protein</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Target: {Math.round(progress.proteinTarget)}g</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">{Math.round(progress.protein)}<span className="text-base font-medium text-slate-500 dark:text-slate-400">g</span></p>
                        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                            <div
                                className={`${proteinProgress.isOver ? 'bg-yellow-500' : 'bg-sky-500'} h-2 rounded-full transition-all duration-500`}
                                style={{ width: proteinProgress.displayPercent }}
                            ></div>
                        </div>
                    </div>

                    {/* Carbs Card */}
                    <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                        <div className="flex justify-between items-baseline mb-2">
                            <span className="font-bold text-orange-500">Carbs</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Target: {Math.round(progress.carbTarget)}g</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">{Math.round(progress.carbs)}<span className="text-base font-medium text-slate-500 dark:text-slate-400">g</span></p>
                        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                            <div
                                className={`${carbsProgress.isOver ? 'bg-yellow-500' : 'bg-orange-500'} h-2 rounded-full transition-all duration-500`}
                                style={{ width: carbsProgress.displayPercent }}
                            ></div>
                        </div>
                    </div>

                    {/* Fat Card */}
                    <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                        <div className="flex justify-between items-baseline mb-2">
                            <span className="font-bold text-violet-500">Fat</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Target: {Math.round(progress.fatTarget)}g</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">{Math.round(progress.fat)}<span className="text-base font-medium text-slate-500 dark:text-slate-400">g</span></p>
                        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                            <div
                                className={`${fatProgress.isOver ? 'bg-yellow-500' : 'bg-violet-500'} h-2 rounded-full transition-all duration-500`}
                                style={{ width: fatProgress.displayPercent }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TargetCard;
