/**
 * Data Analysis Tab
 * Comprehensive data visualization and community comparison
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { api } from '../../services/api';
import { DataAnalyzer, MetricKey, AnalysisResult } from '../../patterns/AnalysisStrategy';

type TimeRange = '7' | '30' | '90';
type ChartView = 'overview' | 'comparison' | 'trends' | 'breakdown' | 'milestones';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const getRemarkColor = (type: AnalysisResult['remarkType']) => {
  const colors = {
    'excellent': 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400',
    'good': 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',
    'average': 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400',
    'needs-improvement': 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400',
    'poor': 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400'
  };
  return colors[type] || colors.average;
};

const getPercentileLabel = (p: number) => {
  if (p >= 90) return { label: 'Top 10%', color: 'text-emerald-500' };
  if (p >= 75) return { label: 'Top 25%', color: 'text-blue-500' };
  if (p >= 50) return { label: 'Above Average', color: 'text-cyan-500' };
  if (p >= 25) return { label: 'Below Average', color: 'text-amber-500' };
  return { label: 'Bottom 25%', color: 'text-red-500' };
};

const DataAnalysisTab: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30');
  const [chartView, setChartView] = useState<ChartView>('overview');
  const [userStats, setUserStats] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [milestones, setMilestones] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const analyzer = useMemo(() => new DataAnalyzer(), []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, compData, trendsData, milestonesData] = await Promise.all([
        api.getAnalyticsUserStats(parseInt(timeRange)),
        api.getAnalyticsComparison(parseInt(timeRange)),
        api.getAnalyticsTrends(),
        api.get('/analytics/progress-milestones')
      ]);
      setUserStats(statsData);
      setComparison(compData);
      setTrends(trendsData);
      setMilestones(milestonesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const analysisResults = useMemo(() => {
    if (!userStats?.averages || !comparison?.comparison) return null;
    
    const userData: Record<MetricKey, number> = {
      calories: userStats.averages.calories,
      protein: userStats.averages.protein,
      carbs: userStats.averages.carbs,
      fat: userStats.averages.fat,
      water: userStats.averages.water,
      exercise: userStats.averages.exercise
    };
    
    const communityData: Record<MetricKey, { avg: number; percentile: number }> = {
      calories: { avg: comparison.comparison.avgCalories?.communityAvg || 0, percentile: comparison.comparison.avgCalories?.percentile || 50 },
      protein: { avg: comparison.comparison.avgProtein?.communityAvg || 0, percentile: comparison.comparison.avgProtein?.percentile || 50 },
      carbs: { avg: comparison.comparison.avgCarbs?.communityAvg || 0, percentile: comparison.comparison.avgCarbs?.percentile || 50 },
      fat: { avg: comparison.comparison.avgFat?.communityAvg || 0, percentile: comparison.comparison.avgFat?.percentile || 50 },
      water: { avg: comparison.comparison.avgWater?.communityAvg || 0, percentile: comparison.comparison.avgWater?.percentile || 50 },
      exercise: { avg: comparison.comparison.avgExercise?.communityAvg || 0, percentile: comparison.comparison.avgExercise?.percentile || 50 }
    };
    
    return analyzer.analyzeAll(userData, communityData);
  }, [userStats, comparison, analyzer]);

  const radarData = useMemo(() => {
    if (!analysisResults) return [];
    return Object.entries(analysisResults).map(([key, result]) => ({
      metric: result.label.replace('Daily ', ''),
      you: result.percentile,
      community: 50
    }));
  }, [analysisResults]);

  const mealPieData = useMemo(() => {
    if (!userStats?.mealTypeBreakdown) return [];
    return Object.entries(userStats.mealTypeBreakdown)
      .filter(([_, val]) => (val as number) > 0)
      .map(([name, value]) => ({ name, value }));
  }, [userStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Analyzing your data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-8 text-center">
        <span className="text-4xl mb-4 block">📊</span>
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <span className="text-3xl">📊</span> Data Analysis
            </h2>
            <p className="text-white/80 mt-1">Deep insights into your nutrition & fitness journey</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="7" className="text-slate-800">Last 7 days</option>
              <option value="30" className="text-slate-800">Last 30 days</option>
              <option value="90" className="text-slate-800">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-2 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: '📈' },
            { id: 'comparison', label: 'Community Comparison', icon: '👥' },
            { id: 'trends', label: 'Trends', icon: '📉' },
            { id: 'breakdown', label: 'Breakdown', icon: '🥧' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setChartView(tab.id as ChartView)}
              className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                chartView === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview View */}
      {chartView === 'overview' && userStats && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {analysisResults && Object.entries(analysisResults).map(([key, result]) => (
              <div key={key} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="text-2xl mb-2">{result.label.includes('Calorie') ? '🔥' : result.label.includes('Protein') ? '🥩' : result.label.includes('Carb') ? '🍞' : result.label.includes('Fat') ? '🥑' : result.label.includes('Water') ? '💧' : '💪'}</div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{result.value.toLocaleString()}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{result.unit}/day avg</p>
                <div className={`mt-2 text-xs px-2 py-1 rounded-full inline-block ${getRemarkColor(result.remarkType)}`}>
                  {getPercentileLabel(result.percentile).label}
                </div>
              </div>
            ))}
          </div>

          {/* Daily Trend Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">📈 Daily Calorie Trend</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userStats.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Line type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={2} dot={false} name="Calories In" />
                  <Line type="monotone" dataKey="exercise" stroke="#3b82f6" strokeWidth={2} dot={false} name="Exercise Burn" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Analysis Remarks */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">💡 Personalized Insights</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {analysisResults && Object.entries(analysisResults).map(([key, result]) => (
                <div key={key} className={`p-4 rounded-lg ${getRemarkColor(result.remarkType)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{result.label}</span>
                    <span className="text-xs opacity-75">({result.value} {result.unit})</span>
                  </div>
                  <p className="text-sm">{result.remark}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Comparison View */}
      {chartView === 'comparison' && comparison && (
        <div className="space-y-6">
          {/* Radar Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">🎯 Your Performance vs Community</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="You" dataKey="you" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                  <Radar name="Community Avg" dataKey="community" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison Bars */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">📊 Detailed Comparison</h3>
            <div className="space-y-6">
              {comparison.comparison && Object.entries(comparison.comparison).map(([key, data]: [string, any]) => {
                const pct = data.percentile || 50;
                const pctInfo = getPercentileLabel(pct);
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{key.replace('avg', '').replace(/([A-Z])/g, ' $1')}</span>
                      <span className={`text-sm font-semibold ${pctInfo.color}`}>{pctInfo.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400 w-16 text-right">{pct}%</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>You: {data.user?.toLocaleString() || 0}</span>
                      <span>Avg: {data.communityAvg?.toLocaleString() || 0}</span>
                      <span>Max: {data.communityMax?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 text-center">
            <p className="text-indigo-700 dark:text-indigo-300">
              <span className="font-semibold">👥 {comparison.totalUsers}</span> users in the community
            </p>
          </div>
        </div>
      )}

      {/* Trends View */}
      {chartView === 'trends' && trends && (
        <div className="space-y-6">
          {/* Insights Summary Cards */}
          {trends.insights && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="text-2xl mb-1">🎯</div>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{trends.insights.calorieConsistency}</p>
                <p className="text-xs text-slate-500">Calorie Consistency</p>
                <p className="text-xs text-slate-400 mt-1">CV: {trends.insights.calorieCV}%</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="text-2xl mb-1">🔥</div>
                <p className="text-lg font-bold text-emerald-600">{trends.insights.bestCalorieDay}</p>
                <p className="text-xs text-slate-500">Highest Intake Day</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="text-2xl mb-1">💪</div>
                <p className="text-lg font-bold text-blue-600">{trends.insights.bestExerciseDay}</p>
                <p className="text-xs text-slate-500">Most Active Day</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="text-2xl mb-1">📅</div>
                <p className="text-lg font-bold text-purple-600">{trends.insights.maxStreak}</p>
                <p className="text-xs text-slate-500">Best Streak (days)</p>
              </div>
            </div>
          )}

          {/* Weekday Pattern - Enhanced */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">📅 Weekday Calorie & Exercise Patterns</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.weekdayAverages}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="avgCalories" fill="#10b981" name="Avg Calories" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="avgExercise" fill="#3b82f6" name="Avg Exercise" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekday Macro Breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">🥗 Weekday Macro Patterns</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.weekdayAverages}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="avgProtein" stackId="macros" fill="#10b981" name="Protein (g)" />
                  <Bar dataKey="avgCarbs" stackId="macros" fill="#3b82f6" name="Carbs (g)" />
                  <Bar dataKey="avgFat" stackId="macros" fill="#f59e0b" name="Fat (g)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekend vs Weekday Comparison */}
          {trends.insights && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">🗓️ Weekend vs Weekday</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-slate-500 mb-2">Weekday Average</p>
                  <p className="text-3xl font-bold text-indigo-600">{trends.insights.weekdayAvg}</p>
                  <p className="text-xs text-slate-400">kcal/day</p>
                </div>
                <div className="text-center flex flex-col justify-center">
                  <div className={`text-lg font-semibold px-4 py-2 rounded-full ${
                    trends.insights.weekendVsWeekday === 'Higher on weekends' 
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : trends.insights.weekendVsWeekday === 'Lower on weekends'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {trends.insights.weekendVsWeekday}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500 mb-2">Weekend Average</p>
                  <p className="text-3xl font-bold text-purple-600">{trends.insights.weekendAvg}</p>
                  <p className="text-xs text-slate-400">kcal/day</p>
                </div>
              </div>
            </div>
          )}

          {/* Weekly Progress - Enhanced */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">📈 Weekly Calorie & Exercise Trends</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="avgCalories" stroke="#10b981" strokeWidth={2} name="Avg Daily Calories" dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="totalExercise" stroke="#f59e0b" strokeWidth={2} name="Total Exercise Burn" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Macro Balance Over Time */}
          {trends.macroBalanceData?.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">⚖️ Daily Macro Balance (%)</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends.macroBalanceData.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => new Date(d).toLocaleDateString('en', { day: 'numeric' })} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Legend />
                    <Bar dataKey="proteinPct" stackId="a" fill="#10b981" name="Protein %" />
                    <Bar dataKey="carbsPct" stackId="a" fill="#3b82f6" name="Carbs %" />
                    <Bar dataKey="fatPct" stackId="a" fill="#f59e0b" name="Fat %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Activity Heatmap Style */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">📊 Logging Activity by Day</h3>
            <div className="grid grid-cols-7 gap-2">
              {trends.weekdayAverages?.map((day: any, i: number) => {
                const intensity = day.daysLogged > 0 ? Math.min(day.daysLogged / 4, 1) : 0;
                return (
                  <div key={i} className="text-center">
                    <p className="text-xs text-slate-500 mb-2">{day.day}</p>
                    <div 
                      className="w-full aspect-square rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: `rgba(16, 185, 129, ${0.2 + intensity * 0.8})` }}
                    >
                      {day.daysLogged}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{day.avgCalories} kcal</p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 text-center mt-4">Days logged per weekday (last 90 days)</p>
          </div>
        </div>
      )}

      {/* Breakdown View */}
      {chartView === 'breakdown' && userStats && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Meal Type Distribution */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">🍽️ Calories by Meal Type</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mealPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {mealPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Macro Distribution */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">🥗 Macro Distribution</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Protein', value: userStats.averages.protein * 4 },
                        { name: 'Carbs', value: userStats.averages.carbs * 4 },
                        { name: 'Fat', value: userStats.averages.fat * 9 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Calorie Range Distribution */}
          {userStats.calorieRanges && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">📊 Food Items by Calorie Range</h3>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { key: 'low', label: 'Light (<200)', color: 'bg-emerald-500', icon: '🥗' },
                  { key: 'medium', label: 'Moderate (200-400)', color: 'bg-blue-500', icon: '🍲' },
                  { key: 'high', label: 'Heavy (400-600)', color: 'bg-amber-500', icon: '🍔' },
                  { key: 'veryHigh', label: 'Very Heavy (>600)', color: 'bg-red-500', icon: '🍕' }
                ].map(range => {
                  const total = Object.values(userStats.calorieRanges).reduce((a: number, b: any) => a + b, 0) as number;
                  const pct = total > 0 ? Math.round((userStats.calorieRanges[range.key] / total) * 100) : 0;
                  return (
                    <div key={range.key} className="text-center">
                      <div className="text-3xl mb-2">{range.icon}</div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-2">
                        <div className={`h-3 rounded-full ${range.color}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xl font-bold text-slate-800 dark:text-white">{userStats.calorieRanges[range.key]}</p>
                      <p className="text-xs text-slate-500">{range.label}</p>
                      <p className="text-xs text-slate-400">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Meal Timing Analysis */}
          {userStats.mealAvgCalories && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">⏰ Average Calories per Meal</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(userStats.mealAvgCalories).map(([name, value]) => ({ name, calories: value }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="calories" fill="#8b5cf6" name="Avg Calories" radius={[4, 4, 0, 0]}>
                      {Object.keys(userStats.mealAvgCalories).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                {Object.entries(userStats.mealTypeCount || {}).map(([meal, count]: [string, any]) => (
                  <div key={meal} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{count}</p>
                    <p className="text-xs text-slate-500">{meal} logged</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* High Protein Foods Analysis */}
          {userStats.foodAnalysis?.highProteinFoods?.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">🥩 High Protein Foods (&gt;30% protein ratio)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-500">Food</th>
                      <th className="text-center py-2 px-3 text-slate-500">Times</th>
                      <th className="text-center py-2 px-3 text-slate-500">Avg Cal</th>
                      <th className="text-center py-2 px-3 text-slate-500">Avg Protein</th>
                      <th className="text-center py-2 px-3 text-slate-500">Protein %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.foodAnalysis.highProteinFoods.map((food: any, i: number) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                        <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">{food.name}</td>
                        <td className="py-2 px-3 text-center">{food.count}x</td>
                        <td className="py-2 px-3 text-center">{food.avgCalories}</td>
                        <td className="py-2 px-3 text-center text-emerald-600 font-semibold">{food.avgProtein}g</td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs">{food.proteinRatio}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* High Calorie Foods Analysis */}
          {userStats.foodAnalysis?.highCalorieFoods?.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">🔥 Highest Calorie Foods</h3>
              <div className="space-y-3">
                {userStats.foodAnalysis.highCalorieFoods.map((food: any, i: number) => {
                  const maxCal = userStats.foodAnalysis.highCalorieFoods[0]?.avgCalories || 1;
                  const pct = Math.round((food.avgCalories / maxCal) * 100);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{food.name}</span>
                        <span className="text-sm text-slate-500">{food.avgCalories} kcal avg</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                          <div className="h-2.5 bg-gradient-to-r from-amber-400 to-red-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 w-12">{food.count}x</span>
                      </div>
                      <div className="flex gap-4 text-xs text-slate-500">
                        <span>P: {food.avgProtein}g</span>
                        <span>C: {food.avgCarbs}g</span>
                        <span>F: {food.avgFat}g</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Food Variety Stats */}
          {userStats.foodAnalysis && (
            <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">🌈 Food Variety Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-emerald-600">{userStats.foodAnalysis.totalUniqueFoods}</p>
                  <p className="text-sm text-slate-500">Unique Foods</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-600">{userStats.foodAnalysis.totalFoodItems}</p>
                  <p className="text-sm text-slate-500">Total Items Logged</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-600">
                    {userStats.foodAnalysis.totalFoodItems > 0 
                      ? (userStats.foodAnalysis.totalFoodItems / userStats.foodAnalysis.totalUniqueFoods).toFixed(1)
                      : 0}
                  </p>
                  <p className="text-sm text-slate-500">Avg Repeats/Food</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-amber-600">
                    {userStats.daysLogged > 0 
                      ? (userStats.foodAnalysis.totalFoodItems / userStats.daysLogged).toFixed(1)
                      : 0}
                  </p>
                  <p className="text-sm text-slate-500">Items/Day</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  💡 <strong>Insight:</strong> {
                    userStats.foodAnalysis.totalUniqueFoods >= 20 
                      ? "Great food variety! Diverse diet helps ensure balanced nutrition."
                      : userStats.foodAnalysis.totalUniqueFoods >= 10
                      ? "Good variety. Consider exploring more food options for better nutrition."
                      : "Limited variety detected. Try adding more diverse foods to your diet."
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataAnalysisTab;
