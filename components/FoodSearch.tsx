import React, { useState } from 'react';
import { MealType, FoodLog } from '../types';
import { api } from '../services/api';
import { SearchIcon } from './icons/SearchIcon';
import { Spinner } from './icons/Spinner';
import { PlusIcon } from './icons/PlusIcon';
import { checkApiCooldown, recordApiCall } from '../utils/throttle';

interface FoodSearchProps {
    onAddFood: (foods: Omit<FoodLog, 'id' | 'timestamp'>[]) => void;
}

type SearchResult = Omit<FoodLog, 'id' | 'timestamp' | 'mealType'>;

export const FoodSearch: React.FC<FoodSearchProps> = ({ onAddFood }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedMeal, setSelectedMeal] = useState<MealType>(MealType.Breakfast);
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
            recordApiCall(); // Record the call
            const searchResults = await api.searchFoods(query);
            setResults(searchResults as SearchResult[]);
        } catch (err: any) {
            console.error("Food search failed:", err);
            setError("Sorry, the search failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddFood = (food: SearchResult) => {
        const foodWithMealType = { ...food, mealType: selectedMeal };
        onAddFood([foodWithMealType]);
        
        // Use food name as a temporary unique identifier for disabling the button
        setAddedIds(prev => new Set(prev).add(food.name)); 
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
                {Object.values(MealType).map(meal => (
                    <button
                        key={meal}
                        type="button"
                        onClick={() => setSelectedMeal(meal)}
                        className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${selectedMeal === meal
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-slate-600'
                            }`}
                    >
                        {meal}
                    </button>
                ))}
            </div>
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="e.g., 'grilled chicken breast'"
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
                {results.map((food, index) => {
                     const sodium = food.nutrients.micros?.find(m => m.name === 'Sodium')?.amount;
                     const sugar = food.nutrients.micros?.find(m => m.name === 'Sugar')?.amount;
                     const fiber = food.nutrients.micros?.find(m => m.name === 'Fiber')?.amount;

                    return (
                    <div key={index} className="flex items-center justify-between bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg">
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{food.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {food.calories} kcal &bull; P:{food.nutrients.macros.find(m=>m.name==='Protein')?.amount}g, C:{food.nutrients.macros.find(m=>m.name==='Carbs')?.amount}g, F:{food.nutrients.macros.find(m=>m.name==='Fat')?.amount}g
                            </p>
                             <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex gap-3 flex-wrap">
                                {sodium !== undefined && <span>Sodium: {sodium}mg</span>}
                                {sugar !== undefined && <span>Sugar: {sugar}g</span>}
                                {fiber !== undefined && <span>Fiber: {fiber}g</span>}
                            </div>
                        </div>
                        <button
                            onClick={() => handleAddFood(food)}
                            className="flex items-center gap-1 text-sm bg-emerald-100 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300 font-semibold px-3 py-1.5 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-700 transition-colors disabled:bg-slate-200 dark:disabled:bg-slate-600 disabled:text-slate-500 disabled:cursor-not-allowed"
                            disabled={addedIds.has(food.name)}
                        >
                           <PlusIcon />
                           {addedIds.has(food.name) ? 'Added' : 'Add'}
                        </button>
                    </div>
                )})}
            </div>
             {!isLoading && results.length === 0 && query && (
                <p className="text-center text-slate-500 dark:text-slate-400 py-4">No results found for "{query}".</p>
            )}
        </div>
    );
};
