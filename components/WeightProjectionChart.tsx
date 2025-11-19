import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WeightLog } from '../types';

interface WeightProjectionChartProps {
    weightLog: WeightLog[];
    startWeight: number;
    targetWeight: number;
    goalTimeline: number; // in weeks
}

const WeightProjectionChart: React.FC<WeightProjectionChartProps> = ({ weightLog, startWeight, targetWeight, goalTimeline }) => {
    
    const formatData = () => {
        if (weightLog.length < 1 || goalTimeline <= 0) return [];
        
        const sortedLogs = [...weightLog].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const firstLogDate = new Date(sortedLogs[0].date);
        
        const projectionEndDate = new Date(firstLogDate);
        projectionEndDate.setDate(projectionEndDate.getDate() + goalTimeline * 7);

        const chartData = sortedLogs.map(log => ({
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
                <h2 className="text-xl font-bold mb-4">Weight Projection</h2>
                <div className="flex-grow flex items-center justify-center text-center">
                    <p className="text-slate-500 dark:text-slate-400">Log your weight and set a goal timeframe to see your projection chart.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg h-80">
            <h2 className="text-xl font-bold mb-4">Weight Projection</h2>
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