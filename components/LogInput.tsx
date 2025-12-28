import React, { useState, useRef, useMemo } from 'react';
import { MealType, FoodLog, ExerciseLog, NutrientInfo } from '../types';
import { analyzeFoodInput, analyzeExerciseInput } from '../services/geminiService';
import { FoodSearch } from './FoodSearch';
import { fileToBase64 } from '../utils/fileUtils';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { checkApiCooldown, recordApiCall } from '../utils/throttle';
import { Spinner } from './icons/Spinner';
import { CameraIcon } from './icons/CameraIcon';
import { MicIcon } from './icons/MicIcon';
import { useData } from '../contexts/DataContext';
import Toast from './Toast';
import { ExerciseSearch } from './ExerciseSearch';
import { AnalysisResults } from './AnalysisResults';
import { LogStrategy } from '../strategies/LogStrategy';
import { FoodLogStrategy } from '../strategies/FoodLogStrategy';
import { ExerciseLogStrategy } from '../strategies/ExerciseLogStrategy';

// Redefine internal types for state management
type FoodAnalysisResult = Omit<FoodLog, 'id' | 'timestamp'> & {
    nutrientsPerUnit: {
        calories: number;
        macros: NutrientInfo[];
        micros: NutrientInfo[];
    }
};
type ExerciseAnalysisResult = Omit<ExerciseLog, 'id' | 'timestamp'>;
type AnalysisResultItem = FoodAnalysisResult | ExerciseAnalysisResult;

type ActiveTab = 'text' | 'image' | 'voice' | 'search';
type LogMode = 'food' | 'exercise';

