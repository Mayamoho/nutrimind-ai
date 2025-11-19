import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { DailyLog, FoodLog, ExerciseLog, UserGoals, DailyProgress, WeightLog, NeatLog, AISuggestions } from '../types';
import { getAISuggestion } from '../services/geminiService';
import { useAuth } from './AuthContext';
import { createFoodLog, createExerciseLog } from '../factories/logFactory';
import { checkApiCooldown, recordApiCall } from '../utils/throttle';
import { api } from '../services/api';
import Toast from '../components/Toast';

interface DataContextType {
    dailyLogs: DailyLog[];
    userGoals: UserGoals;
    aiSuggestion: AISuggestions;
    isLoadingSuggestion: boolean;
    todayLog: DailyLog;
    dailyProgress: DailyProgress;
    weightLog: WeightLog[];
    updateGoals: (newGoals: UserGoals) => void;
    addFood: (foods: Omit<FoodLog, 'id' | 'timestamp'>[]) => void;
    addExercise: (exercise: Omit<ExerciseLog, 'id' | 'timestamp'>) => void;
    updateFood: (id: string, data: { name: string; calories: number; }) => void;
    deleteFood: (id: string) => void;
    updateExercise: (id: string, data: { name: string; caloriesBurned: number; }) => void;
    deleteExercise: (id: string) => void;
    addNeatActivity: (activity: Omit<NeatLog, 'id'>) => void;
    updateNeatActivity: (id: string, calories: number) => void;
    removeNeatActivity: (id: string) => void;
    addWater: (amount: number) => void;
    isDataLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode, isAuthenticated: boolean }> = ({ children, isAuthenticated }) => {
    const { user, updateUser } = useAuth();
    const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
    const [userGoals, setUserGoals] = useState<UserGoals>({ targetWeight: 0, weightGoal: 'maintain', goalTimeline: 0 });
    const [aiSuggestion, setAiSuggestion] = useState<AISuggestions>({ positiveFood: [], positiveExercise: [], cautionFood: [] });
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState<boolean>(false);
    const [weightLog, setWeightLog] = useState<WeightLog[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    const userEmailForEffect = user?.email; // Use email as a stable dependency

    useEffect(() => {
        const loadData = async () => {
            if (!isAuthenticated || !user) {
                if (!isAuthenticated) setIsDataLoading(false);
                return;
            };
            setIsDataLoading(true);
            try {
                const data = await api.getUserData();

                // Critical validation: If user data is missing, we can't proceed.
                if (!data || !data.user) {
                    throw new Error("Could not retrieve user profile. Please try logging in again.");
                }

                const freshUser = data.user;

                // Update the user in AuthContext to ensure all components have the latest data
                updateUser(freshUser);
                
                setDailyLogs(data.dailyLogs || []);
                setUserGoals(data.userGoals || { targetWeight: freshUser.weight, weightGoal: 'maintain', goalTimeline: 12 });
                
                const currentWeightLog = (data.weightLog && data.weightLog.length > 0)
                    ? data.weightLog
                    : [{ date: todayStr, weight: freshUser.weight }];
                setWeightLog(currentWeightLog);

            } catch (error: any) {
                console.error("Failed to load user data:", error);
                setToastMessage(`Error loading your profile: ${error.message}`);
                // Set safe defaults to prevent a crash
                setDailyLogs([]);
                if (user) {
                    setUserGoals({ targetWeight: user.weight, weightGoal: 'maintain', goalTimeline: 12 });
                    setWeightLog([{ date: todayStr, weight: user.weight }]);
                }
            } finally {
                setIsDataLoading(false);
            }
        }
        
        loadData();

    // userEmailForEffect ensures this runs on user change, but not on user object updates from updateUser
    // updateUser is stable due to useCallback. This prevents infinite loops.
    }, [isAuthenticated, userEmailForEffect, todayStr, updateUser]);


    const todayLog = useMemo(() => {
        return dailyLogs.find(log => log.date === todayStr) || { date: todayStr, foods: [], exercises: [], neatActivities: [], waterIntake: 0 };
    }, [dailyLogs, todayStr]);

    const calculateBMR = useCallback((): number => {
        if (!user) return 1600;
        // BMR is calculated based on current weight, not starting weight.
        const { weight, height, age, gender } = user;
        const bmr = (10 * weight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);
        return Math.round(bmr);
    }, [user]);

    const dailyProgress: DailyProgress = useMemo(() => {
        const bmr = calculateBMR();
        const achieved = todayLog.foods.reduce((sum, food) => sum + food.calories, 0);
        const eat = todayLog.exercises.reduce((sum, ex) => sum + ex.caloriesBurned, 0);
        const neat = todayLog.neatActivities.reduce((sum, activity) => sum + activity.calories, 0);
        const tef = Math.round(achieved * 0.1);
        const totalCaloriesOut = bmr + neat + eat + tef;
        const netCalories = achieved - totalCaloriesOut;

        const calculateMacroTotal = (macroName: 'Protein' | 'Carbs' | 'Fat'): number => {
            return todayLog.foods.reduce((total, food) => {
                const macro = food.nutrients.macros.find(m => m.name === macroName);
                return total + (macro ? macro.amount : 0);
            }, 0);
        };

        const maintenanceTDEE = totalCaloriesOut;
        const proteinTarget = (maintenanceTDEE * 0.30) / 4;
        const carbTarget = (maintenanceTDEE * 0.40) / 4;
        const fatTarget = (maintenanceTDEE * 0.30) / 9;
        const waterTarget = user ? Math.round(user.weight * 35) : 2500; // 35ml per kg of body weight

        let goalCalories = totalCaloriesOut;
        const currentWeight = weightLog.length > 0 ? weightLog[weightLog.length - 1].weight : user?.weight || 0;

        if (user && userGoals.goalTimeline > 0 && currentWeight > 0) {
            const weightDiffKg = userGoals.targetWeight - currentWeight;
            const totalCalorieDiff = weightDiffKg * 7700;
            const daysRemaining = userGoals.goalTimeline * 7 - (dailyLogs.length - 1);
            const dailyAdjustment = daysRemaining > 0 ? totalCalorieDiff / daysRemaining : 0;
            goalCalories = totalCaloriesOut + dailyAdjustment;
        }

        return {
            calories: { achieved, eat }, protein: calculateMacroTotal('Protein'),
            carbs: calculateMacroTotal('Carbs'), fat: calculateMacroTotal('Fat'),
            bmr, neat, tef, totalCaloriesOut, netCalories,
            goalCalories: Math.round(goalCalories), proteinTarget, carbTarget, fatTarget,
            waterTarget,
        };
    }, [todayLog, calculateBMR, user, userGoals, dailyLogs.length, weightLog]);

    const fetchSuggestion = useCallback(async () => {
        if (!user || (!todayLog.foods.length && !todayLog.exercises.length && !todayLog.neatActivities.length)) return;
        
        const cooldownCheck = checkApiCooldown();
        if (!cooldownCheck.canCall) {
            console.warn("AI suggestion fetch skipped due to API cooldown.");
            return;
        }

        setIsLoadingSuggestion(true);
        try {
            recordApiCall();
            const suggestion = await getAISuggestion(user, todayLog, userGoals, dailyProgress);
            setAiSuggestion(suggestion);
        } catch (error) {
            console.error("Failed to fetch AI suggestion:", error);
        } finally {
            setIsLoadingSuggestion(false);
        }
    }, [user, todayLog, userGoals, dailyProgress]);

    useEffect(() => {
        const timer = setTimeout(() => { fetchSuggestion(); }, 3000);
        return () => clearTimeout(timer);
    }, [fetchSuggestion]);

    const updateGoals = async (newGoals: UserGoals) => {
        try {
            const updatedGoals = await api.updateGoals(newGoals);
            setUserGoals(updatedGoals);
        } catch (error: any) {
            console.error("Failed to update goals:", error);
            setToastMessage(`Error updating goals: ${error.message}`);
        }
    };
    
    // Helper function to find or create today's log and apply updates functionally
    const updateTodayLog = (updater: (log: DailyLog) => DailyLog) => {
        setDailyLogs(prevLogs => {
            const todayStr = new Date().toISOString().split('T')[0];
            const todayLogExists = prevLogs.some(log => log.date === todayStr);

            if (todayLogExists) {
                return prevLogs.map(log => log.date === todayStr ? updater(log) : log);
            } else {
                const newLog: DailyLog = { date: todayStr, foods: [], exercises: [], neatActivities: [], waterIntake: 0 };
                return [...prevLogs, updater(newLog)];
            }
        });
    };
    
    const addFood = (foods: Omit<FoodLog, 'id' | 'timestamp'>[]) => {
        const newFoodEntries = foods.map(createFoodLog);
        updateTodayLog(log => ({ ...log, foods: [...log.foods, ...newFoodEntries] }));
        api.addFood(newFoodEntries).catch((err: any) => setToastMessage(`Sync Error: ${err.message}`));
    };

    const addExercise = (exercise: Omit<ExerciseLog, 'id' | 'timestamp'>) => {
        const newExerciseEntry = createExerciseLog(exercise);
        updateTodayLog(log => ({ ...log, exercises: [...log.exercises, newExerciseEntry] }));
        api.addExercise(newExerciseEntry).catch((err: any) => setToastMessage(`Sync Error: ${err.message}`));
    };

    const updateFood = (id: string, data: { name: string; calories: number; }) => {
        updateTodayLog(log => ({
            ...log,
            foods: log.foods.map(f => f.id === id ? { ...f, ...data } : f),
        }));
        api.updateFood(id, data).catch((err: any) => setToastMessage(`Sync Error: ${err.message}`));
    };

    const deleteFood = (id: string) => {
        updateTodayLog(log => ({ ...log, foods: log.foods.filter(f => f.id !== id) }));
        api.deleteFood(id).catch((err: any) => setToastMessage(`Sync Error: ${err.message}`));
    };

    const updateExercise = (id: string, data: { name: string; caloriesBurned: number; }) => {
        updateTodayLog(log => ({
            ...log,
            exercises: log.exercises.map(e => e.id === id ? { ...e, ...data } : e),
        }));
        api.updateExercise(id, data).catch((err: any) => setToastMessage(`Sync Error: ${err.message}`));
    };

    const deleteExercise = (id: string) => {
        updateTodayLog(log => ({ ...log, exercises: log.exercises.filter(ex => ex.id !== id) }));
        api.deleteExercise(id).catch((err: any) => setToastMessage(`Sync Error: ${err.message}`));
    };
    
    const addNeatActivity = (activity: Omit<NeatLog, 'id'>) => {
        const newActivity = { ...activity, id: crypto.randomUUID() };
        updateTodayLog(log => ({ ...log, neatActivities: [...log.neatActivities, newActivity] }));
        api.addNeatActivity(newActivity).catch((err: any) => setToastMessage(`Sync Error: ${err.message}`));
    };
    
    const updateNeatActivity = (id: string, calories: number) => {
        updateTodayLog(log => ({
            ...log,
            neatActivities: log.neatActivities.map(a => a.id === id ? { ...a, calories } : a),
        }));
        api.updateNeatActivity(id, calories).catch((err: any) => setToastMessage(`Sync Error: ${err.message}`));
    };
    
    const removeNeatActivity = (id: string) => {
        updateTodayLog(log => ({ ...log, neatActivities: log.neatActivities.filter(a => a.id !== id) }));
        api.removeNeatActivity(id).catch((err: any) => setToastMessage(`Sync Error: ${err.message}`));
    };

    const addWater = (amount: number) => {
        updateTodayLog(log => ({ ...log, waterIntake: (log.waterIntake || 0) + amount }));
        api.addWater(amount).catch((err: any) => setToastMessage(`Sync Error: ${err.message}`));
    };

    return (
        <DataContext.Provider value={{
            dailyLogs, userGoals, aiSuggestion, isLoadingSuggestion, todayLog,
            dailyProgress, weightLog, updateGoals, addFood, addExercise, updateFood,
            deleteFood, updateExercise, deleteExercise, addNeatActivity, updateNeatActivity,
            removeNeatActivity, addWater, isDataLoading
        }}>
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
            {isDataLoading ? (
                <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-900">
                    <div className="text-center">
                        <svg className="animate-spin h-8 w-8 text-emerald-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-slate-600 dark:text-slate-300 font-semibold">Loading your dashboard...</p>
                    </div>
                </div>
            ) : children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};