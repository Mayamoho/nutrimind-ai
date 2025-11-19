export enum MealType {
    Breakfast = 'Breakfast',
    Lunch = 'Lunch',
    Dinner = 'Dinner',
    Snacks = 'Snacks',
}

export interface NutrientInfo {
    name: string;
    amount: number;
    unit: string;
}

export interface FoodLog {
    id: string;
    name:string;
    calories: number;
    mealType: MealType;
    servingQuantity: number;
    servingUnit: string;
    nutrients: {
        macros: NutrientInfo[];
        micros: NutrientInfo[];
    };
    timestamp: Date;
}

export interface ExerciseLog {
    id: string;
    name: string;
    duration: number; // in minutes
    caloriesBurned: number;
    timestamp: Date;
}

export interface NeatLog {
    id: string;
    name: string;
    calories: number;
}

export interface DailyLog {
    date: string; // YYYY-MM-DD
    foods: FoodLog[];
    exercises: ExerciseLog[];
    neatActivities: NeatLog[];
    waterIntake: number; // in ml
}

export interface DailyProgress {
    calories: {
        achieved: number;
        eat: number; // Exercise Activity Thermogenesis
    };
    protein: number;
    carbs: number;
    fat: number;
    bmr: number;
    neat: number; // Non-Exercise Activity Thermogenesis
    tef: number; // Thermic Effect of Food
    totalCaloriesOut: number; // BMR + NEAT + EAT + TEF
    netCalories: number;
    goalCalories: number;
    proteinTarget: number;
    carbTarget: number;
    fatTarget: number;
    waterTarget: number; // in ml
}

export type Gender = 'male' | 'female' | 'other';
export type WeightGoal = 'lose' | 'maintain' | 'gain';


export interface User {
    email: string;
    lastName: string;
    weight: number; // in kg
    startWeight?: number; // in kg
    height: number; // in cm
    age: number;
    gender: Gender;
    country: string;
}

export interface UserGoals {
    targetWeight: number; // in kg
    weightGoal: WeightGoal;
    goalTimeline: number; // in weeks
}

export interface WeightLog {
    date: string; // YYYY-MM-DD
    weight: number;
}

export interface AISuggestions {
    positiveFood: string[];
    positiveExercise: string[];
    cautionFood: string[];
}

// --- Server/Mock Types ---

// Type for a user stored in the "database", including password
export interface DBUser extends User {
    passwordHash: string;
}

// Type for the entire data structure associated with a user
export interface UserData {
    user: User;
    dailyLogs: DailyLog[];
    userGoals: UserGoals;
    weightLog: WeightLog[];
}