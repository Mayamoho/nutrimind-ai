import React from 'react';

interface BMIStatusProps {
    weight: number; // kg
    height: number; // cm
}

const BMIStatus: React.FC<BMIStatusProps> = ({ weight, height }) => {
    if (!weight || !height || height <= 0) {
        return null; // Don't render if data is missing or invalid
    }

    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    const bmiRounded = bmi.toFixed(1);

    let status = '';
    let statusColorClass = '';
    let bgColorClass = '';
    let advice = '';
    let icon = '';

    if (bmi < 18.5) {
        status = 'Underweight';
        statusColorClass = 'text-blue-500';
        bgColorClass = 'bg-blue-100 dark:bg-blue-900/30';
        advice = 'Consider increasing calorie intake with nutrient-dense foods.';
        icon = '💙';
    } else if (bmi >= 18.5 && bmi < 25) {
        status = 'Normal weight';
        statusColorClass = 'text-emerald-500';
        bgColorClass = 'bg-emerald-100 dark:bg-emerald-900/30';
        advice = 'Great job! Maintain your healthy lifestyle.';
        icon = '💚';
    } else if (bmi >= 25 && bmi < 30) {
        status = 'Overweight';
        statusColorClass = 'text-yellow-500';
        bgColorClass = 'bg-yellow-100 dark:bg-yellow-900/30';
        advice = 'Focus on balanced nutrition and regular exercise.';
        icon = '💛';
    } else {
        status = 'Obese';
        statusColorClass = 'text-red-500';
        bgColorClass = 'bg-red-100 dark:bg-red-900/30';
        advice = 'Consult a healthcare provider for personalized guidance.';
        icon = '❤️';
    }

    // Calculate ideal weight range
    const idealWeightMin = (18.5 * heightInMeters * heightInMeters).toFixed(1);
    const idealWeightMax = (24.9 * heightInMeters * heightInMeters).toFixed(1);

    // BMI scale position (0-100%)
    const bmiPosition = Math.min(Math.max(((bmi - 15) / 25) * 100, 0), 100);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-2xl">🏥</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Health Snapshot</h2>
                        <p className="text-white/70 text-xs">Your body metrics overview</p>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* BMI Display */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Body Mass Index</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-slate-800 dark:text-white">{bmiRounded}</span>
                            <span className="text-sm text-slate-500">kg/m²</span>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${bgColorClass} ${statusColorClass}`}>
                        <span>{icon}</span>
                        {status}
                    </div>
                </div>

                {/* BMI Scale */}
                <div className="space-y-2">
                    <div className="relative h-3 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 via-emerald-400 via-yellow-400 to-red-400">
                        <div 
                            className="absolute top-0 w-3 h-3 bg-white border-2 border-slate-800 rounded-full transform -translate-x-1/2 shadow-lg"
                            style={{ left: `${bmiPosition}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>15</span>
                        <span>18.5</span>
                        <span>25</span>
                        <span>30</span>
                        <span>40</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Current Weight</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">{weight} kg</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Height</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">{height} cm</p>
                    </div>
                </div>

                {/* Ideal Weight Range */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">🎯</span>
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Ideal Weight Range</p>
                    </div>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-300">
                        {idealWeightMin} - {idealWeightMax} kg
                    </p>
                </div>

                {/* Advice */}
                <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        💡 {advice}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BMIStatus;
