import React, { useState } from 'react';
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
import CalorieBreakdown from './CalorieBreakdown';
import WeightProjectionChart from './WeightProjectionChart';
import TargetCard from './TargetCard';
import NeatLogger from './NeatLogger';


const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const {
        userGoals,
        dailyProgress,
        updateGoals,
        todayLog,
        dailyLogs,
        addFood,
        addExercise,
        updateFood,
        deleteFood,
        updateExercise,
        aiSuggestion,
        isLoadingSuggestion,
        weightLog,
        addNeatActivity,
        updateNeatActivity,
        removeNeatActivity,
    } = useData();

    const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
    
    if (!user) {
        // This case should ideally not be reached if routing is handled in App.tsx
        return null;
    }

    const currentWeight = weightLog.length > 0 ? weightLog[weightLog.length - 1].weight : user.weight;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
                    Welcome back, <span className="text-emerald-500">{user.email.split('@')[0]}</span>!
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
                    targetWeight={userGoals.targetWeight} 
                    startWeight={user.startWeight}
                    weightLog={weightLog}
                />
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <LogInput />
                    <SuggestionCard suggestion={aiSuggestion} isLoading={isLoadingSuggestion} />
                    <NeatLogger 
                        loggedActivities={todayLog.neatActivities}
                        onAddActivity={addNeatActivity}
                        onUpdateActivity={updateNeatActivity}
                        onRemoveActivity={removeNeatActivity}
                    />
                    <LogList 
                        todayLog={todayLog} 
                        onUpdateFood={updateFood}
                        onDeleteFood={deleteFood}
                        onUpdateExercise={updateExercise}
                    />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <WeightProjectionChart 
                        weightLog={weightLog} 
                        startWeight={user.startWeight || user.weight}
                        targetWeight={userGoals.targetWeight}
                        goalTimeline={userGoals.goalTimeline}
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