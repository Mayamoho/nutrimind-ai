// import React, { useState } from 'react';
// import HistoryChart from './HistoryChart';
// import LogInput from './LogInput';
// import LogList from './LogList';
// import SuggestionCard from './SuggestionCard';
// import BMIStatus from './BMIStatus';
// import GoalSettingsModal from './GoalSettingsModal';
// import { TargetIcon } from './icons/TargetIcon';
// import WeightProgress from './WeightProgress';
// import { useAuth } from '../contexts/AuthContext';
// import { useData } from '../contexts/DataContext';
// import CalorieBreakdown from './CalorieBreakdown';
// import WeightProjectionChart from './WeightProjectionChart';
// import TargetCard from './TargetCard';
// import NeatLogger from './NeatLogger';
// import WaterTracker from './WaterTracker';


// const Dashboard: React.FC = () => {
//     const { user } = useAuth();
//     const {
//         userGoals,
//         dailyProgress,
//         updateGoals,
//         todayLog,
//         dailyLogs,
//         updateFood,
//         deleteFood,
//         updateExercise,
//         deleteExercise,
//         aiSuggestion,
//         isLoadingSuggestion,
//         weightLog,
//         addNeatActivity,
//         updateNeatActivity,
//         removeNeatActivity,
//         addWater,
//     } = useData();

//     const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
    
//     if (!user) {
//         // This case should ideally not be reached if routing is handled in App.tsx
//         return null;
//     }

//     const currentWeight = weightLog.length > 0 ? weightLog[weightLog.length - 1].weight : user.weight;

//     return (
//         <div className="space-y-6">
//             <div className="flex justify-between items-start">
//                 <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
//                     Welcome back, <span className="text-emerald-500">{user.lastName}</span>!
//                 </h2>
//                  <button
//                     onClick={() => setIsGoalsModalOpen(true)}
//                     className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
//                 >
//                     <TargetIcon />
//                     <span>Set Goals</span>
//                 </button>
//             </div>

//             <TargetCard progress={dailyProgress} />

//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 <CalorieBreakdown progress={dailyProgress} />
//                 <WeightProgress 
//                     currentWeight={currentWeight} 
//                     targetWeight={userGoals.targetWeight} 
//                     startWeight={user.startWeight}
//                     weightLog={weightLog}
//                 />
//             </div>


//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 <div className="lg:col-span-2 space-y-6">
//                     <LogInput />
//                     <SuggestionCard suggestion={aiSuggestion} isLoading={isLoadingSuggestion} />
//                     <NeatLogger 
//                         loggedActivities={todayLog.neatActivities}
//                         onAddActivity={addNeatActivity}
//                         onUpdateActivity={updateNeatActivity}
//                         onRemoveActivity={removeNeatActivity}
//                     />
//                     <LogList 
//                         todayLog={todayLog} 
//                         onUpdateFood={updateFood}
//                         onDeleteFood={deleteFood}
//                         onUpdateExercise={updateExercise}
//                         onDeleteExercise={deleteExercise}
//                     />
//                 </div>
//                 <div className="lg:col-span-1 space-y-6">
//                     <WaterTracker 
//                         currentIntake={todayLog.waterIntake || 0}
//                         target={dailyProgress.waterTarget}
//                         onAddWater={addWater}
//                     />
//                     <WeightProjectionChart 
//                         weightLog={weightLog} 
//                         startWeight={user.startWeight || user.weight}
//                         targetWeight={userGoals.targetWeight}
//                         goalTimeline={userGoals.goalTimeline}
//                     />
//                     <HistoryChart dailyLogs={dailyLogs} />
//                     <BMIStatus weight={currentWeight} height={user.height} />
//                 </div>
//             </div>
            
//             <GoalSettingsModal
//                 isOpen={isGoalsModalOpen}
//                 onClose={() => setIsGoalsModalOpen(false)}
//                 currentGoals={userGoals}
//                 onSave={updateGoals}
//             />
//         </div>
//     );
// };

// export default Dashboard;

import React, { useState, useEffect } from 'react';
import HistoryChart from './HistoryChart';
import LogInput from './LogInput';
import LogList from './LogList';
import SuggestionCard from './SuggestionCard';
import BMIStatus from './BMIStatus';
import GoalSettingsModal from './GoalSettingsModal';
import { TargetIcon } from './icons/TargetIcon';
import WeightProgress from './WeightProgress';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useAchievements } from '../contexts/AchievementContext';
import CalorieBreakdown from './CalorieBreakdown';
import WeightProjectionChart from './WeightProjectionChart';
import TargetCard from './TargetCard';
import NeatLogger from './NeatLogger';
import WaterTracker from './WaterTracker';
import AchievementWidget from './AchievementWidget';
import DailyInsights from './DailyInsights';


