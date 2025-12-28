import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  DailyLog,
  FoodLog,
  ExerciseLog,
  UserGoals,
  DailyProgress,
  WeightLog,
  NeatLog,
  AISuggestions,
} from "../types";
import { getAISuggestion } from "../services/geminiService";
import { useAuth } from "./AuthContext";
import { getEffectiveDate, calculateCurrentStreak, calculateBestStreak } from "../utils/dateUtils";
import { api } from "../services/api";
import Toast from "../components/Toast";

interface DataContextType {
  dailyLogs: DailyLog[];
  userGoals: UserGoals;
  aiSuggestion: AISuggestions;
  isLoadingSuggestion: boolean;
  todayLog: DailyLog;
  dailyProgress: DailyProgress;
  weightLog: WeightLog[];
  updateGoals: (newGoals: UserGoals) => Promise<void>;
  addFood: (foods: Omit<FoodLog, "id" | "timestamp">[]) => void;
  addExercise: (exercise: Omit<ExerciseLog, "id" | "timestamp">) => void;
  updateFood: (id: string, data: { name: string; calories: number }) => void;
  deleteFood: (id: string) => void;
  updateExercise: (id: string, data: { name: string; caloriesBurned: number }) => void;
  deleteExercise: (id: string) => void;
  addNeatActivity: (activity: Omit<NeatLog, "id">) => void;
  updateNeatActivity: (id: string, calories: number) => void;
  removeNeatActivity: (id: string) => void;
  addWater: (amount: number) => void;
  addWeightLog: (weight: number) => void;
  isDataLoading: boolean;
  currentStreak: number;
  bestStreak: number;
  projectedWeight: number;
  refreshSuggestion: () => void;
  detailedAnalysis: any;
  isLoadingDetailedAnalysis: boolean;
  fetchDetailedAnalysis: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode; isAuthenticated: boolean }> = ({
  children,
  isAuthenticated,
}) => {
  const { user, updateUser } = useAuth();

  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [userGoals, setUserGoals] = useState<UserGoals>({
    targetWeight: 0,
    weightGoal: "maintain",
    goalTimeline: 0,
  });
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestions>({
    positiveFood: [],
    positiveExercise: [],
    cautionFood: [],
    immediateAction: "",
    motivationalMessage: "",
    hydrationTip: "",
    nextMealSuggestion: null,
    progress: undefined,
    progressAnalysis: undefined,
  });
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState<boolean>(false);
  const [weightLog, setWeightLog] = useState<WeightLog[]>([]);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dataLoadedForUser, setDataLoadedForUser] = useState<string | null>(null);
  const [detailedAnalysis, setDetailedAnalysis] = useState<any>(null);
  const [isLoadingDetailedAnalysis, setIsLoadingDetailedAnalysis] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Calculate BMR - defined early so it can be used in weight calculation
  const calculateBMR = useCallback((): number => {
    if (!user) return 1600;
    const { weight = 70, height = 170, age = 30, gender = "female" } = user;
    const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === "male" ? 5 : -161);
    return Math.round(bmr);
  }, [user]);

  // Use effective date (6 AM boundary) instead of midnight
  const [todayStr, setTodayStr] = useState(() => getEffectiveDate());

  // Update todayStr when the effective date changes (e.g., after 6 AM)
  useEffect(() => {
    const checkDateChange = () => {
      const newTodayStr = getEffectiveDate();
      if (newTodayStr !== todayStr) {
        setTodayStr(newTodayStr);
      }
    };
    
    // Check every minute for date change
    const interval = setInterval(checkDateChange, 60000);
    return () => clearInterval(interval);
  }, [todayStr]);

  // Calculate current streak (consecutive days ending today/yesterday)
  const currentStreak = useMemo(() => {
    return calculateCurrentStreak(dailyLogs);
  }, [dailyLogs]);

  // Calculate best streak (longest ever)
  const bestStreak = useMemo(() => {
    return calculateBestStreak(dailyLogs);
  }, [dailyLogs]);

  // Load data from backend
  const loadData = useCallback(async () => {
    if (!isAuthenticated || !user?.email) {
      if (isMounted.current) setIsDataLoading(false);
      return;
    }

    if (isMounted.current) setIsDataLoading(true);

    try {
      const data = await api.getUserData();

      if (!data || !data.user) {
        if (isMounted.current) {
          setToastMessage("Unable to retrieve profile. Please sign in again.");
          setIsDataLoading(false);
        }
        return;
      }

      if (isMounted.current) {
        // Parse and set daily logs - keep all logs as received from backend
        const logs = Array.isArray(data.dailyLogs) ? data.dailyLogs : [];
        
        // Filter logs to only include current effective date to prevent old data from showing
        const effectiveDate = getEffectiveDate();
        const filteredLogs = logs.filter(log => log.date === effectiveDate);
        
        console.log('Filtering logs:', { 
          originalCount: logs.length, 
          filteredCount: filteredLogs.length, 
          effectiveDate,
          allDates: logs.map(l => l.date)
        });
        
        setDailyLogs(filteredLogs);
        
        // Update AuthContext user with fresh backend data (including weight)
        if (updateUser && data.user) {
          console.log('Updating user weight from backend:', { currentWeight: user?.weight, backendWeight: data.user.weight });
          updateUser(data.user);
        }
        
        // Set goals
        setUserGoals(
          data.userGoals && typeof data.userGoals === "object"
            ? data.userGoals
            : { targetWeight: data.user.weight ?? 0, weightGoal: "maintain", goalTimeline: 12 }
        );
        
        // Set weight log
        setWeightLog(
          Array.isArray(data.weightLog) && data.weightLog.length > 0
            ? data.weightLog
            : [{ date: todayStr, weight: data.user.weight ?? 0 }]
        );
        
        // Mark data as loaded for this user
        setDataLoadedForUser(user.email);
      }
    } catch (err: any) {
      console.error("DataProvider: failed to load user data:", err);
      if (isMounted.current) {
        setToastMessage(`Error loading data: ${err?.message ?? "Unknown error"}`);
      }
    } finally {
      if (isMounted.current) setIsDataLoading(false);
    }
  }, [isAuthenticated, user?.email, todayStr]);

  // Load data when authenticated - reload if user changes or on initial mount
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      // Always reload if user changed or data not loaded yet
      if (dataLoadedForUser !== user.email) {
        loadData();
      }
    } else if (!isAuthenticated) {
      // Clear all data on logout
      setDataLoadedForUser(null);
      setDailyLogs([]);
      setWeightLog([]);
      setUserGoals({ targetWeight: 0, weightGoal: "maintain", goalTimeline: 0 });
      setAiSuggestion({ positiveFood: [], positiveExercise: [], cautionFood: [] });
      setIsDataLoading(false);
    }
  }, [isAuthenticated, user?.email, dataLoadedForUser, loadData]);

  // Get today's log from dailyLogs
  const todayLog = useMemo<DailyLog>(() => {
    const effectiveDate = getEffectiveDate();
    const found = dailyLogs.find((l) => l.date === effectiveDate);
    console.log('Looking for log with date:', { 
      effectiveDate, 
      todayStr, 
      found: found?.foods?.length || 0, 
      allDates: dailyLogs.map(l => ({ date: l.date, foodCount: l.foods?.length || 0 })),
      currentDate: new Date().toISOString()
    });
    
    // Always use effective date, not todayStr
    return found ?? { date: effectiveDate, foods: [], exercises: [], neatActivities: [], waterIntake: 0 };
  }, [dailyLogs]);

  // Calculate current weight based on today's calorie balance (not 7-day projection)
  // FIXED: Uses yesterday's final weight as starting point
  const projectedWeight = useMemo(() => {
    const effectiveToday = getEffectiveDate();
    
    // Get yesterday's final weight (or initial weight if no history)
    let startWeight = user?.weight ?? 70;
    
    // Find the most recent weight entry BEFORE today
    const sortedWeightLog = [...weightLog].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    for (let i = sortedWeightLog.length - 1; i >= 0; i--) {
      const logDate = sortedWeightLog[i].date;
      if (logDate < effectiveToday) {
        startWeight = sortedWeightLog[i].weight;
        break;
      }
    }
    
    // If no activity logged today, return start weight
    if (todayLog.foods.length === 0 && todayLog.exercises.length === 0) {
      return startWeight;
    }
    
    // Calculate today's calorie balance
    const bmr = calculateBMR();
    const caloriesIn = todayLog.foods.reduce((sum, f) => sum + (f.calories || 0), 0);
    const exerciseBurn = todayLog.exercises.reduce((sum, e) => sum + (e.caloriesBurned || 0), 0);
    const neatBurn = todayLog.neatActivities?.reduce((sum, a) => sum + (a.calories || 0), 0) || 0;
    const tef = Math.round(caloriesIn * 0.1);
    const totalOut = bmr + exerciseBurn + neatBurn + tef;
    const netCalories = caloriesIn - totalOut;
    
    // Calculate weight change: 7700 calories = 1 kg
    const weightChange = netCalories / 7700;
    const newWeight = startWeight + weightChange;
    
    return Math.round(newWeight * 100) / 100;
  }, [todayLog, weightLog, user?.weight, calculateBMR]);

  // Calculate daily progress
  const dailyProgress = useMemo<DailyProgress>(() => {
    try {
      // Ensure all inputs are valid numbers
      const bmr = Math.max(0, Number(calculateBMR()) || 1600);
      const caloriesIn = Math.max(0, todayLog.foods.reduce((sum, f) => sum + (Math.max(0, Number(f.calories)) || 0), 0));
      const exerciseBurn = Math.max(0, todayLog.exercises.reduce((sum, e) => sum + (Math.max(0, Number(e.caloriesBurned)) || 0), 0));
      const neatBurn = Math.max(0, todayLog.neatActivities?.reduce((sum, a) => sum + (Math.max(0, Number(a.calories)) || 0), 0) || 0);
      const tef = Math.max(0, Math.round((caloriesIn || 0) * 0.1));
      const totalOut = Math.max(0, bmr + exerciseBurn + neatBurn + tef);
      const netCalories = caloriesIn - totalOut;

      // Debug logging for NaN values
      console.log('DailyProgress calculation:', {
        bmr, caloriesIn, exerciseBurn, neatBurn, tef, totalOut, netCalories,
        foodCount: todayLog.foods.length,
        exerciseCount: todayLog.exercises.length,
        neatCount: todayLog.neatActivities?.length || 0,
        isNaNBMR: isNaN(bmr),
        isNaNCaloriesIn: isNaN(caloriesIn),
        isNaNExerciseBurn: isNaN(exerciseBurn),
        isNaNNeatBurn: isNaN(neatBurn),
        isNaNTotalOut: isNaN(totalOut),
        isNaNNetCalories: isNaN(netCalories)
      });

      // Final validation - ensure no NaN values
      const safeCaloriesIn = isNaN(caloriesIn) || !isFinite(caloriesIn) ? 0 : Math.max(0, caloriesIn);
      const safeExerciseBurn = isNaN(exerciseBurn) || !isFinite(exerciseBurn) ? 0 : Math.max(0, exerciseBurn);
      const safeNeatBurn = isNaN(neatBurn) || !isFinite(neatBurn) ? 0 : Math.max(0, neatBurn);
      const safeTotalOut = isNaN(totalOut) || !isFinite(totalOut) ? 0 : Math.max(0, totalOut);
      const safeNetCalories = isNaN(netCalories) || !isFinite(netCalories) ? 0 : netCalories;

    const protein = Math.max(0, todayLog.foods.reduce((sum, f) => {
      const proteinNutrient = f.nutrients?.macros?.find(m => m.name === 'Protein');
      return sum + (Math.max(0, Number(proteinNutrient?.amount)) || 0);
    }, 0));
    const carbs = Math.max(0, todayLog.foods.reduce((sum, f) => {
      const carbNutrient = f.nutrients?.macros?.find(m => m.name === 'Carbs');
      return sum + (Math.max(0, Number(carbNutrient?.amount)) || 0);
    }, 0));
    const fat = Math.max(0, todayLog.foods.reduce((sum, f) => {
      const fatNutrient = f.nutrients?.macros?.find(m => m.name === 'Fat');
      return sum + (Math.max(0, Number(fatNutrient?.amount)) || 0);
    }, 0));

    // Aggregate micro-nutrients from all foods
    const microNutrientTotals: Record<string, number> = {};
    todayLog.foods.forEach(food => {
      if (food.nutrients?.micros) {
        food.nutrients.micros.forEach(micro => {
          // Normalize the key to match our micro-nutrient structure
          let key = micro.name.toLowerCase().replace(/\s+/g, '');
          
          // Handle special cases for vitamin names
          if (key === 'vitamina') key = 'vitaminA';
          if (key === 'vitaminc') key = 'vitaminC';
          if (key === 'vitamind') key = 'vitaminD';
          if (key === 'saturatedfat') key = 'saturatedFat'; // Handle saturated fat separately
          
          microNutrientTotals[key] = (microNutrientTotals[key] || 0) + (Number(micro.amount) || 0);
        });
      }
    });

    // Define micro-nutrients with exact structure matching DailyProgress interface
    const microNutrients = {
      fiber: { achieved: microNutrientTotals['fiber'] || 0, target: 28 },
      sugar: { achieved: microNutrientTotals['sugar'] || 0, target: 25 },
      sodium: { achieved: microNutrientTotals['sodium'] || 0, target: 2300 },
      potassium: { achieved: microNutrientTotals['potassium'] || 0, target: 4700 },
      vitaminA: { achieved: microNutrientTotals['vitaminA'] || 0, target: 900 },
      vitaminC: { achieved: microNutrientTotals['vitaminC'] || 0, target: 90 },
      vitaminD: { achieved: microNutrientTotals['vitaminD'] || 0, target: 20 },
      calcium: { achieved: microNutrientTotals['calcium'] || 0, target: 1000 },
      iron: { achieved: microNutrientTotals['iron'] || 0, target: 18 },
      magnesium: { achieved: microNutrientTotals['magnesium'] || 0, target: 420 },
      zinc: { achieved: microNutrientTotals['zinc'] || 0, target: 11 },
      cholesterol: { achieved: microNutrientTotals['cholesterol'] || 0, target: 300 }
    };

    // Calculate micro-nutrient status
    const microNutrientStatus = {
      overallScore: 0,
      recommendations: [] as string[],
      topDeficiencies: [] as string[],
      topAdequate: [] as string[]
    };

    // Calculate scores and generate recommendations
    let totalScore = 0;
    let nutrientCount = 0;

    Object.entries(microNutrients).forEach(([key, value]) => {
      const percentage = Math.min(Math.round((value.achieved / value.target) * 100), 200);
      totalScore += Math.min(percentage, 100); // Cap at 100% per nutrient
      nutrientCount++;

      // Generate recommendations for deficient nutrients
      if (percentage < 50) {
        microNutrientStatus.topDeficiencies.push(
          `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} (${Math.round(percentage)}% of target)`
        );
      } else if (percentage > 80) {
        microNutrientStatus.topAdequate.push(
          `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`
        );
      }
    });

    // Calculate overall score (average of all nutrients, capped at 100%)
    microNutrientStatus.overallScore = nutrientCount > 0 ? Math.round(totalScore / nutrientCount) : 100;

    // Add general recommendations
    if (microNutrientStatus.topDeficiencies.length > 0) {
      microNutrientStatus.recommendations.push(
        `Focus on increasing your intake of ${microNutrientStatus.topDeficiencies.slice(0, 2).join(' and ')}.`
      );
    }

    let goalCalories = (bmr || 1600) * 1.2;
    if (userGoals.weightGoal === 'lose') {
      goalCalories -= 500;
    } else if (userGoals.weightGoal === 'gain') {
      goalCalories += 500;
    }

    const proteinTarget = Math.round(((user?.weight || 70) * 1.6) || 112);
    const fatTarget = Math.round(((goalCalories * 0.25) / 9) || 0);
    const carbTarget = Math.round(((goalCalories - (proteinTarget * 4) - (fatTarget * 9)) / 4) || 0);

    return {
      calories: {
        achieved: safeCaloriesIn,
        eat: safeExerciseBurn,
      },
      protein,
      carbs,
      fat,
      bmr,
      neat: safeNeatBurn,
      tef,
      totalCaloriesOut: safeTotalOut,
      netCalories: safeNetCalories,
      goalCalories: Math.round(goalCalories),
      proteinTarget,
      carbTarget,
      fatTarget,
      waterTarget: 2500,
      microNutrients,
      microNutrientStatus
    };
    } catch (error) {
      console.error('Error calculating daily progress:', error);
      // Return safe default values
      return {
        calories: { achieved: 0, eat: 0 },
        protein: 0, carbs: 0, fat: 0,
        bmr: 1600, neat: 0, tef: 0,
        totalCaloriesOut: 1600, netCalories: 0, goalCalories: 2000,
        proteinTarget: 112, carbTarget: 250, fatTarget: 56,
        waterTarget: 2500,
        microNutrients: {
          fiber: { achieved: 0, target: 28 },
          sugar: { achieved: 0, target: 25 },
          sodium: { achieved: 0, target: 2300 },
          potassium: { achieved: 0, target: 4700 },
          vitaminA: { achieved: 0, target: 900 },
          vitaminC: { achieved: 0, target: 90 },
          vitaminD: { achieved: 0, target: 20 },
          calcium: { achieved: 0, target: 1000 },
          iron: { achieved: 0, target: 18 },
          magnesium: { achieved: 0, target: 420 },
          zinc: { achieved: 0, target: 11 },
          cholesterol: { achieved: 0, target: 300 }
        },
        microNutrientStatus: {
          overallScore: 0,
          recommendations: [],
          topDeficiencies: [],
          topAdequate: []
        }
      };
    }
  }, [todayLog, calculateBMR, userGoals.weightGoal, user?.weight]);

  // Update refs for other uses
  const userRef = useRef(user);
  const todayLogRef = useRef(todayLog);
  const userGoalsRef = useRef(userGoals);
  const dailyProgressRef = useRef(dailyProgress);

  useEffect(() => {
    userRef.current = user;
    todayLogRef.current = todayLog;
    userGoalsRef.current = userGoals;
    dailyProgressRef.current = dailyProgress;
  }, [user, todayLog, userGoals, dailyProgress]);

  // Fetch suggestion directly with current data (not using refs)
  const fetchSuggestionWithData = useCallback(async (
    currentUser: typeof user,
    currentTodayLog: DailyLog,
    currentUserGoals: UserGoals,
    currentDailyProgress: DailyProgress
  ) => {
    if (!isAuthenticated || !currentUser) {
      console.log('fetchSuggestion: Not authenticated or no user');
      return;
    }

    console.log('fetchSuggestion: Starting to fetch AI Coach suggestions...');
    console.log('fetchSuggestion: Foods:', currentTodayLog.foods.length, 'Exercises:', currentTodayLog.exercises.length);
    
    setIsLoadingSuggestion(true);
    try {
      // Use AI Coach service with a client-side timeout to avoid hanging
      const fetchPromise = api.getAICoachSuggestions({
        user: currentUser,
        dailyLog: currentTodayLog,
        userGoals: currentUserGoals,
        dailyProgress: currentDailyProgress
      });
      const timeoutMs = 8500;
      const result = await Promise.race([
        fetchPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI suggestion request timed out')), timeoutMs))
      ]);
      console.log('fetchSuggestion: Got AI Coach result:', result);

      // Defensive validation: ensure result is an object with expected shape
      const isValid = result && typeof result === 'object' && (
        Array.isArray(result.positiveFood) || Array.isArray(result.positiveExercise) || result.progress || result.progressAnalysis || 
        Array.isArray(result.foodRecommendations) || result.summary || result.mealPlan
      );

      if (isMounted.current) {
        if (isValid) {
          // Sanitize numeric fields to avoid NaN showing up in the UI
          let sanitized = { ...result };

          // Convert backend AI Coach format to frontend format with detailed nutritionist analysis
          if (sanitized.foodRecommendations && Array.isArray(sanitized.foodRecommendations)) {
            sanitized = {
              ...sanitized,
              positiveFood: sanitized.foodRecommendations,
              positiveExercise: sanitized.exerciseTip ? [sanitized.exerciseTip] : [],
              cautionFood: sanitized.cautionFood || [],
              progress: {
                caloriesConsumed: currentDailyProgress.calories?.achieved || 0,
                caloriesRemaining: (currentDailyProgress.goalCalories || 2000) - (currentDailyProgress.calories?.achieved || 0),
                goalCalories: currentDailyProgress.goalCalories || 2000,
                proteinConsumed: currentDailyProgress.protein || 0,
                proteinRemaining: (currentDailyProgress.proteinTarget || 50) - (currentDailyProgress.protein || 0),
                proteinTarget: currentDailyProgress.proteinTarget || 50,
                percentComplete: Math.round(((currentDailyProgress.calories?.achieved || 0) / (currentDailyProgress.goalCalories || 2000)) * 100)
              },
              progressAnalysis: {
                feedback: sanitized.summary || 'Keep up the good work!',
                mealPlan: sanitized.mealPlan || 'Focus on balanced meals.',
                hydrationTip: sanitized.hydrationTip || 'Stay hydrated throughout the day.',
                overallGrade: sanitized.nutritionalInsights?.overallGrade || 'C',
                nextSteps: sanitized.nutritionalInsights?.nextSteps || 'Continue with your current routine.',
                // Add detailed nutritionist analysis
                whyEatThis: sanitized.whyEatThis || [],
                whyAvoidThat: sanitized.whyAvoidThat || [],
                problematicFoods: sanitized.problematicFoods || [],
                goodFoods: sanitized.goodFoods || [],
                nutritionalIssues: sanitized.nutritionalIssues || [],
                nutritionalInsights: sanitized.nutritionalInsights || {}
              }
            };
          }

          // Normalize progress numbers
          if (sanitized.progress && typeof sanitized.progress === 'object') {
            sanitized.progress = {
              ...sanitized.progress,
              caloriesConsumed: Number(sanitized.progress.caloriesConsumed) || 0,
              caloriesRemaining: Number(sanitized.progress.caloriesRemaining) || 0,
              goalCalories: Number(sanitized.progress.goalCalories) || 0,
              proteinConsumed: Number(sanitized.progress.proteinConsumed) || 0,
              proteinRemaining: Number(sanitized.progress.proteinRemaining) || 0,
              proteinTarget: Number(sanitized.progress.proteinTarget) || 0,
              percentComplete: Number(sanitized.progress.percentComplete) || 0
            };
          }

          // Fix or replace malformed text feedback
          if (sanitized.progressAnalysis && typeof sanitized.progressAnalysis.feedback === 'string') {
            if (/NaN|undefined/.test(sanitized.progressAnalysis.feedback)) {
              sanitized.progressAnalysis.feedback = `Aim for ${sanitized.progress?.caloriesRemaining || 0} kcal next meal with ${sanitized.progress?.proteinRemaining || 0}g protein.`;
            }
          }

          // Ensure nextMealSuggestion options have numeric macro fields
          if (sanitized.nextMealSuggestion && Array.isArray(sanitized.nextMealSuggestion.options)) {
            sanitized.nextMealSuggestion.options = sanitized.nextMealSuggestion.options.map((opt: any) => ({
              ...opt,
              calories: Number(opt.calories) || 0,
              protein: Number(opt.protein) || 0
            }));
          }

          setAiSuggestion(sanitized);
        } else {
          console.warn('Invalid AI suggestion shape, falling back to default', result);
          setAiSuggestion({ positiveFood: [], positiveExercise: [], cautionFood: [], progress: { caloriesConsumed: 0, caloriesRemaining: 0, goalCalories: 2000, proteinConsumed: 0, proteinRemaining: 0, proteinTarget: 0, percentComplete: 0 } });
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch AI Coach suggestion:", err);
      if (isMounted.current) setAiSuggestion({ positiveFood: [], positiveExercise: [], cautionFood: [], progress: { caloriesConsumed: 0, caloriesRemaining: 0, goalCalories: 2000, proteinConsumed: 0, proteinRemaining: 0, proteinTarget: 0, percentComplete: 0 } });
    } finally {
      if (isMounted.current) setIsLoadingSuggestion(false);
    }
  }, [isAuthenticated]);

  // Track previous counts to detect actual changes
  const prevFoodCountRef = useRef(0);
  const prevExerciseCountRef = useRef(0);

  // Fetch suggestion when food/exercise is added - ALWAYS trigger on changes
  useEffect(() => {
    const foodCount = todayLog.foods.length;
    const exerciseCount = todayLog.exercises.length;
    
    const foodAdded = foodCount > prevFoodCountRef.current;
    const exerciseAdded = exerciseCount > prevExerciseCountRef.current;
    
    // Update refs
    prevFoodCountRef.current = foodCount;
    prevExerciseCountRef.current = exerciseCount;

    // Trigger on ANY food/exercise addition
    if ((foodAdded || exerciseAdded) && user) {
      console.log('Food/exercise added, fetching AI coach suggestion...');
      
      // Small delay to ensure state is settled, then fetch
      const timer = setTimeout(() => {
        fetchSuggestionWithData(user, todayLog, userGoals, dailyProgress);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [todayLog.foods.length, todayLog.exercises.length, user, userGoals, fetchSuggestionWithData]);

  // Fetch initial suggestion when data loads
  useEffect(() => {
    if (!isDataLoading && isAuthenticated && user) {
      const hasData = todayLog.foods.length > 0 || todayLog.exercises.length > 0;
      if (hasData) {
        console.log('Initial data loaded, fetching AI coach suggestion...');
        const timer = setTimeout(() => {
          fetchSuggestionWithData(user, todayLog, userGoals, dailyProgress);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isDataLoading, isAuthenticated]);

  // Helper to update today's log in state
  const updateTodayLog = useCallback((updater: (log: DailyLog) => DailyLog) => {
    const currentTodayStr = getEffectiveDate(); // Always get fresh date
    console.log('Updating today log for date:', currentTodayStr);
    setDailyLogs((prev) => {
      const idx = prev.findIndex((l) => l.date === currentTodayStr);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = updater(updated[idx]);
        return updated;
      }
      return [...prev, updater({ date: currentTodayStr, foods: [], exercises: [], neatActivities: [], waterIntake: 0 })];
    });
  }, []);

  // Helper to update current weight based on today's calorie balance
  // FIXED: Weight now persists across days - accumulates changes instead of resetting
  const updateCurrentWeightFromCalories = useCallback(() => {
    const effectiveToday = getEffectiveDate();
    
    // Get yesterday's final weight (or initial weight if no history)
    let startWeight = user?.weight ?? 70;
    
    // Find the most recent weight entry BEFORE today
    const sortedWeightLog = [...weightLog].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    for (let i = sortedWeightLog.length - 1; i >= 0; i--) {
      const logDate = sortedWeightLog[i].date;
      if (logDate < effectiveToday) {
        startWeight = sortedWeightLog[i].weight;
        break;
      } else if (logDate === effectiveToday) {
        // If we already have today's entry, use the initial weight from before today
        continue;
      }
    }
    
    // Calculate today's calorie balance
    const bmr = calculateBMR();
    const caloriesIn = todayLog.foods.reduce((sum, f) => sum + (f.calories || 0), 0);
    const exerciseBurn = todayLog.exercises.reduce((sum, e) => sum + (e.caloriesBurned || 0), 0);
    const neatBurn = todayLog.neatActivities?.reduce((sum, a) => sum + (a.calories || 0), 0) || 0;
    const tef = Math.round(caloriesIn * 0.1);
    const totalOut = bmr + exerciseBurn + neatBurn + tef;
    const netCalories = caloriesIn - totalOut;
    
    // Calculate weight change: 7700 calories = 1 kg
    const weightChange = netCalories / 7700;
    const newWeight = startWeight + weightChange;
    const roundedWeight = Math.round(newWeight * 100) / 100; // 2 decimal places
    
    console.log(`[Weight Update] Start: ${startWeight}kg, Change: ${weightChange.toFixed(3)}kg, New: ${roundedWeight}kg`);
    
    // Update weight log for today
    setWeightLog((prev) => {
      const existing = prev.findIndex((w) => w.date === effectiveToday);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { date: effectiveToday, weight: roundedWeight };
        return updated;
      }
      return [...prev, { date: effectiveToday, weight: roundedWeight }];
    });
    
    // Update user's current weight throughout the app
    if (updateUser) {
      updateUser({ weight: roundedWeight });
    }
    
    // Save to backend
    api.addWeightLog(effectiveToday, roundedWeight).catch((err) => {
      const errorMessage = err?.message || err?.error || 'Unknown error';
      console.error("Failed to save weight:", { error: err, message: errorMessage, weight: roundedWeight, date: effectiveToday });
    });
  }, [todayLog, weightLog, user?.weight, calculateBMR, updateUser]);

  // Update goals
  const updateGoals = useCallback(async (newGoals: UserGoals) => {
    try {
      await api.updateGoals(newGoals);
      setUserGoals(newGoals);
    } catch (err) {
      console.error("Failed to update goals:", err);
      throw err;
    }
  }, []);

  // Add food
  const addFood = useCallback((foods: Omit<FoodLog, "id" | "timestamp">[]) => {
    const newFoods: FoodLog[] = foods.map((f) => ({
      ...f,
      calories: Number(f.calories) || 0,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }));
    updateTodayLog((log) => ({ 
      ...log, 
      foods: [...(log.foods || []), ...newFoods] 
    }));
    // Send original foods (without id/timestamp) to backend
    api.addFood(foods).catch((err) => console.error("Failed to save food:", err));
    
    // Update current weight based on calorie balance
    setTimeout(() => updateCurrentWeightFromCalories(), 500);
  }, [updateTodayLog, updateCurrentWeightFromCalories]);

  // Update food
  const updateFood = useCallback((id: string, data: { name: string; calories: number }) => {
    updateTodayLog((log) => ({
      ...log,
      foods: (log.foods || []).map((f) => (f.id === id ? { ...f, ...data } : f)),
    }));
    api.updateFood(id, data).catch((err) => console.error("Failed to update food:", err));
    
    // Update current weight based on calorie balance
    setTimeout(() => updateCurrentWeightFromCalories(), 500);
  }, [updateTodayLog, updateCurrentWeightFromCalories]);

  // Delete food
  const deleteFood = useCallback((id: string) => {
    updateTodayLog((log) => ({
      ...log,
      foods: (log.foods || []).filter((f) => f.id !== id),
    }));
    api.deleteFood(id).catch((err) => console.error("Failed to delete food:", err));
    
    // Update current weight based on calorie balance
    setTimeout(() => updateCurrentWeightFromCalories(), 500);
  }, [updateTodayLog, updateCurrentWeightFromCalories]);

  // Add exercise
  const addExercise = useCallback((exercise: Omit<ExerciseLog, "id" | "timestamp">) => {
    const newExercise: ExerciseLog = {
      ...exercise,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    updateTodayLog((log) => ({ 
      ...log, 
      exercises: [...(log.exercises || []), newExercise] 
    }));
    api.addExercise(newExercise).catch((err) => console.error("Failed to save exercise:", err));
    
    // Update current weight based on calorie balance
    setTimeout(() => updateCurrentWeightFromCalories(), 500);
  }, [updateTodayLog, updateCurrentWeightFromCalories]);

  // Update exercise
  const updateExercise = useCallback((id: string, data: { name: string; caloriesBurned: number }) => {
    updateTodayLog((log) => ({
      ...log,
      exercises: (log.exercises || []).map((e) => (e.id === id ? { ...e, ...data } : e)),
    }));
    api.updateExercise(id, data).catch((err) => console.error("Failed to update exercise:", err));
    
    // Update current weight based on calorie balance
    setTimeout(() => updateCurrentWeightFromCalories(), 500);
  }, [updateTodayLog, updateCurrentWeightFromCalories]);

  // Delete exercise
  const deleteExercise = useCallback((id: string) => {
    updateTodayLog((log) => ({
      ...log,
      exercises: (log.exercises || []).filter((e) => e.id !== id),
    }));
    api.deleteExercise(id).catch((err) => console.error("Failed to delete exercise:", err));
    
    // Update current weight based on calorie balance
    setTimeout(() => updateCurrentWeightFromCalories(), 500);
  }, [updateTodayLog, updateCurrentWeightFromCalories]);

  // Add NEAT activity
  const addNeatActivity = useCallback((activity: Omit<NeatLog, "id">) => {
    const newActivity: NeatLog = { ...activity, id: `neat-${Date.now()}` };
    updateTodayLog((log) => ({
      ...log,
      neatActivities: [...(log.neatActivities || []), newActivity],
    }));
    api.addNeatActivity(newActivity).catch((err) => console.error("Failed to save NEAT:", err));
  }, [updateTodayLog]);

  // Update NEAT activity
  const updateNeatActivity = useCallback((id: string, calories: number) => {
    updateTodayLog((log) => ({
      ...log,
      neatActivities: (log.neatActivities || []).map((a) => (a.id === id ? { ...a, calories } : a)),
    }));
    api.updateNeatActivity(id, calories).catch((err) => console.error("Failed to update NEAT:", err));
  }, [updateTodayLog]);

  // Remove NEAT activity
  const removeNeatActivity = useCallback((id: string) => {
    updateTodayLog((log) => ({
      ...log,
      neatActivities: (log.neatActivities || []).filter((a) => a.id !== id),
    }));
    api.removeNeatActivity(id).catch((err) => console.error("Failed to remove NEAT:", err));
  }, [updateTodayLog]);

  // Add water
  const addWater = useCallback((amount: number) => {
    updateTodayLog((log) => ({
      ...log,
      waterIntake: (log.waterIntake || 0) + amount,
    }));
    api.addWater(amount).catch((err) => console.error("Failed to save water:", err));
  }, [updateTodayLog]);

  // Add weight log
  const addWeightLog = useCallback((weight: number) => {
    const today = new Date().toISOString().split("T")[0];
    setWeightLog((prev) => {
      const existing = prev.findIndex((w) => w.date === today);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { date: today, weight };
        return updated;
      }
      return [...prev, { date: today, weight }];
    });
    
    if (updateUser) {
      updateUser({ weight });
    }
    
    api.addWeightLog(today, weight).catch((err) => {
      const errorMessage = err?.message || err?.error || 'Unknown error';
      console.error("Failed to save weight:", { error: err, message: errorMessage, weight, date: today });
    });
  }, [updateUser]);

  // Manual refresh suggestion function
  const refreshSuggestion = useCallback(() => {
    if (user) {
      fetchSuggestionWithData(user, todayLog, userGoals, dailyProgress);
    }
  }, [user, todayLog, userGoals, dailyProgress, fetchSuggestionWithData]);

  // Fetch detailed analysis function
  const fetchDetailedAnalysis = useCallback(async () => {
    if (!user) {
      console.log('fetchDetailedAnalysis: No user found');
      return;
    }

    setIsLoadingDetailedAnalysis(true);
    try {
      console.log('fetchDetailedAnalysis: Starting detailed analysis...');
      const result = await api.getDetailedAnalysis();
      console.log('fetchDetailedAnalysis: Got detailed analysis result');
      
      if (result && typeof result === 'object') {
        setDetailedAnalysis(result);
      } else {
        console.error('fetchDetailedAnalysis: Invalid result format', result);
        setDetailedAnalysis(null);
      }
    } catch (error) {
      console.error('fetchDetailedAnalysis: Error fetching detailed analysis', error);
      setDetailedAnalysis(null);
      
      // Show error toast
      setToastMessage('Failed to load detailed analysis. Please try again.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsLoadingDetailedAnalysis(false);
    }
  }, [user]);

  return (
    <DataContext.Provider
      value={{
        dailyLogs,
        userGoals,
        aiSuggestion,
        isLoadingSuggestion,
        todayLog,
        dailyProgress,
        weightLog,
        updateGoals,
        addFood,
        addExercise,
        updateFood,
        deleteFood,
        updateExercise,
        deleteExercise,
        addNeatActivity,
        updateNeatActivity,
        removeNeatActivity,
        addWater,
        addWeightLog,
        isDataLoading,
        currentStreak,
        bestStreak,
        projectedWeight,
        refreshSuggestion,
        detailedAnalysis,
        isLoadingDetailedAnalysis,
        fetchDetailedAnalysis,
      }}
    >
      {children}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
