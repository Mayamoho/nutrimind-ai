
import React, { useState } from 'react';
import { FoodLog, ExerciseLog, NutrientInfo } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { UndoIcon } from './icons/UndoIcon';
import { CheckIcon } from './icons/CheckIcon';
import { EditIcon } from './icons/EditIcon';

// Define the shape of analysis items for internal use in this component and LogInput
type FoodAnalysisResult = Omit<FoodLog, 'id' | 'timestamp'> & {
    nutrientsPerUnit: {
        calories: number;
        macros: NutrientInfo[];
        micros: NutrientInfo[];
    }
};
type ExerciseAnalysisResult = Omit<ExerciseLog, 'id' | 'timestamp'>;
type AnalysisResultItem = FoodAnalysisResult | ExerciseAnalysisResult;

interface AnalysisResultsProps {
    results: AnalysisResultItem[];
    logMode: 'food' | 'exercise';
    onLog: () => void;
    onClear: () => void;
    onUpdate: (index: number, updatedData: { name?: string; servingQuantity?: number; calories?: number }) => void;
    onRemove: (index: number) => void;
    selectedItems?: Set<number>;
    onToggleSelection?: (index: number) => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results, logMode, onLog, onClear, onUpdate, onRemove, selectedItems = new Set(), onToggleSelection }) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editingCaloriesIndex, setEditingCaloriesIndex] = useState<number | null>(null);
    const [editCalories, setEditCalories] = useState('');

    const startEditing = (index: number, currentName: string) => {
        setEditingIndex(index);
        setEditName(currentName);
        setEditingCaloriesIndex(null);
    };

    const saveEditing = (index: number) => {
        if (editName.trim()) {
            onUpdate(index, { name: editName.trim() });
        }
        setEditingIndex(null);
    };

    const startEditingCalories = (index: number, currentCalories: number) => {
        setEditingCaloriesIndex(index);
        setEditCalories(String(Math.round(currentCalories)));
        setEditingIndex(null);
    };

    const saveEditingCalories = (index: number) => {
        const cal = parseInt(editCalories);
        if (!isNaN(cal) && cal >= 0) {
            onUpdate(index, { calories: cal });
        }
        setEditingCaloriesIndex(null);
    };

    // Calculate totals for summary
    const totalCalories = results.reduce((sum, item) => {
        if ('calories' in item) return sum + (item.calories || 0);
        if ('caloriesBurned' in item) return sum + (item.caloriesBurned || 0);
        return sum;
    }, 0);

    return (
        <div className="flex flex-col h-full">
            {/* Header with Summary */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 -mx-6 -mt-6 px-6 py-4 mb-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white">Analysis Results</h3>
                        <p className="text-sm text-emerald-100">Review and adjust before logging</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                        <p className="text-xs text-emerald-100 font-medium">Total</p>
                        <p className="text-2xl font-bold text-white">{Math.round(totalCalories)}</p>
                        <p className="text-xs text-emerald-100">kcal</p>
                    </div>
                </div>
            </div>

            {/* Items List */}
            <div className="flex-grow space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {results.map((item, index) => {
                    // Generate stable keys using item name and index
                    const itemKey = `${logMode}-${item.name}-${index}`;
                    
                    // Food Item View
                    if (logMode === 'food' && 'servingUnit' in item) {
                        const protein = item.nutrients.macros?.find(m => m.name === 'Protein')?.amount || 0;
                        const carbs = item.nutrients.macros?.find(m => m.name === 'Carbs')?.amount || 0;
                        const fat = item.nutrients.macros?.find(m => m.name === 'Fat')?.amount || 0;
                        
                        return (
                            <div key={itemKey} className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/70 dark:to-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
                                {/* Item Header */}
                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 px-4 py-3 border-b border-slate-200 dark:border-slate-600">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3 flex-1">
                                            {/* Selection Checkbox */}
                                            {onToggleSelection && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.has(index)}
                                                    onChange={() => onToggleSelection(index)}
                                                    className="w-4 h-4 text-emerald-600 bg-white dark:bg-slate-600 border-2 border-emerald-400 rounded focus:ring-emerald-500 focus:ring-2"
                                                />
                                            )}
                                            <div className="flex-1 pr-2">
                                            {editingIndex === index ? (
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={editName} 
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="flex-1 px-3 py-1.5 text-sm border-2 border-emerald-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-emerald-500 dark:text-white"
                                                        autoFocus
                                                        onKeyDown={(e) => e.key === 'Enter' && saveEditing(index)}
                                                    />
                                                    <button onClick={() => saveEditing(index)} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                                                        <CheckIcon /> 
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 group">
                                                    <span className="text-lg">🍽️</span>
                                                    <p className="font-semibold capitalize text-slate-800 dark:text-slate-200">{item.name}</p>
                                                    <button 
                                                        onClick={() => startEditing(index, item.name)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded"
                                                        aria-label="Edit name"
                                                    >
                                                        <EditIcon />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {/* Calorie Edit */}
                                            {editingCaloriesIndex === index ? (
                                                <div className="flex items-center gap-1">
                                                    <input 
                                                        type="number" 
                                                        value={editCalories} 
                                                        onChange={(e) => setEditCalories(e.target.value)}
                                                        className="w-20 px-2 py-1 text-sm text-right border-2 border-emerald-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-emerald-500 dark:text-white font-semibold"
                                                        autoFocus
                                                        onKeyDown={(e) => e.key === 'Enter' && saveEditingCalories(index)}
                                                    />
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">kcal</span>
                                                    <button onClick={() => saveEditingCalories(index)} className="p-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                                                        <CheckIcon /> 
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => startEditingCalories(index, item.calories)}
                                                    className="flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors group"
                                                    aria-label="Edit calories"
                                                >
                                                    <span className="font-bold">{Math.round(item.calories)}</span>
                                                    <span className="text-xs">kcal</span>
                                                    <EditIcon />
                                                </button>
                                            )}
                                            <button onClick={() => onRemove(index)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" aria-label={`Remove ${item.name}`}>
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Item Body */}
                                <div className="px-4 py-3 space-y-3">
                                    {/* Serving Control */}
                                    <div className="flex items-center gap-3">
                                        <label htmlFor={`quantity-${index}`} className="text-sm font-medium text-slate-600 dark:text-slate-300">Serving:</label>
                                        <div className="flex items-center bg-white dark:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-500 overflow-hidden">
                                            <button 
                                                onClick={() => onUpdate(index, { servingQuantity: Math.max(0.25, (item.servingQuantity || 1) - 0.25) })}
                                                className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors font-bold"
                                            >−</button>
                                            <input
                                                id={`quantity-${index}`}
                                                type="number"
                                                step="0.25"
                                                min="0"
                                                value={item.servingQuantity}
                                                onChange={(e) => onUpdate(index, { servingQuantity: parseFloat(e.target.value) || 0 })}
                                                className="w-16 text-center font-semibold bg-transparent border-x border-slate-200 dark:border-slate-500 py-1.5 text-slate-900 dark:text-white focus:outline-none"
                                                aria-label="Edit serving quantity"
                                            />
                                            <button 
                                                onClick={() => onUpdate(index, { servingQuantity: (item.servingQuantity || 1) + 0.25 })}
                                                className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors font-bold"
                                            >+</button>
                                        </div>
                                        <span className="text-sm text-slate-500 dark:text-slate-400">{item.servingUnit}</span>
                                    </div>

                                    {/* Macros Cards */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-sky-50 dark:bg-sky-900/30 rounded-lg p-2 text-center">
                                            <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">Protein</p>
                                            <p className="text-lg font-bold text-sky-700 dark:text-sky-300">{Math.round(protein)}g</p>
                                        </div>
                                        <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-2 text-center">
                                            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Carbs</p>
                                            <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{Math.round(carbs)}g</p>
                                        </div>
                                        <div className="bg-violet-50 dark:bg-violet-900/30 rounded-lg p-2 text-center">
                                            <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">Fat</p>
                                            <p className="text-lg font-bold text-violet-700 dark:text-violet-300">{Math.round(fat)}g</p>
                                        </div>
                                    </div>

                                    {/* Micros (Collapsible) */}
                                    <details className="group">
                                        <summary className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
                                            <span className="group-open:rotate-90 transition-transform">▶</span>
                                            More nutrients
                                        </summary>
                                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-600 rounded">
                                                Na: {Math.round(item.nutrients.micros?.find(m => m.name === 'Sodium')?.amount || 0)}mg
                                            </span>
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-600 rounded">
                                                Sugar: {Math.round(item.nutrients.micros?.find(m => m.name === 'Sugar')?.amount || 0)}g
                                            </span>
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-600 rounded">
                                                Fiber: {Math.round(item.nutrients.micros?.find(m => m.name === 'Fiber')?.amount || 0)}g
                                            </span>
                                        </div>
                                    </details>
                                </div>
                            </div>
                        );
                    }
                    // Exercise Item View
                    if (logMode === 'exercise' && 'caloriesBurned' in item) {
                        return (
                            <div key={itemKey} className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/70 dark:to-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
                                {/* Item Header */}
                                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 px-4 py-3 border-b border-slate-200 dark:border-slate-600">
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1 pr-2">
                                            {editingIndex === index ? (
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={editName} 
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="flex-1 px-3 py-1.5 text-sm border-2 border-orange-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-slate-700 dark:border-orange-500 dark:text-white"
                                                        autoFocus
                                                        onKeyDown={(e) => e.key === 'Enter' && saveEditing(index)}
                                                    />
                                                    <button onClick={() => saveEditing(index)} className="p-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                                                        <CheckIcon /> 
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 group">
                                                    <span className="text-lg">🏃</span>
                                                    <p className="font-semibold capitalize text-slate-800 dark:text-slate-200">{item.name}</p>
                                                    <button 
                                                        onClick={() => startEditing(index, item.name)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded"
                                                        aria-label="Edit name"
                                                    >
                                                        <EditIcon />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => onRemove(index)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" aria-label={`Remove ${item.name}`}>
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>

                                {/* Item Body */}
                                <div className="px-4 py-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Calories Card */}
                                        <div className="bg-orange-50 dark:bg-orange-900/30 rounded-xl p-3">
                                            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">Calories Burned</p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    id={`calories-${index}`}
                                                    type="number"
                                                    value={Math.round(item.caloriesBurned)}
                                                    onChange={(e) => onUpdate(index, { calories: parseInt(e.target.value) || 0 })}
                                                    className="w-20 bg-white dark:bg-slate-600 text-slate-900 dark:text-white rounded-lg px-2 py-1.5 text-center font-bold text-lg border border-orange-200 dark:border-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                    aria-label="Edit calories burned"
                                                />
                                                <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">kcal</span>
                                            </div>
                                        </div>
                                        {/* Duration Card */}
                                        <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3">
                                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">Duration</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{item.duration}</span>
                                                <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">min</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                <button 
                    onClick={onClear} 
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 px-4 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
                >
                    <UndoIcon /> Start Over
                </button>
                <button 
                    onClick={onLog}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/25"
                >
                    <CheckIcon /> Log {selectedItems.size} Item{selectedItems.size !== 1 ? 's' : ''}
                </button>
            </div>
        </div>
    );
};
