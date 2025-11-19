import React from 'react';
import { WaterDropIcon } from './icons/WaterDropIcon';

interface WaterTrackerProps {
    currentIntake: number;
    target: number;
    onAddWater: (amount: number) => void;
}

const WaterTracker: React.FC<WaterTrackerProps> = ({ currentIntake, target, onAddWater }) => {
    const progressPercentage = target > 0 ? Math.min((currentIntake / target) * 100, 100) : 0;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <WaterDropIcon />
                Water Intake
            </h2>
            <div className="text-center mb-4">
                <span className="text-3xl font-bold text-sky-500">{currentIntake}</span>
                <span className="text-lg text-slate-500 dark:text-slate-400"> / {target} ml</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 relative mb-4">
                <div
                    className="bg-sky-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>
            <div className="flex justify-center gap-2">
                <button
                    onClick={() => onAddWater(250)}
                    className="bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-semibold py-2 px-4 rounded-lg hover:bg-sky-200 dark:hover:bg-sky-800 transition-colors"
                    aria-label="Add 250ml of water"
                >
                    +250ml
                </button>
                <button
                    onClick={() => onAddWater(500)}
                    className="bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-semibold py-2 px-4 rounded-lg hover:bg-sky-200 dark:hover:bg-sky-800 transition-colors"
                    aria-label="Add 500ml of water"
                >
                    +500ml
                </button>
                <button
                    onClick={() => onAddWater(750)}
                    className="bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-semibold py-2 px-4 rounded-lg hover:bg-sky-200 dark:hover:bg-sky-800 transition-colors"
                    aria-label="Add 750ml of water"
                >
                    +750ml
                </button>
            </div>
        </div>
    );
};

export default WaterTracker;
