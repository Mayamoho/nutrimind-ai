import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WeightLog } from '../types';

interface WeightProjectionChartProps {
    weightLog: WeightLog[];
    startWeight: number;
    targetWeight: number;
    goalTimeline: number; // in weeks
}

type WeightPeriod = '1' | '3' | '7' | '30' | 'lifetime';

const WeightProjectionChart: React.FC<WeightProjectionChartProps> = ({ weightLog, startWeight, targetWeight, goalTimeline }) => {
    const [period, setPeriod] = useState<WeightPeriod>('7');
    
    const formatData = () => {
        if (weightLog.length < 1 || goalTimeline <= 0) return [];
        
        const sortedLogs = [...weightLog].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Filter logs based on period
        let filteredLogs = sortedLogs;
        if (period !== 'lifetime') {
            const days = parseInt(period);
            filteredLogs = sortedLogs.slice(-days);
        }
        
        if (filteredLogs.length === 0) return [];
        
        const firstLogDate = new Date(filteredLogs[0].date);
        
        const projectionEndDate = new Date(firstLogDate);
        projectionEndDate.setDate(projectionEndDate.getDate() + goalTimeline * 7);

        const chartData: Array<{date: string, 'Your Weight': number | null, 'Goal Path': number | null}> = filteredLogs.map(log => ({
            date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            'Your Weight': log.weight,
            'Goal Path': null,
        }));

        // Set the start point of the goal path, aligned with the user's official start weight
        chartData[0]['Goal Path'] = startWeight;

        // Add the end point for the goal path projection
        chartData.push({
            date: projectionEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            'Your Weight': null,
            'Goal Path': targetWeight,
        });

        return chartData;
    }

    const data = formatData();

    if (data.length < 2) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg h-80 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Weight Projection</h2>
                </div>
                <div className="flex-grow flex items-center justify-center text-center">
                    <p className="text-slate-500 dark:text-slate-400">Weight is calculated automatically based on your daily calorie balance.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg h-80">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Weight Projection</h2>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as WeightPeriod)}
                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white text-sm font-medium border-none focus:ring-2 focus:ring-violet-500"
                >
                    <option value="1">Last Day</option>
                    <option value="3">Last 3 Days</option>
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="lifetime">Lifetime</option>
                </select>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
                    <XAxis dataKey="date" tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                    <YAxis 
                        tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} 
                        domain={['dataMin - 2', 'dataMax + 2']}
                        allowDataOverflow={true}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(51, 65, 85, 0.8)',
                            borderColor: 'rgba(100, 116, 139, 0.5)',
                            borderRadius: '0.75rem'
                        }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{paddingTop: '20px'}}/>
                    <Line type="monotone" dataKey="Your Weight" stroke="#10b981" strokeWidth={2} connectNulls={false} />
                    <Line type="monotone" dataKey="Goal Path" stroke="#8884d8" strokeWidth={2} strokeDasharray="5 5" connectNulls={true} dot={false}/>
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default WeightProjectionChart;