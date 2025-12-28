/**
 * Daily Insights Component
 * Displays nutrition insights built using the Builder pattern
 */

import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { getInsightsDirector, NutritionInsight, DailyInsightsReport } from '../patterns/InsightsBuilder';
import { getProgressStateMachine, ProgressStateInfo } from '../patterns/ProgressState';

const InsightIcon: React.FC<{ type: NutritionInsight['type'] }> = ({ type }) => {
  switch (type) {
    case 'achievement':
      return <span className="text-lg">🏆</span>;
    case 'positive':
      return <span className="text-lg">✅</span>;
    case 'warning':
      return <span className="text-lg">⚠️</span>;
    case 'info':
      return <span className="text-lg">💡</span>;
    default:
      return null;
  }
};

const InsightCard: React.FC<{ insight: NutritionInsight }> = ({ insight }) => {
  const bgColors = {
    achievement: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
    positive: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    info: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
  };

  const textColors = {
    achievement: 'text-violet-700 dark:text-violet-300',
    positive: 'text-emerald-700 dark:text-emerald-300',
    warning: 'text-amber-700 dark:text-amber-300',
    info: 'text-sky-700 dark:text-sky-300',
  };

  return (
    <div className={`p-3 rounded-lg border ${bgColors[insight.type]}`}>
      <div className="flex items-start gap-2">
        <InsightIcon type={insight.type} />
        <div className="flex-1">
          <h4 className={`font-semibold text-sm ${textColors[insight.type]}`}>
            {insight.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {insight.message}
          </p>
          {insight.value !== undefined && insight.target !== undefined && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>{Math.round(insight.value)}</span>
                <span>/ {Math.round(insight.target)}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    insight.type === 'achievement' ? 'bg-violet-500' :
                    insight.type === 'positive' ? 'bg-emerald-500' :
                    insight.type === 'warning' ? 'bg-amber-500' : 'bg-sky-500'
                  }`}
                  style={{ width: `${Math.min((insight.value / insight.target) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GradeDisplay: React.FC<{ grade: string; score: number }> = ({ grade, score }) => {
  const gradeColors: Record<string, string> = {
    A: 'from-emerald-400 to-emerald-600',
    B: 'from-sky-400 to-sky-600',
    C: 'from-amber-400 to-amber-600',
    D: 'from-orange-400 to-orange-600',
    F: 'from-red-400 to-red-600',
  };

  const gradeMessages: Record<string, string> = {
    A: 'Excellent! Keep it up!',
    B: 'Good progress today!',
    C: 'Room for improvement',
    D: 'Needs attention',
    F: 'Let\'s get back on track',
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradeColors[grade]} flex items-center justify-center shadow-lg`}>
        <span className="text-2xl font-bold text-white">{grade}</span>
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Daily Score</p>
        <p className="text-xl font-bold text-slate-800 dark:text-white">{score}/100</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{gradeMessages[grade]}</p>
      </div>
    </div>
  );
};

const ProgressStateDisplay: React.FC<{ stateInfo: ProgressStateInfo }> = ({ stateInfo }) => {
  const stateColors: Record<string, string> = {
    slate: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
    sky: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  };

  return (
    <div className={`p-4 rounded-xl ${stateColors[stateInfo.color]}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{stateInfo.icon}</span>
        <div>
          <p className="font-semibold">{stateInfo.message}</p>
          <p className="text-sm opacity-80">{stateInfo.encouragement}</p>
        </div>
      </div>
      <p className="text-xs mt-2 opacity-70">💡 {stateInfo.nextAction}</p>
    </div>
  );
};

const MacroBalanceBar: React.FC<{ label: string; percentage: number; color: string; icon: string }> = ({ 
  label, 
  percentage, 
  color,
  icon
}) => {
  const isOver = percentage > 100;
  const displayPercentage = Math.min(percentage, 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
        </div>
        <span className={`text-xs font-bold ${isOver ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
          {percentage}%
        </span>
      </div>
      <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${isOver ? 'bg-amber-500' : color}`}
          style={{ width: `${displayPercentage}%` }}
        />
      </div>
    </div>
  );
};

const DailyInsights: React.FC = () => {
  const { dailyProgress, todayLog, userGoals, weightLog, dailyLogs, currentStreak } = useData();
  const [showAllInsights, setShowAllInsights] = useState(false);

  const insightsReport = useMemo<DailyInsightsReport>(() => {
    const director = getInsightsDirector();
    return director.buildDailyReport(
      dailyProgress,
      todayLog,
      userGoals,
      weightLog,
      dailyLogs
    );
  }, [dailyProgress, todayLog, userGoals, weightLog, dailyLogs]);

  const progressState = useMemo<ProgressStateInfo>(() => {
    const stateMachine = getProgressStateMachine();
    return stateMachine.evaluateProgress(dailyProgress, todayLog);
  }, [dailyProgress, todayLog]);

  const motivation = useMemo(() => {
    const stateMachine = getProgressStateMachine();
    return stateMachine.getTimeBasedMotivation(dailyProgress);
  }, [dailyProgress]);

  // Get insights to display
  const displayInsights = showAllInsights ? insightsReport.insights : insightsReport.insights.slice(0, 3);

  // Calculate quick stats
  const caloriePercentage = dailyProgress.goalCalories > 0 
    ? Math.round((dailyProgress.calories.achieved / dailyProgress.goalCalories) * 100) 
    : 0;
  const waterPercentage = dailyProgress.waterTarget > 0 
    ? Math.round(((todayLog.waterIntake || 0) / dailyProgress.waterTarget) * 100) 
    : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Daily Insights</h2>
              <p className="text-white/70 text-xs">Your nutrition analysis</p>
            </div>
          </div>
          <GradeDisplay grade={insightsReport.grade} score={insightsReport.overallScore} />
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Calories</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{caloriePercentage}%</p>
          </div>
          <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-sky-600 dark:text-sky-400">Water</p>
            <p className="text-lg font-bold text-sky-700 dark:text-sky-300">{waterPercentage}%</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-orange-600 dark:text-orange-400">Streak</p>
            <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{currentStreak}🔥</p>
          </div>
        </div>

        {/* Progress State */}
        <ProgressStateDisplay stateInfo={progressState} />

        {/* Time-based Motivation */}
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-3">
          <p className="text-sm text-violet-700 dark:text-violet-300">
            ✨ {motivation}
          </p>
        </div>

        {/* Macro Balance Overview */}
        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <span>🥗</span> Macro Balance
          </h3>
          <div className="space-y-3">
            <MacroBalanceBar 
              label="Protein" 
              percentage={insightsReport.macroBalance.protein} 
              color="bg-sky-500"
              icon="🥩"
            />
            <MacroBalanceBar 
              label="Carbs" 
              percentage={insightsReport.macroBalance.carbs} 
              color="bg-orange-500"
              icon="🍞"
            />
            <MacroBalanceBar 
              label="Fat" 
              percentage={insightsReport.macroBalance.fat} 
              color="bg-violet-500"
              icon="🥑"
            />
          </div>
        </div>

        {/* Key Insights */}
        {displayInsights.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <span>🎯</span> Key Insights
            </h3>
            <div className="space-y-2">
              {displayInsights.map((insight, index) => (
                <InsightCard key={`${insight.category}-${index}`} insight={insight} />
              ))}
            </div>
            {insightsReport.insights.length > 3 && (
              <button
                onClick={() => setShowAllInsights(!showAllInsights)}
                className="w-full mt-2 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
              >
                {showAllInsights ? 'Show Less' : `Show ${insightsReport.insights.length - 3} More`}
              </button>
            )}
          </div>
        )}

        {/* Primary Focus */}
        {insightsReport.primaryFocus && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Today's Focus</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
                  {insightsReport.primaryFocus}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyInsights;
