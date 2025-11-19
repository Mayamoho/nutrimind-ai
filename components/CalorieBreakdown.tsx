


import React from 'react';
import { DailyProgress } from '../types';

interface CalorieBreakdownProps {
    progress: DailyProgress;
}

const CalorieBreakdown: React.FC<CalorieBreakdownProps> = ({ progress }) => {
    const { achieved: caloriesIn, eat } = progress.calories;
    const { bmr, neat, totalCaloriesOut, goalCalories, tef } = progress;

    const getBarPercentage = (value: number, total: number) => {
        if (total <= 0) return '0%';
        return `${Math.min((value / total) * 100, 100)}%`;
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">Calorie Breakdown</h2>
            <div className="space-y-5">
                {/* Calories In */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-sky-500">Calories In</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{Math.round(caloriesIn)} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">kcal</span></span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                        <div
                            className="bg-sky-500 h-4 rounded-full"
                            style={{ width: getBarPercentage(caloriesIn, goalCalories) }}
                        ></div>
                    </div>
                </div>

                {/* Calories Out */}
                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-violet-500">Calories Out</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{Math.round(totalCaloriesOut)} kcal</span>
                    </div>
                     <div className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-300">Basal Metabolic Rate (BMR)</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.round(bmr)} kcal</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-300">Non-Exercise Activity (NEAT)</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.round(neat)} kcal</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-300">Thermic Effect of Food (TEF)</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.round(tef)} kcal</span>
                        </div>
                         <div className="flex justify-between border-t border-slate-200 dark:border-slate-600 pt-2 mt-1">
                            <span className="text-slate-600 dark:text-slate-300">Exercise Burn (EAT)</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.round(eat)} kcal</span>
                        </div>
                    </div>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                        Total burn = BMR + NEAT (activity) + TEF (digestion) + EAT (exercise).
                    </p>
                </div>

            </div>
        </div>
    );
};

export default CalorieBreakdown;