

import React, { useState } from 'react';
import { DailyLog, MealType, FoodLog, ExerciseLog } from '../types';
import { FireIcon } from './icons/FireIcon';
import { FoodIcon } from './icons/FoodIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';

interface LogListProps {
    todayLog: DailyLog;
    onUpdateFood: (id: string, data: { name: string; calories: number; }) => void;
    onDeleteFood: (id: string) => void;
    onUpdateExercise: (id: string, data: { name: string; caloriesBurned: number; }) => void;
    onDeleteExercise: (id: string) => void;
}

const LogList: React.FC<LogListProps> = ({ todayLog, onUpdateFood, onDeleteFood, onUpdateExercise, onDeleteExercise }) => {
    const { foods, exercises } = todayLog;

    const [editingItem, setEditingItem] = useState<{ id: string; name: string; calories: number; } | null>(null);

    const handleEdit = (item: FoodLog | ExerciseLog) => {
        setEditingItem({
            id: item.id,
            name: item.name,
            calories: 'calories' in item ? item.calories : item.caloriesBurned,
        });
    };

    const handleCancel = () => {
        setEditingItem(null);
    };

    const handleCaloriesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingItem) return;
        setEditingItem({
            ...editingItem,
            calories: parseInt(e.target.value, 10) || 0,
        });
    };
    
    const handleSaveFood = (id: string) => {
        if (!editingItem) return;
        onUpdateFood(id, { name: editingItem.name, calories: editingItem.calories });
        setEditingItem(null);
    };

    const handleSaveExercise = (id: string) => {
        if (!editingItem) return;
        onUpdateExercise(id, { name: editingItem.name, caloriesBurned: editingItem.calories });
        setEditingItem(null);
    };


    const foodSections = {
        [MealType.Breakfast]: foods.filter(f => f.mealType === MealType.Breakfast),
        [MealType.Lunch]: foods.filter(f => f.mealType === MealType.Lunch),
        [MealType.Dinner]: foods.filter(f => f.mealType === MealType.Dinner),
        [MealType.Snacks]: foods.filter(f => f.mealType === MealType.Snacks),
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FoodIcon /> Today's Food Log</h2>
            <div className="space-y-4 mb-6">
                {Object.entries(foodSections).map(([meal, items]) => {
                    if (items.length === 0) return null;
                    return (
                        <div key={meal}>
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">{meal as MealType}</h3>
                            <ul className="space-y-2">
                                {items.map(item => (
                                    <li key={item.id} className="flex justify-between items-center bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg min-h-[64px]">
                                        {editingItem?.id === item.id ? (
                                            <>
                                                <span className="capitalize flex-1">{editingItem.name}</span>
                                                <div className="flex items-center gap-2">
                                                   <input
                                                        type="number"
                                                        name="calories"
                                                        value={editingItem.calories}
                                                        onChange={handleCaloriesChange}
                                                        className="bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white rounded px-2 py-1 text-sm w-20 text-right"
                                                        aria-label="Edit item calories"
                                                        autoFocus
                                                    />
                                                    <span className="text-sm">kcal</span>
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    <button onClick={() => handleSaveFood(item.id)} className="text-emerald-500 hover:text-emerald-700 text-sm font-semibold">Save</button>
                                                    <button onClick={handleCancel} className="text-slate-500 hover:text-slate-700 text-sm">Cancel</button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <span className="capitalize font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                                                    {item.nutrients?.macros && item.nutrients.macros.length > 0 && (
                                                        <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                            <span>
                                                                <span className="font-medium text-sky-500">P:</span> {item.nutrients.macros.find(m => m.name === 'Protein')?.amount || 0}g
                                                            </span>
                                                            <span>
                                                                <span className="font-medium text-orange-500">C:</span> {item.nutrients.macros.find(m => m.name === 'Carbs')?.amount || 0}g
                                                            </span>
                                                            <span>
                                                                <span className="font-medium text-violet-500">F:</span> {item.nutrients.macros.find(m => m.name === 'Fat')?.amount || 0}g
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.calories} kcal</span>
                                                    <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-sky-500" aria-label={`Edit ${item.name}`}>
                                                        <EditIcon />
                                                    </button>
                                                    <button onClick={() => onDeleteFood(item.id)} className="text-slate-400 hover:text-red-500" aria-label={`Delete ${item.name}`}>
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
                {foods.length === 0 && <p className="text-slate-500 dark:text-slate-400">No food logged yet for today.</p>}
            </div>

            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FireIcon /> Today's Exercise Log</h2>
            <div className="space-y-2">
                {exercises.map(ex => (
                    <div key={ex.id} className="flex justify-between items-center bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg min-h-[50px]">
                         {editingItem?.id === ex.id ? (
                            <>
                                <span className="capitalize flex-1">{editingItem.name}</span>
                                <div className="flex items-center gap-2">
                                   <input
                                        type="number"
                                        name="calories"
                                        value={editingItem.calories}
                                        onChange={handleCaloriesChange}
                                        className="bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white rounded px-2 py-1 text-sm w-20 text-right"
                                        aria-label="Edit calories burned"
                                        autoFocus
                                    />
                                    <span className="text-sm">kcal</span>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button onClick={() => handleSaveExercise(ex.id)} className="text-emerald-500 hover:text-emerald-700 text-sm font-semibold">Save</button>
                                    <button onClick={handleCancel} className="text-slate-500 hover:text-slate-700 text-sm">Cancel</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex-1">
                                    <span className="capitalize">{ex.name}</span>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{ex.duration} min</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{ex.caloriesBurned} kcal</span>
                                    <button onClick={() => handleEdit(ex)} className="text-slate-400 hover:text-sky-500" aria-label={`Edit ${ex.name}`}>
                                        <EditIcon />
                                    </button>
                                    <button onClick={() => onDeleteExercise(ex.id)} className="text-slate-400 hover:text-red-500" aria-label={`Delete ${ex.name}`}>
                                        <TrashIcon />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {exercises.length === 0 && <p className="text-slate-500 dark:text-slate-400">No exercise logged yet for today.</p>}
            </div>
        </div>
    );
};

export default LogList;
