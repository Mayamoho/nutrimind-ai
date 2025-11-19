
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DailyLog } from '../types';

interface HistoryChartProps {
    dailyLogs: DailyLog[];
}

const HistoryChart: React.FC<HistoryChartProps> = ({ dailyLogs }) => {
    const processData = (logs: DailyLog[]) => {
        // Get last 7 days including today
        const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const last7DaysLogs = sortedLogs.slice(-7);

        return last7DaysLogs.map(log => {
            const date = new Date(log.date);
            // Adjust for timezone offset
            const userTimezoneOffset = date.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

            return {
                name: adjustedDate.toLocaleDateString('en-US', { weekday: 'short' }),
                Intake: log.foods.reduce((sum, food) => sum + food.calories, 0),
                Burned: log.exercises.reduce((sum, ex) => sum + ex.caloriesBurned, 0),
            };
        });
    };

    const data = processData(dailyLogs);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg h-96">
            <h2 className="text-xl font-bold mb-4">Weekly Summary</h2>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgb(100 116 139)' }} />
                    <YAxis tick={{ fill: 'rgb(100 116 139)' }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(51, 65, 85, 0.8)',
                            borderColor: 'rgba(100, 116, 139, 0.5)',
                            borderRadius: '0.75rem'
                        }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{paddingTop: '20px'}}/>
                    <Bar dataKey="Intake" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Burned" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default HistoryChart;