const defaultGoals = { targetWeight: 0, weightGoal: 'maintain' as const, goalTimeline: 0 };
const defaultProgress = {
  calories: { achieved: 0, eat: 0 },
  protein: 0, carbs: 0, fat: 0,
  bmr: 0, neat: 0, tef: 0,
  totalCaloriesOut: 0, netCalories: 0, goalCalories: 0,
  proteinTarget: 0, carbTarget: 0, fatTarget: 0, waterTarget: 2000,
  microNutrients: {
    fiber: { achieved: 0, target: 25 },
    sugar: { achieved: 0, target: 50 },
    sodium: { achieved: 0, target: 2300 },
    potassium: { achieved: 0, target: 3500 },
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
    topDeficiencies: [],
    topAdequate: [],
    recommendations: []
  }
};
const defaultTodayLog = { date: '', foods: [], exercises: [], neatActivities: [], waterIntake: 0 };
const defaultSuggestion = { positiveFood: [], positiveExercise: [], cautionFood: [] };

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const dataContext = useData();
  
  const userGoals = dataContext?.userGoals || defaultGoals;
  const dailyProgress = dataContext?.dailyProgress || defaultProgress;
  const updateGoals = dataContext?.updateGoals || (() => {});
  const todayLog = dataContext?.todayLog || defaultTodayLog;
  const dailyLogs = dataContext?.dailyLogs || [];
  const updateFood = dataContext?.updateFood || (() => {});
  const deleteFood = dataContext?.deleteFood || (() => {});
  const updateExercise = dataContext?.updateExercise || (() => {});
  const deleteExercise = dataContext?.deleteExercise || (() => {});
  const aiSuggestion = dataContext?.aiSuggestion || defaultSuggestion;
  const isLoadingSuggestion = dataContext?.isLoadingSuggestion || false;
  const weightLog = dataContext?.weightLog || [];
  const addNeatActivity = dataContext?.addNeatActivity || (() => {});
  const updateNeatActivity = dataContext?.updateNeatActivity || (() => {});
  const removeNeatActivity = dataContext?.removeNeatActivity || (() => {});
  const addWater = dataContext?.addWater || (() => {});
  const addWeightLog = dataContext?.addWeightLog || (() => {});

  const { checkAchievements } = useAchievements();

  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);

  // Check achievements when daily logs change
  useEffect(() => {
    if (dailyLogs && dailyLogs.length > 0 && userGoals) {
      checkAchievements(dailyLogs, userGoals);
    }
  }, [dailyLogs, userGoals, checkAchievements]);

  if (!user) return null;

  const currentWeight =
    weightLog.length > 0 ? weightLog[weightLog.length - 1].weight : user.weight;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
          Welcome back, <span className="text-emerald-500">{user.lastName}</span>!
        </h2>
        <button
          onClick={() => setIsGoalsModalOpen(true)}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
        >
          <TargetIcon />
          <span>Set Goals</span>
        </button>
      </div>

      <TargetCard progress={dailyProgress} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CalorieBreakdown progress={dailyProgress} />
        <WeightProgress
          currentWeight={currentWeight}
          targetWeight={userGoals.targetWeight || user.weight}
          startWeight={user.startWeight || user.weight}
          weightLog={weightLog}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LogInput />
          <SuggestionCard />
          <NeatLogger
            loggedActivities={todayLog.neatActivities || []}
            onAddActivity={addNeatActivity}
            onUpdateActivity={updateNeatActivity}
            onRemoveActivity={removeNeatActivity}
          />
          <LogList
            todayLog={todayLog}
            onUpdateFood={updateFood}
            onDeleteFood={deleteFood}
            onUpdateExercise={updateExercise}
            onDeleteExercise={deleteExercise}
          />
        </div>
        <div className="lg:col-span-1 space-y-6">
          {/* Daily Insights - Builder Pattern */}
          <DailyInsights />
          {/* Achievement Widget - Gamification Feature */}
          <AchievementWidget />
          <WaterTracker />
          <WeightProjectionChart
            weightLog={weightLog}
            startWeight={user.startWeight || user.weight}
            targetWeight={userGoals.targetWeight || user.weight}
            goalTimeline={userGoals.goalTimeline || 0}
          />
          <HistoryChart dailyLogs={dailyLogs} />
          <BMIStatus weight={currentWeight} height={user.height} />
        </div>
      </div>

      <GoalSettingsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        currentGoals={userGoals}
        onSave={updateGoals}
      />
    </div>
  );
};

export default Dashboard;
