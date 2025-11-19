import React, { useState } from 'react';
import { NeatLog } from '../types';
import { WalkingIcon } from './icons/WalkingIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface NeatLoggerProps {
    loggedActivities: NeatLog[];
    onAddActivity: (activity: Omit<NeatLog, 'id'>) => void;
    onUpdateActivity: (id: string, calories: number) => void;
    onRemoveActivity: (id: string) => void;
}

const passiveActivities = [
    { name: "Cleaning / Household Chores (1hr)", calories: 150 },
    { name: "Standing (1hr)", calories: 50 },
    { name: "Typing / Office Work (1hr)", calories: 40 },
    { name: "Light Walking (e.g., around home/office, 1hr)", calories: 100 },
    { name: "Manual Labor (light, 1hr)", calories: 200 },
    { name: "Dancing (casual, 30min)", calories: 120 },
    { name: "Playing a musical instrument (30min)", calories: 70 },
    { name: "Cooking / Meal Prep (1hr)", calories: 90 },
    { name: "Shopping (with cart, 1hr)", calories: 130 },
    { name: "Gardening (light, 1hr)", calories: 160 },
    { name: "Playing with kids (moderate, 30min)", calories: 100 },
    { name: "Stretching / Light Yoga (30min)", calories: 80 },
];

const CUSTOM_ACTIVITY_VALUE = 'custom';

const NeatLogger: React.FC<NeatLoggerProps> = ({ loggedActivities, onAddActivity, onUpdateActivity, onRemoveActivity }) => {
    const [selectedActivity, setSelectedActivity] = useState(passiveActivities[0].name);
    const [customName, setCustomName] = useState('');
    const [customCalories, setCustomCalories] = useState('');

    const handleAdd = () => {
        if (selectedActivity === CUSTOM_ACTIVITY_VALUE) {
            const caloriesNum = parseInt(customCalories, 10);
            if (customName.trim() && !isNaN(caloriesNum) && caloriesNum > 0) {
                onAddActivity({ name: customName, calories: caloriesNum });
                // Reset custom fields and dropdown
                setCustomName('');
                setCustomCalories('');
                setSelectedActivity(passiveActivities[0].name);
            }
        } else {
            const activity = passiveActivities.find(a => a.name === selectedActivity);
            if (activity) {
                onAddActivity(activity);
            }
        }
    };
    
    const handleCaloriesChange = (id: string, value: string) => {
        const calories = parseInt(value, 10);
        if (!isNaN(calories)) {
            onUpdateActivity(id, calories);
        }
    };

    const isAddDisabled = selectedActivity === CUSTOM_ACTIVITY_VALUE &&
        (!customName.trim() || !customCalories || parseInt(customCalories, 10) <= 0);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><WalkingIcon /> Passive Activity (NEAT)</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Log calories from daily non-exercise activities. This helps create a more accurate picture of your total energy expenditure.
            </p>
            <div className="space-y-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <select
                        value={selectedActivity}
                        onChange={(e) => setSelectedActivity(e.target.value)}
                        className="w-full md:col-span-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
                    >
                        {passiveActivities.map(act => (
                            <option key={act.name} value={act.name}>{act.name} (~{act.calories} kcal)</option>
                        ))}
                        <option value={CUSTOM_ACTIVITY_VALUE}>-- Add Custom Activity --</option>
                    </select>
                    <button
                        onClick={handleAdd}
                        disabled={isAddDisabled}
                        className="flex-shrink-0 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        <PlusIcon /> Add
                    </button>
                </div>
                {selectedActivity === CUSTOM_ACTIVITY_VALUE && (
                     <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            placeholder="Enter activity name"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
                        />
                        <input
                            type="number"
                            placeholder="Est. Calories"
                            value={customCalories}
                            onChange={(e) => setCustomCalories(e.target.value)}
                            className="w-full sm:w-40 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
                        />
                    </div>
                )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {loggedActivities.map(activity => (
                    <div key={activity.id} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg">
                        <span className="flex-1 text-sm text-slate-800 dark:text-slate-200">{activity.name}</span>
                        <input
                            type="number"
                            value={activity.calories}
                            onChange={(e) => handleCaloriesChange(activity.id, e.target.value)}
                            className="bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white rounded px-2 py-1 text-sm w-24 text-right"
                            aria-label="Edit item calories"
                        />
                        <span className="text-sm text-slate-500 dark:text-slate-400">kcal</span>
                         <button onClick={() => onRemoveActivity(activity.id)} className="p-1 text-slate-400 hover:text-red-500" aria-label="Remove item">
                            <TrashIcon />
                        </button>
                    </div>
                ))}
                {loggedActivities.length === 0 && (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-4">No passive activities logged for today.</p>
                )}
            </div>
        </div>
    );
};

export default NeatLogger;