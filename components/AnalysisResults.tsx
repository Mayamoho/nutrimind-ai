import React from 'react';
import { FoodLog, ExerciseLog, NutrientInfo } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { UndoIcon } from './icons/UndoIcon';
import { CheckIcon } from './icons/CheckIcon';

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
    onUpdate: (index: number, updatedData: { servingQuantity: number } | { calories: number }) => void;
    onRemove: (index: number) => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results, logMode, onLog, onClear, onUpdate, onRemove }) => {
    return (
        <div className="flex flex-col h-full">
            <div className="text-center mb-4">
                <h3 className="text-xl font-bold">Analysis Results</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Review and adjust items before logging.</p>
            </div>
            <div className="flex-grow space-y-3 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                {results.map((item, index) => {
                    // Food Item View
                    if (logMode === 'food' && 'servingUnit' in item) {
                        return (
                            <div key={index} className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-semibold capitalize text-slate-800 dark:text-slate-200 flex-1 pr-2">{item.name}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{Math.round(item.calories)} kcal</span>
                                        <button onClick={() => onRemove(index)} className="p-1 text-slate-400 hover:text-red-500" aria-label={`Remove ${item.name}`}>
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm mb-2">
                                    <label htmlFor={`quantity-${index}`} className="font-medium text-slate-600 dark:text-slate-300">Serving:</label>
                                    <input
                                        id={`quantity-${index}`}
                                        type="number"
                                        step="0.25"
                                        min="0"
                                        value={item.servingQuantity}
                                        onChange={(e) => onUpdate(index, { servingQuantity: parseFloat(e.target.value) || 0 })}
                                        className="bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white rounded px-2 py-1 w-20 text-center font-semibold"
                                        aria-label="Edit serving quantity"
                                    />
                                    <span className="text-slate-500 dark:text-slate-400">{item.servingUnit}</span>
                                </div>
                                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-200 dark:border-slate-600 pt-2">
                                    <div className="flex justify-end gap-3">
                                        <span><span className="font-medium text-sky-500">P:</span> {Math.round(item.nutrients.macros?.find(m => m.name === 'Protein')?.amount || 0)}g</span>
                                        <span><span className="font-medium text-orange-500">C:</span> {Math.round(item.nutrients.macros?.find(m => m.name === 'Carbs')?.amount || 0)}g</span>
                                        <span><span className="font-medium text-violet-500">F:</span> {Math.round(item.nutrients.macros?.find(m => m.name === 'Fat')?.amount || 0)}g</span>
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <span>Na: {Math.round(item.nutrients.micros?.find(m => m.name === 'Sodium')?.amount || 0)}mg</span>
                                        <span>Sug: {Math.round(item.nutrients.micros?.find(m => m.name === 'Sugar')?.amount || 0)}g</span>
                                        <span>Fib: {Math.round(item.nutrients.micros?.find(m => m.name === 'Fiber')?.amount || 0)}g</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    // Exercise Item View
                    if (logMode === 'exercise' && 'caloriesBurned' in item) {
                         return (
                            <div key={index} className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-semibold capitalize text-slate-800 dark:text-slate-200 flex-1 pr-2">{item.name}</p>
                                    <button onClick={() => onRemove(index)} className="p-1 text-slate-400 hover:text-red-500" aria-label={`Remove ${item.name}`}>
                                        <TrashIcon />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <label htmlFor={`calories-${index}`} className="font-medium text-slate-600 dark:text-slate-300">Calories:</label>
                                        <input
                                            id={`calories-${index}`}
                                            type="number"
                                            value={Math.round(item.caloriesBurned)}
                                            onChange={(e) => onUpdate(index, { calories: parseInt(e.target.value) || 0 })}
                                            className="bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white rounded px-2 py-1 w-20 text-right font-semibold"
                                            aria-label="Edit item calories"
                                        />
                                        <span className="text-slate-500 dark:text-slate-400">kcal</span>
                                    </div>
                                    <span className="text-slate-500 dark:text-slate-400">{item.duration} min</span>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
            <div className="flex gap-4 mt-auto pt-4">
                <button 
                    onClick={onClear} 
                    className="w-full flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                >
                    <UndoIcon /> Start Over
                </button>
                <button 
                    onClick={onLog}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors"
                >
                    <CheckIcon /> Log {results.length} Item(s)
                </button>
            </div>
        </div>
    );
};