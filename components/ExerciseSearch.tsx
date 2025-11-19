import React, { useState } from 'react';
import { ExerciseLog } from '../types';
import { api } from '../services/api';
import { SearchIcon } from './icons/SearchIcon';
import { Spinner } from './icons/Spinner';
import { PlusIcon } from './icons/PlusIcon';
import { checkApiCooldown, recordApiCall } from '../utils/throttle';

interface ExerciseSearchProps {
    onAddExercise: (exercise: Omit<ExerciseLog, 'id' | 'timestamp'>) => void;
}

type SearchResult = Omit<ExerciseLog, 'id' | 'timestamp'>;

export const ExerciseSearch: React.FC<ExerciseSearchProps> = ({ onAddExercise }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) return;

        const cooldownCheck = checkApiCooldown();
        if (!cooldownCheck.canCall) {
            setError(cooldownCheck.message);
            return;
        }

        setIsLoading(true);
        setError(null);
        setResults([]);
        setAddedIds(new Set());
        try {
            recordApiCall();
            const searchResults = await api.searchExercises(query);
            setResults(searchResults);
        } catch (err: any) {
            console.error("Exercise search failed:", err);
            setError("Sorry, the search failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddExercise = (exercise: SearchResult) => {
        onAddExercise(exercise);
        setAddedIds(prev => new Set(prev).add(exercise.name)); 
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="e.g., 'running'"
                    className="w-full pl-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="flex items-center justify-center px-4 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-slate-400"
                    disabled={isLoading || !query}
                    aria-label="Search"
                >
                    {isLoading ? <Spinner /> : <SearchIcon />}
                </button>
            </form>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {results.length > 0 && (
                     <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300">Search Results</h3>
                )}
                {results.map((ex, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg">
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{ex.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                ~{ex.caloriesBurned} kcal per 30 minutes
                            </p>
                        </div>
                        <button
                            onClick={() => handleAddExercise(ex)}
                            className="flex items-center gap-1 text-sm bg-emerald-100 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300 font-semibold px-3 py-1.5 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-700 transition-colors disabled:bg-slate-200 dark:disabled:bg-slate-600 disabled:text-slate-500 disabled:cursor-not-allowed"
                            disabled={addedIds.has(ex.name)}
                        >
                           <PlusIcon />
                           {addedIds.has(ex.name) ? 'Added' : 'Add'}
                        </button>
                    </div>
                ))}
            </div>
             {!isLoading && results.length === 0 && query && (
                <p className="text-center text-slate-500 dark:text-slate-400 py-4">No results found for "{query}".</p>
            )}
        </div>
    );
};
