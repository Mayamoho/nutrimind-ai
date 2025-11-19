import React, { useState, useEffect } from 'react';
import { UserGoals, WeightGoal } from '../types';

interface GoalSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentGoals: UserGoals;
    onSave: (newGoals: UserGoals) => void;
}

const GoalSettingsModal: React.FC<GoalSettingsModalProps> = ({ isOpen, onClose, currentGoals, onSave }) => {
    const [goals, setGoals] = useState<UserGoals>(currentGoals);

    useEffect(() => {
        setGoals(currentGoals);
    }, [currentGoals, isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['targetWeight', 'goalTimeline'].includes(name);
        setGoals(prevGoals => ({
            ...prevGoals,
            [name]: isNumeric ? (value === '' ? 0 : parseInt(value, 10)) : value,
        }));
    };
    
    const handleSave = () => {
        onSave(goals);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold">Set Your Health Goals</h2>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Primary Goal</label>
                            <select
                                name="weightGoal"
                                value={goals.weightGoal}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
                            >
                                <option value="lose">Lose Weight</option>
                                <option value="maintain">Maintain Weight</option>
                                <option value="gain">Gain Weight</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="targetWeight" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Weight (kg)</label>
                            <input
                                type="number"
                                id="targetWeight"
                                name="targetWeight"
                                value={goals.targetWeight}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
                            />
                        </div>
                    </div>
                     <div className="grid grid-cols-1">
                        <div>
                            <label htmlFor="goalTimeline" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Timeframe (weeks)</label>
                            <input
                                type="number"
                                id="goalTimeline"
                                name="goalTimeline"
                                value={goals.goalTimeline}
                                onChange={handleChange}
                                placeholder="e.g., 12"
                                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
                            />
                        </div>
                     </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2">
                        Your daily calorie and macronutrient targets will be calculated automatically based on these goals and your daily activity.
                    </p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-4 rounded-b-2xl">
                    <button 
                        onClick={onClose}
                        className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GoalSettingsModal;