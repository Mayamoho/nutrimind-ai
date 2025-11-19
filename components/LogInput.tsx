import React, { useState, useRef } from 'react';
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

// FIX: Defined ActiveTab and LogMode types.
type ActiveTab = 'text' | 'image' | 'voice' | 'search';
type LogMode = 'food' | 'exercise';

const LogInput: React.FC = () => {
    const { addFood, addExercise } = useData();
    const [activeTab, setActiveTab] = useState<ActiveTab>('text');
    const [logMode, setLogMode] = useState<LogMode>('food');
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedMeal, setSelectedMeal] = useState<MealType>(MealType.Breakfast);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [analysisResults, setAnalysisResults] = useState<AnalysisResultItem[] | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetAll = () => {
        setQuery('');
        setIsLoading(false);
        setError(null);
        setAnalysisResults(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const onResult = (transcript: string) => {
        setQuery(transcript);
        handleSubmit(transcript);
    };
    const { isListening, error: speechError, toggleListening } = useSpeechRecognition(onResult);

    const performAnalysis = async (prompt: string, image?: {inlineData: {data:string, mimeType: string}}) => {
        if (!prompt && !image) return;

        const cooldownCheck = checkApiCooldown();
        if (!cooldownCheck.canCall) {
            setError(cooldownCheck.message);
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResults(null);
        recordApiCall();

        try {
            if (logMode === 'food') {
                const results = await analyzeFoodInput(prompt, selectedMeal, image);
                const stateItems: FoodAnalysisResult[] = results.map(item => {
                    const quantity = item.servingQuantity || 1;
                    const safeQuantity = quantity > 0 ? quantity : 1; // Avoid division by zero
                    const nutrientsPerUnit = {
                        calories: item.calories / safeQuantity,
                        macros: item.nutrients.macros.map(m => ({ ...m, amount: m.amount / safeQuantity })),
                        micros: item.nutrients.micros.map(m => ({ ...m, amount: m.amount / safeQuantity })),
                    };
                    return { ...item, nutrientsPerUnit };
                });
                setAnalysisResults(stateItems);
            } else {
                const result = await analyzeExerciseInput(prompt, image);
                setAnalysisResults([result]);
            }
            setQuery(''); // Clear text field after successful analysis
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
            ? `Analyze the food in this image for ${selectedMeal}.`
            : "What exercise is this? Estimate duration and calories burned.";
        
        performAnalysis(prompt, image);
    };
    
    const handleLogResults = () => {
        if (!analysisResults || analysisResults.length === 0) return;

        if (logMode === 'food') {
            const foodItems = analysisResults as FoodAnalysisResult[];
            // Strip the temporary 'nutrientsPerUnit' property before logging
            const foodItemsToLog = foodItems.map(({ nutrientsPerUnit, ...rest }) => rest);
            addFood(foodItemsToLog);
            const message = foodItems.length > 1
                ? `${foodItems.length} food items logged successfully!`
                : 'Food logged successfully!';
            setToastMessage(message);
        } else {
            const exerciseItem = analysisResults[0] as Omit<ExerciseLog, 'id' | 'timestamp'>;
            addExercise(exerciseItem);
            setToastMessage('Exercise added!');
        }
        resetAll();
    };

    const handleUpdateResult = (index: number, updatedData: { servingQuantity: number } | { calories: number }) => {
        if (!analysisResults) return;
        
        const newResults = [...analysisResults];
        const item = newResults[index];
        
        // Type guard for food item update
        if ('servingQuantity' in updatedData && 'servingUnit' in item) {
            item.servingQuantity = Math.max(0, updatedData.servingQuantity);
            const quantity = item.servingQuantity;
            
            // Recalculate total nutrients based on the new quantity
            item.calories = item.nutrientsPerUnit.calories * quantity;
            item.nutrients.macros = item.nutrientsPerUnit.macros.map(m => ({ ...m, amount: m.amount * quantity }));
            item.nutrients.micros = item.nutrientsPerUnit.micros.map(m => ({ ...m, amount: m.amount * quantity }));
        
        // Type guard for exercise item update
        } else if ('calories' in updatedData && 'caloriesBurned' in item) {
            item.caloriesBurned = updatedData.calories;
        }
        
        setAnalysisResults(newResults);
    };

    const handleRemoveResult = (index: number) => {
        if (!analysisResults) return;
        const newResults = analysisResults.filter((_, i) => i !== index);
        if (newResults.length === 0) {
            resetAll();
        } else {
            setAnalysisResults(newResults);
        }
    };

    const tabClasses = (tabName: ActiveTab) =>
        `px-4 py-2 font-semibold rounded-t-lg transition-colors duration-200 w-1/4 text-center ${activeTab === tabName
            ? 'bg-white dark:bg-slate-800 text-emerald-500'
            : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`;

    return (
        <div className="bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-lg relative min-h-[350px]">
             {isLoading && (
                <div className="absolute inset-0 bg-white/70 dark:bg-slate-800/70 flex flex-col justify-center items-center z-10 rounded-2xl">
                    <Spinner />
                    <p className="mt-2 font-semibold text-slate-600 dark:text-slate-300">Analyzing...</p>
                </div>
            )}
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button className={tabClasses('text')} onClick={() => setActiveTab('text')}>Text</button>
                <button className={tabClasses('image')} onClick={() => setActiveTab('image')}>Image</button>
                <button className={tabClasses('voice')} onClick={() => setActiveTab('voice')}>Voice</button>
                <button className={tabClasses('search')} onClick={() => setActiveTab('search')}>Search</button>
            </div>

            <div className="p-4">
                {analysisResults ? (
                     <AnalysisResults
                        results={analysisResults}
                        logMode={logMode}
                        onLog={handleLogResults}
                        onClear={resetAll}
                        onUpdate={handleUpdateResult}
                        onRemove={handleRemoveResult}
                    />
                ) : (
                    <>
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <span className="font-semibold">I want to log:</span>
                            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
                                <button onClick={() => setLogMode('food')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${logMode === 'food' ? 'bg-emerald-500 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Food</button>
                                <button onClick={() => setLogMode('exercise')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${logMode === 'exercise' ? 'bg-emerald-500 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Exercise</button>
                            </div>
                        </div>

                        {logMode === 'food' && (activeTab === 'text' || activeTab === 'image' || activeTab === 'voice') && (
                            <div className="flex flex-wrap gap-2 mb-4 justify-center">
                                {Object.values(MealType).map(meal => (
                                    <button key={meal} type="button" onClick={() => setSelectedMeal(meal)}
                                        className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${selectedMeal === meal
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-slate-600'
                                        }`}>
                                        {meal}
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {activeTab === 'text' && (
                            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(query); }} className="space-y-2">
                                <textarea
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder={logMode === 'food' ? "e.g., '1 bowl of oatmeal with berries and nuts'" : "e.g., 'went for a 30 minute run'"}
                                    className="w-full p-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
                                    rows={3}
                                />
                                <button type="submit" className="w-full bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-slate-400" disabled={!query}>
                                    Analyze
                                </button>
                            </form>
                        )}

                        {activeTab === 'image' && (
                            <div className="text-center">
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="w-full flex justify-center items-center gap-2 bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors">
                                    <CameraIcon /> Choose Image
                                </button>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Select a photo of your {logMode} to analyze it.</p>
                            </div>
                        )}
                        
                        {activeTab === 'voice' && (
                            <div className="text-center">
                                <button onClick={toggleListening} className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-colors ${isListening ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                                    <MicIcon />
                                </button>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">{isListening ? "Listening..." : `Tap to describe your ${logMode}.`}</p>
                                {speechError && <p className="text-sm text-red-500 mt-2">{speechError}</p>}
                            </div>
                        )}

                        {activeTab === 'search' && (
                            logMode === 'food' ? (
                                <FoodSearch onAddFood={(foods) => { addFood(foods); setToastMessage('Food logged successfully!'); }} />
                            ) : (
                                <ExerciseSearch onAddExercise={(ex) => { addExercise(ex); setToastMessage('Exercise added!'); }} />
                            )
                        )}
                    </>
                )}

                {error && <p className="text-sm text-red-500 text-center mt-2">{error}</p>}
            </div>
        </div>
    );
};

export default LogInput;
