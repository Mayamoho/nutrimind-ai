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

    if (bmi < 18.5) {
        status = 'Underweight';
        statusColorClass = 'text-blue-500';
        bgColorClass = 'bg-blue-100 dark:bg-blue-900/30';
    } else if (bmi >= 18.5 && bmi < 25) {
        status = 'Normal weight';
        statusColorClass = 'text-emerald-500';
        bgColorClass = 'bg-emerald-100 dark:bg-emerald-900/30';
    } else if (bmi >= 25 && bmi < 30) {
        status = 'Overweight';
        statusColorClass = 'text-yellow-500';
        bgColorClass = 'bg-yellow-100 dark:bg-yellow-900/30';
    } else {
        status = 'Obese';
        statusColorClass = 'text-red-500';
        bgColorClass = 'bg-red-100 dark:bg-red-900/30';
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
                 <div>
                    <h2 className="text-lg font-bold">Your Health Snapshot</h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Based on your profile, your Body Mass Index (BMI) is <span className="font-bold text-slate-800 dark:text-white">{bmiRounded}</span>.
                    </p>
                 </div>
                <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center ${bgColorClass} ${statusColorClass}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${statusColorClass.replace('text', 'bg')}`}></span>
                    {status}
                </div>
            </div>
        </div>
    );
};

export default BMIStatus;