const LogInput: React.FC = () => {
    const { addFood, addExercise } = useData();
    const [activeTab, setActiveTab] = useState<ActiveTab>('text');
    const [logMode, setLogMode] = useState<LogMode>('food');
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [analysisResults, setAnalysisResults] = useState<AnalysisResultItem[] | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [selectedMeal, setSelectedMeal] = useState<MealType>(MealType.Breakfast);
    const [isLogging, setIsLogging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- STRATEGY PATTERN: Instantiate strategies ---
    const foodStrategy = useMemo(() => new FoodLogStrategy(), []);
    const exerciseStrategy = useMemo(() => new ExerciseLogStrategy(), []);

    const resetAll = () => {
        setQuery('');
        setIsLoading(false);
        setError(null);
        setAnalysisResults(null);
        setSelectedItems(new Set());
        setSelectedMeal(MealType.Breakfast);
        setIsLogging(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const onResult = (transcript: string) => {
        setQuery(transcript);
        handleSubmit(transcript);
    };
    const { isListening, error: speechError, toggleListening } = useSpeechRecognition(onResult);

    const toggleItemSelection = (index: number) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedItems(newSelected);
    };

    const performAnalysis = async (prompt: string, image?: {inlineData: {data:string, mimeType: string}}) => {
        if (!prompt && !image) return;

        const endpoint = logMode === 'food' ? 'analyzeFood' : 'analyzeExercise';
        const cooldownCheck = checkApiCooldown(endpoint);
        if (!cooldownCheck.canCall) {
            setError(cooldownCheck.message);
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResults(null);
        setSelectedItems(new Set());
        recordApiCall(endpoint);

        try {
            // --- STRATEGY PATTERN: Select and use the strategy ---
            let strategy: LogStrategy<any>;
            let options: any;

            if (logMode === 'food') {
                strategy = foodStrategy;
                options = { mealType: selectedMeal, image };
            } else {
                strategy = exerciseStrategy;
                options = { image };
            }

            const results = await strategy.analyze(prompt, options);

            if (logMode === 'food') {
                const stateItems: FoodAnalysisResult[] = results.map((item: any) => {
                    const quantity = item.servingQuantity || 1;
                    const safeQuantity = quantity > 0 ? quantity : 1;
                    const nutrientsPerUnit = {
                        calories: item.calories / safeQuantity,
                        macros: (item.nutrients?.macros || []).map((m: NutrientInfo) => ({ ...m, amount: m.amount / safeQuantity })),
                        micros: (item.nutrients?.micros || []).map((m: NutrientInfo) => ({ ...m, amount: m.amount / safeQuantity })),
                    };
                    return { ...item, nutrientsPerUnit };
                });
                setAnalysisResults(stateItems);
                // Don't auto-select items - let user choose what to log
                setSelectedItems(new Set());
            } else {
                 setAnalysisResults(results);
                 // Don't auto-select items - let user choose what to log
                 setSelectedItems(new Set());
            }
            // --- End of Strategy Pattern usage ---

            setQuery('');
        } catch (err: any) {
             console.error("Analysis failed:", err);
            let errorMessage = "Sorry, an unknown analysis error occurred. Please try again.";

            if (err instanceof Error) {
                const msg = err.message.toLowerCase();
                if (msg.includes('api key') || msg.includes('permission denied') || msg.includes('403') || msg.includes('400')) {
                    errorMessage = "AI analysis failed. There might be an issue with the server configuration.";
                } else if (msg.includes('429') || msg.includes('resource_exhausted')) {
                    errorMessage = "API rate limit exceeded. Please wait a moment before trying again.";
                } else {
                    errorMessage = `Analysis failed: ${err.message}`;
                }
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (text: string) => {
        performAnalysis(text);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const base64Data = await fileToBase64(file);
        const image = { inlineData: { data: base64Data, mimeType: file.type } };
        const prompt = logMode === 'food'
            ? "Analyze the food in this image."
            : "What exercise is this? Estimate duration and calories burned.";
        
        performAnalysis(prompt, image);
    };
    
    const handleLogResults = () => {
        if (!analysisResults || analysisResults.length === 0 || isLogging) return;
        
        setIsLogging(true);

        if (logMode === 'food') {
            const foodItems = analysisResults as FoodAnalysisResult[];
            const selectedFoodItems = foodItems.filter((_, index) => selectedItems.has(index));
            const foodItemsToLog = selectedFoodItems.map(({ nutrientsPerUnit, ...rest }) => ({
                ...rest,
                mealType: selectedMeal
            }));
            
            if (foodItemsToLog.length === 0) {
                setToastMessage('Please select at least one item to log');
                setIsLogging(false);
                return;
            }
            
            addFood(foodItemsToLog);
            const message = foodItemsToLog.length > 1
                ? `${foodItemsToLog.length} food items logged successfully!`
                : 'Food logged successfully!';
            setToastMessage(message);
        } else {
            const exerciseItem = analysisResults[0] as Omit<ExerciseLog, 'id' | 'timestamp'>;
            addExercise(exerciseItem);
            setToastMessage('Exercise added!');
        }
        
        setTimeout(() => {
            resetAll();
            setIsLogging(false);
        }, 1000);
    };

    const handleUpdateResult = (index: number, updatedData: { name?: string, servingQuantity?: number, calories?: number }) => {
        if (!analysisResults) return;
        
        const newResults = [...analysisResults];
        const item = newResults[index];
        
        if ('servingQuantity' in updatedData && 'servingUnit' in item) {
            item.servingQuantity = Math.max(0, updatedData.servingQuantity || 0);
            const quantity = item.servingQuantity;
            item.calories = item.nutrientsPerUnit.calories * quantity;
            item.nutrients.macros = item.nutrientsPerUnit.macros.map(m => ({ ...m, amount: m.amount * quantity }));
            item.nutrients.micros = item.nutrientsPerUnit.micros.map(m => ({ ...m, amount: m.amount * quantity }));
        } else if ('calories' in updatedData && 'caloriesBurned' in item) {
            item.caloriesBurned = updatedData.calories || 0;
        }
        
        setAnalysisResults(newResults);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Log Your Day</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setLogMode('food')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            logMode === 'food' 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                    >
                        Food
                    </button>
                    <button
                        onClick={() => setLogMode('exercise')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            logMode === 'exercise' 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                    >
                        Exercise
                    </button>
                </div>
            </div>

            {logMode === 'food' && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Meal Type</label>
                    <select
                        value={selectedMeal}
                        onChange={(e) => setSelectedMeal(e.target.value as MealType)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                        <option value={MealType.Breakfast}>Breakfast</option>
                        <option value={MealType.Lunch}>Lunch</option>
                        <option value={MealType.Dinner}>Dinner</option>
                        <option value={MealType.Snacks}>Snacks</option>
                    </select>
                </div>
            )}

            <div className="mb-4">
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setActiveTab('text')}
                        className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                            activeTab === 'text' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                    >
                        Text
                    </button>
                    <button
                        onClick={() => setActiveTab('image')}
                        className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                            activeTab === 'image' 
                                ? 'bg-purple-500 text-white' 
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                    >
                        Image
                    </button>
                    <button
                        onClick={() => setActiveTab('voice')}
                        className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                            activeTab === 'voice' 
                                ? 'bg-green-500 text-white' 
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                    >
                        Voice
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                            activeTab === 'search' 
                                ? 'bg-indigo-500 text-white' 
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                    >
                        Search
                    </button>
                </div>

                {activeTab === 'text' && (
                    <div className="space-y-4">
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={`Describe your ${logMode === 'food' ? 'meal' : 'exercise'}...`}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                            rows={3}
                        />
                        <button
                            onClick={() => handleSubmit(query)}
                            disabled={!query.trim() || isLoading}
                            className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? <Spinner /> : `Analyze ${logMode === 'food' ? 'Food' : 'Exercise'}`}
                        </button>
                    </div>
                )}

                {activeTab === 'image' && (
                    <div className="space-y-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            className="w-full py-8 px-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                        >
                            <CameraIcon />
                            <span className="block mt-2">Click to upload image</span>
                        </button>
                    </div>
                )}

                {activeTab === 'voice' && (
                    <div className="space-y-4">
                        <button
                            onClick={toggleListening}
                            disabled={isLoading}
                            className={`w-full py-8 px-4 rounded-lg font-medium transition-colors ${
                                isListening 
                                    ? 'bg-red-500 text-white hover:bg-red-600' 
                                    : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                        >
                            <MicIcon />
                            <span className="block mt-2">
                                {isListening ? 'Stop Recording' : 'Start Recording'}
                            </span>
                        </button>
                        {query && (
                            <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <p className="text-sm text-slate-600 dark:text-slate-400">You said:</p>
                                <p className="text-slate-900 dark:text-white">{query}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'search' && (
                    <div>
                        {logMode === 'food' ? (
                            <FoodSearch onAddFood={(foods) => addFood(foods)} />
                        ) : (
                            <ExerciseSearch onAddExercise={(ex) => addExercise(ex)} />
                        )}
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-700 dark:text-red-400">{error}</p>
                </div>
            )}

            {analysisResults && (
                <div className="mt-6">
                    <AnalysisResults
                        results={analysisResults}
                        logMode={logMode}
                        onLog={handleLogResults}
                        onClear={resetAll}
                        onUpdate={handleUpdateResult}
                        onRemove={(index) => {
                            if (analysisResults.length > 1) {
                                const newResults = analysisResults.filter((_, i) => i !== index);
                                setAnalysisResults(newResults);
                                // Update selected items indices
                                const newSelected = new Set<number>();
                                selectedItems.forEach(itemIndex => {
                                    if (itemIndex < index) {
                                        newSelected.add(itemIndex);
                                    } else if (itemIndex > index) {
                                        newSelected.add(itemIndex - 1);
                                    }
                                });
                                setSelectedItems(newSelected);
                            } else {
                                resetAll();
                            }
                        }}
                        selectedItems={selectedItems}
                        onToggleSelection={toggleItemSelection}
                    />
                </div>
            )}

            {toastMessage && (
                <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
            )}
        </div>
    );
};

export default LogInput;
