import React from 'react';
import { Spinner } from './icons/Spinner';
import { AISuggestions } from '../types';
import { FoodIcon } from './icons/FoodIcon';
import { DumbbellIcon } from './icons/DumbbellIcon';
import { WarningIcon } from './icons/WarningIcon';

interface SuggestionCardProps {
    suggestion: AISuggestions;
    isLoading: boolean;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, isLoading }) => {
    
    const hasSuggestions = suggestion && (
        suggestion.positiveFood?.length > 0 ||
        suggestion.positiveExercise?.length > 0 ||
        suggestion.cautionFood?.length > 0
    );

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
             <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                AI Coach
            </h3>
            {isLoading ? (
                 <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-1">
                    <Spinner />
                    <span>Generating personalized tips...</span>
                </div>
            ) : (
                hasSuggestions ? (
                <div className="space-y-6">
                    {/* Positive Food Suggestions */}
                    {suggestion.positiveFood?.length > 0 && (
                        <div>
                            <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2"><FoodIcon /> Food Ideas</h4>
                            <ul className="space-y-2">
                                {suggestion.positiveFood.map((item, index) => (
                                    <li key={`food-${index}`} className="text-sm text-slate-600 dark:text-slate-400 pl-4 border-l-2 border-sky-500">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                     
                     {/* Positive Exercise Suggestions */}
                     {suggestion.positiveExercise?.length > 0 && (
                        <div>
                            <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2"><DumbbellIcon /> Exercise Tips</h4>
                             <ul className="space-y-2">
                                {suggestion.positiveExercise.map((item, index) => (
                                    <li key={`ex-${index}`} className="text-sm text-slate-600 dark:text-slate-400 pl-4 border-l-2 border-orange-500">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Cautionary Food Suggestions */}
                     {suggestion.cautionFood?.length > 0 && (
                        <div>
                            <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2"><WarningIcon /> Things to Consider</h4>
                             <ul className="space-y-2">
                                {suggestion.cautionFood.map((item, index) => (
                                    <li key={`caution-${index}`} className="text-sm text-slate-600 dark:text-slate-400 pl-4 border-l-2 border-yellow-500">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-center py-4">Log a meal or exercise to get your first set of tips!</p>
                )
            )}
        </div>
    );
};

export default SuggestionCard;