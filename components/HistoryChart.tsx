import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DailyLog } from '../types';
import { getEffectiveDate } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';

interface HistoryChartProps {
    dailyLogs: DailyLog[];
}

const HistoryChart: React.FC<HistoryChartProps> = ({ dailyLogs }) => {
    const { user } = useAuth();
    
    // Calculate BMR for total burn calculation
    const calculateBMR = (): number => {
        if (!user) return 1600;
        const { weight = 70, height = 170, age = 30, gender = 'female' } = user;
        const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);
        return Math.round(bmr);
    };

    const bmr = calculateBMR();

    const processData = (logs: DailyLog[]) => {
        // Deduplicate logs by date first
        const uniqueLogsMap = new Map<string, DailyLog>();
        logs.forEach(log => {
            const dateKey = typeof log.date === 'string' ? log.date : new Date(log.date).toISOString().split('T')[0];
            if (!uniqueLogsMap.has(dateKey)) {
                uniqueLogsMap.set(dateKey, log);
            }
        });
        
        // Get effective today (using 6 AM boundary)
        const effectiveToday = getEffectiveDate();
        
        // Get last 7 days including today (effective date)
        const sortedLogs = Array.from(uniqueLogsMap.values())
            .filter(log => log.date <= effectiveToday)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const last7DaysLogs = sortedLogs.slice(-7);

        return last7DaysLogs.map(log => {
            const date = new Date(log.date);
            const userTimezoneOffset = date.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

            const caloriesIn = (log.foods || []).reduce((sum, food) => sum + (food.calories || 0), 0);
            const exerciseBurn = (log.exercises || []).reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0);
            const neatBurn = (log.neatActivities || []).reduce((sum, a) => sum + (a.calories || 0), 0);
            const tef = Math.round(caloriesIn * 0.1); // Thermic Effect of Food
            
            // Total burn = BMR + Exercise + NEAT + TEF
            const totalBurn = bmr + exerciseBurn + neatBurn + tef;

            return {
                name: adjustedDate.toLocaleDateString('en-US', { weekday: 'short' }),
                Intake: caloriesIn,
                Burned: totalBurn,
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
                        formatter={(value: number, name: string) => [
                            `${Math.round(value)} kcal`,
                            name === 'Burned' ? 'Total Burn (BMR+EAT+NEAT+TEF)' : name
                        ]}
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
