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
    microNutrients: {
        fiber: { achieved: number; target: number };
        sugar: { achieved: number; target: number };
        sodium: { achieved: number; target: number };
        potassium: { achieved: number; target: number };
        vitaminA: { achieved: number; target: number };
        vitaminC: { achieved: number; target: number };
        vitaminD: { achieved: number; target: number };
        calcium: { achieved: number; target: number };
        iron: { achieved: number; target: number };
        magnesium: { achieved: number; target: number };
        zinc: { achieved: number; target: number };
        cholesterol: { achieved: number; target: number };
    };
    microNutrientStatus: {
        overallScore: number;
        topDeficiencies: string[];
        topAdequate: string[];
        recommendations: string[];
    };
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
    immediateAction?: string;
    nextMealSuggestion?: {
        meal: string;
        options: { name: string; calories: number; protein: number; reason: string }[];
    };
    hydrationTip?: string;
    motivationalMessage?: string;
    progressAnalysis?: {
        calorieStatus: string;
        proteinStatus: string;
        overallGrade: string;
        feedback: string;
        mealPlan?: {
            breakfast?: string;
            lunch?: string;
            dinner?: string;
            snacks?: string;
        };
        hydrationTip?: string;
        nextSteps?: string;
        whyEatThis?: string[];
        whyAvoidThat?: string[];
        problematicFoods?: string[];
        goodFoods?: string[];
        nutritionalIssues?: string[];
        nutritionalInsights?: any;
    };
    profile?: {
        economicClass: string;
        budgetLabel: string;
        country: string;
        goal: string;
    };
    progress?: {
        caloriesConsumed: number;
        caloriesRemaining: number;
        goalCalories: number;
        proteinConsumed: number;
        proteinRemaining: number;
        proteinTarget: number;
        percentComplete: number;
    };
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

// Leaderboard Types
export interface LeaderboardUser {
    rank: number;
    email: string;
    username: string;
    country: string;
    totalPoints: number;
    level: number;
    totalCaloriesIn: number;
    totalCaloriesBurned: number;
    totalWaterIntake: number;
    totalFoods: number;
    totalExercises: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    bestStreak: number;
    totalNeat: number;
    uniqueFoodTypes: number;
    uniqueExerciseTypes: number;
    isCurrentUser: boolean;
}

export interface LeaderboardData {
    leaderboard: LeaderboardUser[];
    currentUser: LeaderboardUser | null;
    totalUsers: number;
    sortBy: string;
}

export interface CommunityStats {
    totalUsers: number;
    communityPoints: number;
    totalLogs: number;
    totalFoodEntries: number;
    totalExerciseEntries: number;
    totalWaterIntake: number;
}

export type LeaderboardSortOption = 
    | 'level'
    | 'totalPoints' 
    | 'totalCaloriesIn' 
    | 'totalCaloriesBurned' 
    | 'totalWaterIntake'
    | 'totalFoods'
    | 'totalExercises'
    | 'totalProtein'
    | 'totalCarbs'
    | 'totalFat'
    | 'bestStreak'
    | 'totalNeat'
    | 'challengesCompleted'
    | 'milestonesShared';

// Profile Types
export interface UserProfile {
    user: {
        email: string;
        username: string;
        country: string;
        joinedAt: string;
    };
    stats: {
        totalPoints: number;
        level: number;
        currentStreak: number;
        longestStreak: number;
        totalCaloriesIn: number;
        totalCaloriesBurned: number;
        totalWaterIntake: number;
        totalFoods: number;
        totalExercises: number;
        daysLogged: number;
        uniqueFoodTypes: number;
        uniqueExerciseTypes: number;
        achievementsUnlocked: number;
    };
    topFoods: Array<{ name: string; count: number }>;
    topExercises: Array<{ name: string; count: number }>;
}

// Social Features Types
export interface Friendship {
    id: number;
    requester_email: string;
    addressee_email: string;
    status: 'pending' | 'accepted' | 'declined' | 'blocked';
    created_at: string;
    updated_at: string;
}

