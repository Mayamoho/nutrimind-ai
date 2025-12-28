/**
 * Achievement Context
 * Provides achievement state and actions to React components
 * Integrates all design patterns into a cohesive React context
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { AchievementManager, UserAchievementState } from '../patterns/Singleton';
import { Achievement, AchievementEvent, UINotificationObserver, AchievementCategory } from '../patterns/Observer';
import { 
  FoodLoggedCommand, 
  ExerciseLoggedCommand, 
  WaterLoggedCommand,
  DailyCheckInCommand,
  getAchievementInvoker 
} from '../patterns/Command';
import { DailyLog, UserGoals, FoodLog, ExerciseLog } from '../types';
import { api } from '../services/api';

interface AchievementContextType {
  // State
  state: UserAchievementState;
  allAchievements: Achievement[];
  recentUnlocks: Achievement[];
  nextAchievement: Achievement | null;
  
  // Actions
  checkAchievements: (logs: DailyLog[], goals: UserGoals) => void;
  onFoodLogged: (logs: DailyLog[], goals: UserGoals, food: FoodLog) => void;
  onExerciseLogged: (logs: DailyLog[], goals: UserGoals, exercise: ExerciseLog) => void;
  onWaterLogged: (logs: DailyLog[], goals: UserGoals, amount: number) => void;
  
  // Helpers
  getAchievementsByCategory: (category: AchievementCategory) => Achievement[];
  getLevelTitle: () => string;
  dismissRecentUnlock: (id: string) => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const AchievementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [manager] = useState(() => AchievementManager.getInstance());
  const [invoker] = useState(() => getAchievementInvoker());
  
  const [state, setState] = useState<UserAchievementState>(manager.getState());
  const [allAchievements, setAllAchievements] = useState<Achievement[]>(manager.getAllAchievements());
  const [recentUnlocks, setRecentUnlocks] = useState<Achievement[]>([]);
  const [nextAchievement, setNextAchievement] = useState<Achievement | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);

  // Load achievements from backend on mount
  useEffect(() => {
    const loadFromBackend = async () => {
      try {
        const data = await api.getAchievements();
        if (data && data.stats) {
          // Build unlocked achievements list from backend data
          const unlockedFromBackend: Achievement[] = (data.unlockedAchievements || []).map((ua: any) => ({
            id: ua.achievementId,
            name: ua.achievementId,
            description: '',
            icon: '🏆',
            category: 'milestone' as const,
            tier: 'bronze' as const,
            points: ua.pointsEarned || 0,
            unlockedAt: ua.unlockedAt ? new Date(ua.unlockedAt) : new Date(),
            progress: 0,
            target: 0
          }));

          manager.loadState({
            totalPoints: data.stats.totalPoints || 0,
            currentStreak: data.stats.currentStreak || 0,
            longestStreak: data.stats.longestStreak || 0,
            level: data.stats.level || 1,
            levelProgress: ((data.stats.totalPoints || 0) % 500) / 500 * 100,
            unlockedAchievements: unlockedFromBackend
          });
          setState(manager.getState());
          setAllAchievements(manager.getAllAchievements());
        }
      } catch (err) {
        console.log('Could not load achievements from backend, using local state');
      }
    };
    loadFromBackend();
  }, [manager]);

  // Sync to backend (debounced)
  const syncToBackend = useCallback(() => {
    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = window.setTimeout(async () => {
      try {
        const currentState = manager.getState();
        await api.syncAchievements({
          totalPoints: currentState.totalPoints,
          currentStreak: currentState.currentStreak,
          longestStreak: currentState.longestStreak,
          level: currentState.level,
          unlockedAchievements: currentState.unlockedAchievements.map(a => ({
            id: a.id,
            points: a.points,
            unlockedAt: a.unlockedAt
          }))
        });
      } catch (err) {
        console.log('Could not sync achievements to backend');
      }
    }, 2000);
  }, [manager]);

  // Subscribe to achievement events
  useEffect(() => {
    const observer = new UINotificationObserver((event: AchievementEvent) => {
      if (event.type === 'unlocked' && event.achievement) {
        setRecentUnlocks(prev => [...prev, event.achievement!]);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          setRecentUnlocks(prev => prev.filter(a => a.id !== event.achievement!.id));
        }, 5000);

        // Sync to backend
        syncToBackend();
      }
      
      // Update state after any event
      setState(manager.getState());
      setAllAchievements(manager.getAllAchievements());
    });

    manager.subscribe(observer);
    
    return () => {
      manager.unsubscribe(observer);
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [manager, syncToBackend]);

  const checkAchievements = useCallback((logs: DailyLog[], goals: UserGoals) => {
    const command = new DailyCheckInCommand(logs, goals);
    invoker.executeCommand(command);
    setState(manager.getState());
    setAllAchievements(manager.getAllAchievements());
    setNextAchievement(manager.getNextAchievement(logs, goals));
  }, [manager, invoker]);

  const onFoodLogged = useCallback((logs: DailyLog[], goals: UserGoals, food: FoodLog) => {
    const command = new FoodLoggedCommand(logs, goals, food);
    invoker.executeCommand(command);
    setState(manager.getState());
    setAllAchievements(manager.getAllAchievements());
    setNextAchievement(manager.getNextAchievement(logs, goals));
  }, [manager, invoker]);

  const onExerciseLogged = useCallback((logs: DailyLog[], goals: UserGoals, exercise: ExerciseLog) => {
    const command = new ExerciseLoggedCommand(logs, goals, exercise);
    invoker.executeCommand(command);
    setState(manager.getState());
    setAllAchievements(manager.getAllAchievements());
    setNextAchievement(manager.getNextAchievement(logs, goals));
  }, [manager, invoker]);

  const onWaterLogged = useCallback((logs: DailyLog[], goals: UserGoals, amount: number) => {
    const command = new WaterLoggedCommand(logs, goals, amount);
    invoker.executeCommand(command);
    setState(manager.getState());
    setAllAchievements(manager.getAllAchievements());
    setNextAchievement(manager.getNextAchievement(logs, goals));
  }, [manager, invoker]);

  const getAchievementsByCategory = useCallback((category: AchievementCategory) => {
    return manager.getAchievementsByCategory(category);
  }, [manager]);

  const getLevelTitle = useCallback(() => {
    return manager.getLevelTitle(state.level);
  }, [manager, state.level]);

  const dismissRecentUnlock = useCallback((id: string) => {
    setRecentUnlocks(prev => prev.filter(a => a.id !== id));
  }, []);

  return (
    <AchievementContext.Provider value={{
      state,
      allAchievements,
      recentUnlocks,
      nextAchievement,
      checkAchievements,
      onFoodLogged,
      onExerciseLogged,
      onWaterLogged,
      getAchievementsByCategory,
      getLevelTitle,
      dismissRecentUnlock
    }}>
      {children}
    </AchievementContext.Provider>
  );
};

export const useAchievements = (): AchievementContextType => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};
