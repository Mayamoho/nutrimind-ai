import React from 'react';
import { WeightIcon } from './icons/WeightIcon';
import { WeightLog } from '../types';

interface WeightProgressProps {
    currentWeight: number;
    targetWeight: number;
    startWeight?: number;
    weightLog: WeightLog[];
}

const WeightProgress: React.FC<WeightProgressProps> = ({ currentWeight, targetWeight, startWeight, weightLog }) => {
    // Ensure values are numbers
    const currentWeightNum = Number(currentWeight);
    const targetWeightNum = Number(targetWeight);
    const startWeightNum = startWeight ? Number(startWeight) : null;

    if (!currentWeightNum || !targetWeightNum) {
        return null;
    }

    const effectiveStartWeight = typeof startWeightNum === 'number' && !isNaN(startWeightNum) ? startWeightNum : currentWeightNum;

    const totalChangeRequired = Math.abs(effectiveStartWeight - targetWeightNum);

    let progressPercentage = 0;
    if (totalChangeRequired > 0) {
        progressPercentage = ((currentWeightNum - effectiveStartWeight) / (targetWeightNum - effectiveStartWeight)) * 100;
    } else if (currentWeightNum === targetWeightNum) {
        progressPercentage = 100;
    }
    
    const displayPercentage = Math.max(0, Math.min(progressPercentage, 100));

    // Get the last 5 days for the table
    const recentLogs = [...weightLog].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <WeightIcon />
                        Weight Progress
                    </h2>
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full">
                        Auto-updated
                    </span>
                </div>
                 <div className="grid grid-cols-3 text-center text-sm font-semibold mb-2">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400">Start</p>
                        <p className="text-slate-800 dark:text-slate-200 text-lg">{effectiveStartWeight.toFixed(1)} kg</p>
                    </div>
                     <div>
                        <p className="text-emerald-500">Current</p>
                        <p className="text-slate-800 dark:text-slate-200 text-2xl font-bold">{currentWeightNum.toFixed(1)} kg</p>
                    </div>
                     <div>
                        <p className="text-slate-500 dark:text-slate-400">Target</p>
                        <p className="text-slate-800 dark:text-slate-200 text-lg">{targetWeightNum.toFixed(1)} kg</p>
                    </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 relative mb-6">
                    <div
                        className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${displayPercentage}%` }}
                    ></div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300">Recent Progress</h3>
                     <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 rounded-lg px-3 py-2 grid grid-cols-3 gap-2 font-semibold">
                       <span>Date</span>
                       <span className="text-right">Weight</span>
                       <span className="text-right">Change</span>
                     </div>
                     <div className="max-h-28 overflow-y-auto pr-2">
                     {recentLogs.length > 1 ? recentLogs.map((log, index) => {
                         const prevLog = recentLogs[index + 1];
                         const logWeight = Number(log.weight);
                         const prevWeight = prevLog ? Number(prevLog.weight) : 0;
                         const change = prevLog ? logWeight - prevWeight : 0;
                         const changeColor = change > 0.01 ? 'text-red-500' : change < -0.01 ? 'text-emerald-500' : 'text-slate-500';

                         return (
                            <div key={log.date} className="text-sm text-slate-800 dark:text-slate-200 px-3 py-1.5 grid grid-cols-3 gap-2">
                                <span>{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                <span className="text-right font-medium">{logWeight.toFixed(2)} kg</span>
                                <span className={`text-right ${changeColor}`}>{change.toFixed(2)} kg</span>
                           </div>
                         )
                     }) : (
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">
                            Log food or exercise to see projected weight
                        </p>
                     )}
                     </div>
                </div>
                
                {/* Info about auto-calculation */}
                <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                        💡 Weight updates instantly after each food/exercise log based on calorie balance (7700 cal = 1 kg)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WeightProgress;