export interface Friend {
    friend_email: string;
    last_name: string;
    weight?: number;
    height?: number;
    age?: number;
    gender?: string;
    country?: string;
    joined_date: string;
    friends_since: string;
}

export interface FriendRequest {
    requester_email: string;
    last_name: string;
    weight?: number;
    height?: number;
    age?: number;
    gender?: string;
    country?: string;
    created_at: string;
}

export interface Challenge {
    id: number;
    title: string;
    description?: string;
    challenge_type: 'streak' | 'protein' | 'weight_loss' | 'workout' | 'water' | 'custom';
    duration_days: number;
    target_value?: number;
    reward_points: number;
    is_active: boolean;
    created_by: string;
    creator_name?: string;
    max_participants: number;
    start_date: string;
    end_date: string;
    created_at: string;
    participant_count?: number;
    // User participation fields (from backend join)
    current_progress?: number;
    is_completed?: boolean;
    completed_at?: string;
    joined_at?: string;
    is_joined?: boolean;
}

export interface ChallengeParticipant {
    id: number;
    challenge_id: number;
    participant_email: string;
    joined_at: string;
    current_progress: number;
    is_completed: boolean;
    completed_at?: string;
}

export interface UserChallenge extends Challenge {
    current_progress: number;
    is_completed: boolean;
    completed_at?: string;
    joined_at: string;
}

export interface SocialPost {
    id: number;
    author_email: string;
    author_name: string;
    content: string;
    post_type: 'update' | 'milestone' | 'achievement' | 'challenge_join' | 'challenge_complete';
    metadata?: any;
    likes_count: number;
    comments_count: number;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

export interface PostLike {
    id: number;
    post_id: number;
    user_email: string;
    created_at: string;
}

export interface PostComment {
    id: number;
    post_id: number;
    author_email: string;
    author_name: string;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface Encouragement {
    id: number;
    sender_email: string;
    sender_name: string;
    recipient_email: string;
    message: string;
    encouragement_type: 'general' | 'milestone' | 'streak' | 'goal_achievement';
    metadata?: any;
    is_read: boolean;
    created_at: string;
}

export interface AccountabilityPartnership {
    id: number;
    partner1_email: string;
    partner2_email: string;
    partnership_type: 'general' | 'weight_loss' | 'fitness' | 'nutrition';
    goals: any[];
    check_in_frequency: 'daily' | 'weekly' | 'biweekly';
    is_active: boolean;
    started_at: string;
    partner_name: string;
    partner_email: string;
}

export interface CheckIn {
    id: number;
    partnership_id: number;
    checker_email: string;
    check_in_data: any;
    feedback?: string;
    created_at: string;
}

export interface LiveActivity {
    id: number;
    title: string;
    description?: string;
    activity_type: 'workout' | 'nutrition_workshop' | 'qna' | 'challenge_prep';
    host_email: string;
    host_name?: string;
    scheduled_start: string;
    scheduled_end: string;
    max_participants: number;
    is_active: boolean;
    meeting_link?: string;
    meeting_password?: string;
    metadata?: any;
    created_at: string;
    participant_count?: number;
}

export interface LiveActivityParticipant {
    id: number;
    activity_id: number;
    participant_email: string;
    joined_at?: string;
    left_at?: string;
    is_host: boolean;
}

export interface WeeklySummary {
    id: number;
    user_email: string;
    week_start_date: string;
    summary_data: any;
    is_shared: boolean;
    shared_with: string[];
    created_at: string;
}

export interface MilestoneCelebration {
    id: number;
    user_email: string;
    user_name?: string;
    milestone_type: 'weight_goal' | 'streak' | 'challenge_complete' | 'level_up' | 'personal_record';
    milestone_value?: number;
    description?: string;
    is_shared: boolean;
    shared_with: string[];
    celebration_date: string;
    created_at: string;
}