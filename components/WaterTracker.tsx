import React from 'react';
import { useData } from '../contexts/DataContext';

const WaterTracker: React.FC = () => {
    const { todayLog, dailyProgress, addWater } = useData();
    
    const currentIntake = Number(todayLog?.waterIntake) || 0;
    const target = Number(dailyProgress?.waterTarget) || 2500;
    
    const progressPercentage = target > 0 ? Math.min(((currentIntake / target) * 100), 100) : 0;
    const safeProgressPercentage = isNaN(progressPercentage) ? 0 : progressPercentage;
    const glasses = Math.floor(currentIntake / 250); // 250ml per glass
    const targetGlasses = Math.ceil(target / 250);

    // Determine status message
    const getStatusMessage = () => {
        if (progressPercentage >= 100) return { text: "Great job! Goal reached! 🎉", color: "text-emerald-500" };
        if (progressPercentage >= 75) return { text: "Almost there! Keep going! 💪", color: "text-sky-500" };
        if (progressPercentage >= 50) return { text: "Halfway there! 👍", color: "text-sky-500" };
        if (progressPercentage >= 25) return { text: "Good start! Keep drinking! 💧", color: "text-sky-500" };
        return { text: "Start hydrating! 💧", color: "text-slate-500" };
    };

    const status = getStatusMessage();
    
    const handleAddWater = (amount: number) => {
        console.log('Adding water:', amount);
        addWater(amount);
    };

    return (
        <div className="bg-gradient-to-br from-white to-sky-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-2xl">💧</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Water Intake</h2>
                            <p className="text-white/70 text-xs">Stay hydrated!</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-white">{glasses}</p>
                        <p className="text-white/70 text-xs">glasses</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Progress Display */}
                <div className="text-center mb-4">
                    <div className="relative inline-block">
                        <span className="text-4xl font-bold text-sky-600 dark:text-sky-400">
                            {(currentIntake / 1000).toFixed(1)}
                        </span>
                        <span className="text-lg text-slate-500 dark:text-slate-400 ml-1">
                            / {(target / 1000).toFixed(1)} L
                        </span>
                    </div>
                    <p className={`text-sm font-medium mt-1 ${status.color}`}>
                        {status.text}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="relative mb-4">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-sky-400 via-cyan-500 to-teal-500"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>0%</span>
                        <span>{Math.round(progressPercentage)}%</span>
                        <span>100%</span>
                    </div>
                </div>

                {/* Glass Indicators */}
                <div className="flex justify-center gap-1 mb-4 flex-wrap">
                    {Array.from({ length: Math.min(targetGlasses, 10) }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-6 h-8 rounded-b-lg border-2 transition-all duration-300 ${
                                i < glasses
                                    ? 'bg-sky-400 border-sky-500 shadow-sm shadow-sky-500/30'
                                    : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600'
                            }`}
                            title={`Glass ${i + 1}`}
                        />
                    ))}
                    {targetGlasses > 10 && (
                        <span className="text-xs text-slate-500 self-center ml-1">
                            +{targetGlasses - 10}
                        </span>
                    )}
                </div>

                {/* Quick Add Buttons */}
                <div className="space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
                        Quick Add
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => handleAddWater(250)}
                            className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 font-semibold py-3 px-2 rounded-xl hover:bg-sky-200 dark:hover:bg-sky-800/50 transition-all hover:scale-105 active:scale-95"
                            aria-label="Add 250ml of water"
                        >
                            <span className="block text-lg">🥛</span>
                            <span className="text-xs">+250ml</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAddWater(500)}
                            className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 font-semibold py-3 px-2 rounded-xl hover:bg-sky-200 dark:hover:bg-sky-800/50 transition-all hover:scale-105 active:scale-95"
                            aria-label="Add 500ml of water"
                        >
                            <span className="block text-lg">🍶</span>
                            <span className="text-xs">+500ml</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAddWater(750)}
                            className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 font-semibold py-3 px-2 rounded-xl hover:bg-sky-200 dark:hover:bg-sky-800/50 transition-all hover:scale-105 active:scale-95"
                            aria-label="Add 750ml of water"
                        >
                            <span className="block text-lg">🫗</span>
                            <span className="text-xs">+750ml</span>
                        </button>
                    </div>
                </div>

                {/* Tip */}
                <div className="mt-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        💡 Aim for 8 glasses (2L) daily for optimal hydration
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WaterTracker;
