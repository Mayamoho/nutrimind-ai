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

// --- FACTORY PATTERN: Products ---

interface LogItemProps {
    item: FoodLog | ExerciseLog;
    isEditing: boolean;
    editData: { name: string; calories: number } | null;
    onEdit: (item: FoodLog | ExerciseLog) => void;
    onDelete: (id: string) => void;
    onSave: (id: string) => void;
    onCancel: () => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FoodLogItem: React.FC<LogItemProps> = ({ item, isEditing, editData, onEdit, onDelete, onSave, onCancel, onChange }) => {
    const food = item as FoodLog;
    console.log('FoodLogItem received:', food);
    return (
        <li className="flex justify-between items-center bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg min-h-[64px]">
            {isEditing ? (
                <>
                    <span className="capitalize flex-1">{editData?.name}</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            name="calories"
                            value={editData?.calories}
                            onChange={onChange}
                            className="bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white rounded px-2 py-1 text-sm w-20 text-right"
                            aria-label="Edit item calories"
                            autoFocus
                        />
                        <span className="text-sm">kcal</span>
                    </div>
                    <div className="flex gap-2 ml-4">
                        <button onClick={() => onSave(food.id)} className="text-emerald-500 hover:text-emerald-700 text-sm font-semibold">Save</button>
                        <button onClick={onCancel} className="text-slate-500 hover:text-slate-700 text-sm">Cancel</button>
                    </div>
                </>
            ) : (
                <>
                    <div>
                        <span className="capitalize font-semibold text-slate-800 dark:text-slate-200">{food.name}</span>
                        {food.nutrients?.macros && food.nutrients.macros.length > 0 && (
                            <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                <span>
                                    <span className="font-medium text-sky-500">P:</span> {food.nutrients.macros.find(m => m.name === 'Protein')?.amount || 0}g
                                </span>
                                <span>
                                    <span className="font-medium text-orange-500">C:</span> {food.nutrients.macros.find(m => m.name === 'Carbs')?.amount || 0}g
                                </span>
                                <span>
                                    <span className="font-medium text-violet-500">F:</span> {food.nutrients.macros.find(m => m.name === 'Fat')?.amount || 0}g
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{food.calories} kcal</span>
                        <button onClick={() => onEdit(food)} className="text-slate-400 hover:text-sky-500" aria-label={`Edit ${food.name}`}>
                            <EditIcon />
                        </button>
                        <button onClick={() => onDelete(food.id)} className="text-slate-400 hover:text-red-500" aria-label={`Delete ${food.name}`}>
                            <TrashIcon />
                        </button>
                    </div>
                </>
            )}
        </li>
    );
};

const ExerciseLogItem: React.FC<LogItemProps> = ({ item, isEditing, editData, onEdit, onDelete, onSave, onCancel, onChange }) => {
    const exercise = item as ExerciseLog;
    return (
        <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg min-h-[50px]">
            {isEditing ? (
                <>
                    <span className="capitalize flex-1">{editData?.name}</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            name="calories"
                            value={editData?.calories}
                            onChange={onChange}
                            className="bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white rounded px-2 py-1 text-sm w-20 text-right"
                            aria-label="Edit calories burned"
                            autoFocus
                        />
                        <span className="text-sm">kcal</span>
                    </div>
                    <div className="flex gap-2 ml-4">
                        <button onClick={() => onSave(exercise.id)} className="text-emerald-500 hover:text-emerald-700 text-sm font-semibold">Save</button>
                        <button onClick={onCancel} className="text-slate-500 hover:text-slate-700 text-sm">Cancel</button>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex-1">
                        <span className="capitalize">{exercise.name}</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{exercise.duration} min</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{exercise.caloriesBurned} kcal</span>
                        <button onClick={() => onEdit(exercise)} className="text-slate-400 hover:text-sky-500" aria-label={`Edit ${exercise.name}`}>
                            <EditIcon />
                        </button>
                        <button onClick={() => onDelete(exercise.id)} className="text-slate-400 hover:text-red-500" aria-label={`Delete ${exercise.name}`}>
                            <TrashIcon />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// --- FACTORY PATTERN: Creator ---

const LogItemFactory: React.FC<{ type: 'food' | 'exercise' } & LogItemProps> = (props) => {
    switch (props.type) {
        case 'food':
            return <FoodLogItem {...props} />;
        case 'exercise':
            return <ExerciseLogItem {...props} />;
        default:
            return null;
    }
};

// --- Main Component ---

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

    const handleCancel = () => setEditingItem(null);

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

    const commonProps = {
        isEditing: false, // overridden below
        editData: editingItem,
        onEdit: handleEdit,
        onCancel: handleCancel,
        onChange: handleCaloriesChange,
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FoodIcon /> Today's Food Log</h2>
            
            {/* Group foods by meal type */}
            {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as MealType[]).map(mealType => {
                const mealFoods = foods.filter(food => food.mealType === mealType);
                if (mealFoods.length === 0) return null;
                
                return (
                    <div key={mealType} className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-300">
                            {mealType}
                        </h3>
                        <div className="space-y-2">
                            {mealFoods.map((item, index) => (
                                <LogItemFactory
                                    key={`food-${item.name || 'unknown'}-${mealType}-${index}`}
                                    type="food"
                                    item={item}
                                    {...commonProps}
                                    isEditing={editingItem?.id === item.id}
                                    onDelete={onDeleteFood}
                                    onSave={handleSaveFood}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
            
            {foods.length === 0 && (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">No foods logged today</p>
            )}

            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FireIcon /> Today's Exercise</h3>
            <div className="space-y-2">
                {exercises.map((exercise, index) => (
                    <LogItemFactory
                        key={`exercise-${exercise.name || 'unknown'}-${index}`}
                        type="exercise"
                        item={exercise}
                        {...commonProps}
                        isEditing={editingItem?.id === exercise.id}
                        onDelete={onDeleteExercise}
                        onSave={handleSaveExercise}
                    />
                ))}
                {exercises.length === 0 && (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">No exercises logged today</p>
                )}
            </div>
        </div>
    );
};

export default LogList;