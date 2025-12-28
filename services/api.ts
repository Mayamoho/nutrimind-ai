// import { User, UserGoals, FoodLog, ExerciseLog, NeatLog, UserData, MealType } from '../types';

// const API_BASE_URL = 'http://localhost:3001/api';

// // Helper function to handle API responses
// const handleResponse = async (response: Response) => {
//     if (!response.ok) {
//         const errorData = await response.json().catch(() => ({ msg: response.statusText }));
//         throw new Error(errorData.msg || 'An unknown API error occurred');
//     }
//     // Handle cases where the response might be empty (e.g., DELETE)
//     const contentType = response.headers.get('content-type');
//     if (contentType && contentType.indexOf('application/json') !== -1) {
//         return response.json();
//     }
//     return { success: true }; // Return a generic success object for non-JSON responses
// };


// // Helper for making authenticated requests
// const authFetch = async (url: string, options: RequestInit = {}) => {
//     const token = localStorage.getItem('nutrimind_token');
//     const headers: HeadersInit = {
//         'Content-Type': 'application/json',
//         ...options.headers,
//     };
//     if (token) {
//         headers['Authorization'] = `Bearer ${token}`;
//     }

//     const response = await fetch(`${API_BASE_URL}${url}`, {
//         ...options,
//         headers,
//     });

//     return handleResponse(response);
// };

// export const api = {
//     // Auth
//     login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
//         const response = await fetch(`${API_BASE_URL}/auth/login`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ email, password }),
//         });
//         return handleResponse(response);
//     },

//     signup: async (userData: any): Promise<{ token: string; user: User }> => {
//         const response = await fetch(`${API_BASE_URL}/auth/register`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(userData),
//         });
//         return handleResponse(response);
//     },

//     // Data
//     getUserData: async (): Promise<UserData> => {
//         return authFetch('/data/user');
//     },

//     updateGoals: async (goals: UserGoals): Promise<UserGoals> => {
//         return authFetch('/data/goals', {
//             method: 'PUT',
//             body: JSON.stringify(goals),
//         });
//     },

//     // Search
//     searchFoods: async (query: string): Promise<Omit<FoodLog, 'id' | 'timestamp' | 'mealType'>[]> => {
//         return authFetch(`/data/search/foods?q=${encodeURIComponent(query)}`);
//     },

//     searchExercises: async (query: string): Promise<Omit<ExerciseLog, 'id' | 'timestamp'>[]> => {
//         return authFetch(`/data/search/exercises?q=${encodeURIComponent(query)}`);
//     },

//     // Log
//     addFood: async (foods: FoodLog[]): Promise<{ success: boolean }> => {
//         return authFetch('/data/food', {
//             method: 'POST',
//             body: JSON.stringify({ foods }),
//         });
//     },

//     updateFood: async (id: string, data: { name: string; calories: number; }): Promise<{ success: boolean }> => {
//         return authFetch(`/data/food/${id}`, {
//             method: 'PUT',
//             body: JSON.stringify(data),
//         });
//     },

//     deleteFood: async (id: string): Promise<{ success: boolean }> => {
//         return authFetch(`/data/food/${id}`, {
//             method: 'DELETE',
//         });
//     },

//     addExercise: async (exercise: ExerciseLog): Promise<{ success: boolean }> => {
//         return authFetch('/data/exercise', {
//             method: 'POST',
//             body: JSON.stringify({ exercise }),
//         });
//     },

//     updateExercise: async (id: string, data: { name: string; caloriesBurned: number; }): Promise<{ success: boolean }> => {
//         return authFetch(`/data/exercise/${id}`, {
//             method: 'PUT',
//             body: JSON.stringify(data),
//         });
//     },

//     deleteExercise: async (id: string): Promise<{ success: boolean }> => {
//         return authFetch(`/data/exercise/${id}`, {
//             method: 'DELETE',
//         });
//     },

//     addNeatActivity: async (activity: NeatLog): Promise<{ success: boolean }> => {
//         return authFetch('/data/neat', {
//             method: 'POST',
//             body: JSON.stringify(activity),
//         });
//     },

//     updateNeatActivity: async (id: string, calories: number): Promise<{ success: boolean }> => {
//         return authFetch(`/data/neat/${id}`, {
//             method: 'PUT',
//             body: JSON.stringify({ calories }),
//         });
//     },

//     removeNeatActivity: async (id: string): Promise<{ success: boolean }> => {
//         return authFetch(`/data/neat/${id}`, {
//             method: 'DELETE',
//         });
//     },

//     addWater: async (amount: number): Promise<{ success: boolean }> => {
//         return authFetch('/data/water', {
//             method: 'POST',
//             body: JSON.stringify({ amount }),
//         });
//     },

//     // Gemini Proxied Calls
//     analyzeFood: async (prompt: string, mealType: MealType, image?: any, schema?: any) => {
//         return authFetch('/gemini/analyze-food', {
//             method: 'POST',
//             body: JSON.stringify({ prompt, mealType, image, schema }),
//         });
//     },

//     analyzeExercise: async (prompt: string, image?: any, schema?: any) => {
//         return authFetch('/gemini/analyze-exercise', {
//             method: 'POST',
//             body: JSON.stringify({ prompt, image, schema }),
//         });
//     },

//     getSuggestion: async (prompt: string, schema?: any) => {
//         return authFetch('/gemini/suggestion', {
//             method: 'POST',
//             body: JSON.stringify({ prompt, schema }),
//         });
//     }
// };

// services/api.ts
import { User, UserGoals, FoodLog, ExerciseLog, NeatLog, UserData, MealType } from '../types';

// Use relative base so Vite proxy (dev) or same-origin (prod) works.
// Do NOT hardcode http://localhost:3001 here when using the Vite proxy.
const API_BASE_PREFIX = '/api';

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  // If no content
  if (response.status === 204) return { success: true };

  // Handle unauthorized specially to surface token expiry to frontend
  if (response.status === 401) {
    // Try to parse JSON body for a structured message
    const data = await response.json().catch(() => null);
    const msg = data && (data.msg || data.error || data.message) ? String(data.msg || data.error || data.message) : '';
    const code = data && data.code ? String(data.code) : '';
    // If token expired, remove local token and throw a specific message
    if (code === 'TOKEN_EXPIRED' || /expired/i.test(msg)) {
      try { localStorage.removeItem('nutrimind_token'); } catch (e) {}
      throw new Error('Session expired');
    }
    try { localStorage.removeItem('nutrimind_token'); } catch (e) {}
    throw new Error(msg || 'Unauthorized');
  }

  const contentType = response.headers.get('content-type') || '';

  // Attempt to parse JSON when present
  if (contentType.includes('application/json')) {
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      // If API returned JSON error object with msg or error
      const message = (data && (data.msg || data.error || data.message)) || response.statusText;
      throw new Error(message || `API error ${response.status}`);
    }
    return data;
  }

  // If response is text (error page or plain text)
  const text = await response.text().catch(() => '');
  if (!response.ok) {
    const message = text || response.statusText || `API error ${response.status}`;
    throw new Error(message);
  }

  // If success and no JSON, return generic success
  return { success: true, text };
};

// Helper for making authenticated requests
const authFetch = async (path: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('nutrimind_token') || '';
  // clone headers so we don't mutate caller-provided object reference
  const givenHeaders = options.headers ? { ...(options.headers as Record<string, string>) } : {};
  const headers: Record<string, string> = { ...givenHeaders };

  // Only set JSON content-type if body is present and not a FormData
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_PREFIX}${path}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    return await handleResponse(res);
  } catch (err: any) {
    // Distinguish network-level failure vs other errors
    if (err instanceof TypeError || /failed to fetch/i.test(String(err.message || ''))) {
      // This is typically network down / CORS blocked / server unreachable
      throw new Error('Network error: unable to reach backend. Is the server running and reachable? Check console/network tab.');
    }
    // Re-throw other errors (API error messages)
    throw err;
  }
};

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    try {
      const res = await fetch(`${API_BASE_PREFIX}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return await handleResponse(res);
    } catch (err: any) {
      if (err instanceof TypeError || /failed to fetch/i.test(String(err.message || ''))) {
        throw new Error('Network error: cannot reach authentication server. Make sure backend is running and Vite proxy is configured.');
      }
      throw err;
    }
  },

  signup: async (userData: any): Promise<{ token: string; user: User }> => {
    try {
      const res = await fetch(`${API_BASE_PREFIX}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return await handleResponse(res);
    } catch (err: any) {
      if (err instanceof TypeError || /failed to fetch/i.test(String(err.message || ''))) {
        throw new Error('Network error: cannot reach authentication server. Make sure backend is running and Vite proxy is configured.');
      }
      throw err;
    }
  },

  // Data (authenticated)
  getUserData: async (): Promise<UserData> => {
    return authFetch('/data/user', { method: 'GET' });
  },

  updateGoals: async (goals: UserGoals): Promise<UserGoals> => {
    return authFetch('/data/goals', {
      method: 'PUT',
      body: JSON.stringify(goals),
    });
  },

  // Search
  searchFoods: async (query: string): Promise<Omit<FoodLog, 'id' | 'timestamp' | 'mealType'>[]> => {
    return authFetch(`/data/search/foods?q=${encodeURIComponent(query)}`);
  },

  searchExercises: async (query: string): Promise<Omit<ExerciseLog, 'id' | 'timestamp'>[]> => {
    return authFetch(`/data/search/exercises?q=${encodeURIComponent(query)}`);
  },

  // Log
  addFood: async (foods: Omit<FoodLog, "id" | "timestamp">[]): Promise<{ success: boolean }> => {
    return authFetch('/data/food', {
      method: 'POST',
      body: JSON.stringify({ foods }),
    });
  },

  updateFood: async (id: string, data: { name: string; calories: number }): Promise<{ success: boolean }> => {
    return authFetch(`/data/food/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteFood: async (id: string): Promise<{ success: boolean }> => {
    return authFetch(`/data/food/${id}`, {
      method: 'DELETE',
    });
  },

  addExercise: async (exercise: ExerciseLog): Promise<{ success: boolean }> => {
    return authFetch('/data/exercise', {
      method: 'POST',
      body: JSON.stringify({ exercise }),
    });
  },

  updateExercise: async (id: string, data: { name: string; caloriesBurned: number }): Promise<{ success: boolean }> => {
    return authFetch(`/data/exercise/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteExercise: async (id: string): Promise<{ success: boolean }> => {
    return authFetch(`/data/exercise/${id}`, {
      method: 'DELETE',
    });
  },

  addNeatActivity: async (activity: NeatLog): Promise<{ success: boolean }> => {
    return authFetch('/data/neat', {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  },

  updateNeatActivity: async (id: string, calories: number): Promise<{ success: boolean }> => {
    return authFetch(`/data/neat/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ calories }),
    });
  },

  removeNeatActivity: async (id: string): Promise<{ success: boolean }> => {
    return authFetch(`/data/neat/${id}`, {
      method: 'DELETE',
    });
  },

  addWater: async (amount: number): Promise<{ success: boolean }> => {
    return authFetch('/data/water', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  // Food Analysis - Enhanced with multiple APIs
  analyzeFood: async (prompt: string, mealType: MealType, image?: any, schema?: any) => {
    // Use the backend Gemini API directly
    return authFetch('/gemini/analyze-food', {
      method: 'POST',
      body: JSON.stringify({ prompt, mealType, image, schema }),
    });
  },

  analyzeExercise: async (prompt: string, image?: any, schema?: any) => {
    return authFetch('/gemini/analyze-exercise', {
      method: 'POST',
      body: JSON.stringify({ prompt, image, schema }),
    });
  },

  getSuggestion: async (prompt: string, schema?: any) => {
    return authFetch('/gemini/suggestion', {
      method: 'POST',
      body: JSON.stringify({ prompt, schema }),
    });
  },

  // Planner API (web-scraping based, no Gemini usage)
  getPersonalizedPlan: async (planType: 'daily' | 'weekly' | 'workout', budget: 'budget' | 'economical' | 'moderate' | 'premium' = 'moderate') => {
    return authFetch('/planner/generate', {
      method: 'POST',
      body: JSON.stringify({ planType, budget }),
    });
  },

  // Aggregated Food Search (combines USDA, OpenFoodFacts, FatSecret, MealDB, Spoonacular)
  searchAggregatedFoods: async (query: string, country: string = 'world') => {
    return authFetch('/food/search', {
      method: 'POST',
      body: JSON.stringify({ query, country })
    });
  },

  // Achievement API
  getAchievements: async () => {
    return authFetch('/achievements', { method: 'GET' });
  },

  unlockAchievement: async (achievementId: string, points: number) => {
    return authFetch('/achievements/unlock', {
      method: 'POST',
      body: JSON.stringify({ achievementId, points }),
    });
  },

  updateStreak: async (currentStreak: number, longestStreak: number) => {
    return authFetch('/achievements/streak', {
      method: 'PUT',
      body: JSON.stringify({ currentStreak, longestStreak }),
    });
  },

  syncAchievements: async (data: {
    totalPoints: number;
    currentStreak: number;
    longestStreak: number;
    level: number;
    unlockedAchievements: Array<{ id: string; points: number; unlockedAt?: Date }>;
  }) => {
    return authFetch('/achievements/sync', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Weight Log
  addWeightLog: async (date: string, weight: number): Promise<{ success: boolean }> => {
    return authFetch('/data/weight', {
      method: 'POST',
      body: JSON.stringify({ date, weight }),
    });
  },

  // Insights API
  getTodayInsights: async () => {
    return authFetch('/insights/today', { method: 'GET' });
  },

  getInsightsHistory: async (days: number = 30) => {
    return authFetch(`/insights/history?days=${days}`, { method: 'GET' });
  },

  saveInsights: async (data: {
    date: string;
    overallScore: number;
    grade: string;
    calorieBalance: number;
    proteinPercentage: number;
    carbsPercentage: number;
    fatPercentage: number;
    topAchievement: string | null;
    primaryFocus: string;
    insights: any[];
  }) => {
    return authFetch('/insights', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getInsightsStats: async () => {
    return authFetch('/insights/stats', { method: 'GET' });
  },

  // Leaderboard API
  getLeaderboard: async (sortBy: string = 'totalPoints', search: string = '', limit: number = 50) => {
    const params = new URLSearchParams({ sortBy, search, limit: String(limit) });
    return authFetch(`/leaderboard?${params}`, { method: 'GET' });
  },

  getLeaderboardStats: async () => {
    return authFetch('/leaderboard/stats', { method: 'GET' });
  },

  getUserProfile: async (email: string) => {
    return authFetch(`/leaderboard/profile/${encodeURIComponent(email)}`, { method: 'GET' });
  },

  updateProfile: async (data: { lastName?: string; country?: string; password?: string }) => {
    return authFetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Chatbot (RAG-based)
  sendChatMessage: async (message: string): Promise<{ response: string; context?: any }> => {
    return authFetch('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  // Chat feedback
  sendChatFeedback: async (messageId: string, rating: number, comment?: string): Promise<{ success: boolean }> => {
    return authFetch('/chat/feedback', {
      method: 'POST',
      body: JSON.stringify({ messageId, rating, comment }),
    });
  },

  // Chat history
  getChatHistory: async (): Promise<{ history: any[] }> => {
    return authFetch('/chat/history');
  },

  // Clear chat cache
  clearChatCache: async (): Promise<{ success: boolean }> => {
    return authFetch('/chat/cache', {
      method: 'DELETE',
    });
  },

  // AI Coach - Enhanced with comprehensive suggestions
  getAICoachSuggestions: async (userData?: { user: any, dailyLog: any, userGoals: any, dailyProgress: any }): Promise<any> => {
    try {
      const token = localStorage.getItem('nutrimind_token');
      if (!token) {
        console.error('No authentication token found');
        throw new Error('Not authenticated');
      }

      console.log('Calling backend AI Coach service with token:', token ? 'Token present' : 'No token');
      
      const response = await fetch('/api/aicoach/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        // Token might be expired or invalid
        const errorData = await response.json().catch(() => ({}));
        console.error('Authentication failed:', errorData.msg || 'Invalid or expired token');
        // You might want to trigger a logout or token refresh here
        throw new Error(errorData.msg || 'Authentication failed');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Backend AI Coach error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Backend AI Coach result:', result);
      return result;
      
    } catch (error) {
      console.error('Backend AI Coach failed, using rule-based fallback:', (error as Error).message);
      // Use local rule-based system as fallback
      const { generateRuleBasedSuggestions } = await import('./geminiService');
      
      // Use provided data or defaults
      const user = userData?.user || {
        email: 'current-user',
        weight: 70,
        height: 175,
        age: 30,
        gender: 'female',
        country: 'United States of America'
      };
      
      const dailyLog = userData?.dailyLog || {
        foods: [],
        exercises: [],
        neatActivities: [],
        waterIntake: 0
      };
      
      const userGoals = userData?.userGoals || {
        targetWeight: 70,
        weightGoal: 'maintain',
        goalTimeline: 12
      };
      
      const dailyProgress = userData?.dailyProgress || {
        calories: { achieved: 0, eat: 0 },
        protein: 0,
        carbs: 0,
        fat: 0,
        bmr: 1600,
        neat: 0,
        tef: 0,
        totalCaloriesOut: 1600,
        netCalories: -1600,
        goalCalories: 2000,
        proteinTarget: 56,
        carbTarget: 250,
        fatTarget: 65,
        waterTarget: 2500
      };
      
      const suggestions = generateRuleBasedSuggestions(user, dailyLog, userGoals, dailyProgress);
      return suggestions;
    }
  },

  // AI Coach - Detailed Analysis
  getDetailedAnalysis: async (): Promise<any> => {
    try {
      const token = localStorage.getItem('nutrimind_token');
      if (!token) {
        console.error('No authentication token found');
        throw new Error('Not authenticated');
      }

      console.log('Calling backend detailed analysis service with token:', token ? 'Token present' : 'No token');
      
      const response = await fetch('/api/aicoach/detailed-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Authentication failed:', errorData.msg || 'Invalid or expired token');
        throw new Error(errorData.msg || 'Authentication failed');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Backend detailed analysis error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Backend detailed analysis result:', result);
      return result;
      
    } catch (error) {
      console.error('Backend detailed analysis failed:', (error as Error).message);
      throw error;
    }
  },

  // Planner - returns meal plan with economic classes
  getDailyMealPlan: async (): Promise<any> => {
    return authFetch('/planner/daily', {
      method: 'POST',
    });
  },

  getWeeklyMealPlan: async (): Promise<any> => {
    return authFetch('/planner/weekly', {
      method: 'POST',
    });
  },

  getWorkoutPlan: async (): Promise<{ workouts: any[]; tips: string[] }> => {
    return authFetch('/planner/workout', {
      method: 'POST',
    });
  },

  // Analytics API
  getAnalyticsUserStats(days: number = 30): Promise<any> {
    return authFetch(`/analytics/user-stats?days=${days}`, {
      method: 'GET',
    });
  },

  getAnalyticsComparison(days: number = 30): Promise<any> {
    return authFetch(`/analytics/comparison?days=${days}`, {
      method: 'GET',
    });
  },

  getAnalyticsTrends(): Promise<any> {
    return authFetch('/analytics/trends', {
      method: 'GET',
    });
  },

  // Notifications API
  getNotifications(limit: number = 50): Promise<any[]> {
    return authFetch(`/notifications/history?limit=${limit}`);
  },

  getPendingNotifications(): Promise<any[]> {
    return authFetch('/notifications/pending?limit=20');
  },

  dismissNotification(id: number): Promise<any> {
    return authFetch(`/notifications/${id}/dismiss`, {
      method: 'PUT',
    });
  },

  updateNotificationSettings(settings: any): Promise<any> {
    return authFetch('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  createTestNotification(type?: string, title?: string, message?: string): Promise<any> {
    return authFetch('/notifications/test', {
      method: 'POST',
      body: JSON.stringify({ type, title, message }),
    });
  },

  getNotificationSettings(): Promise<any> {
    return authFetch('/notifications/settings');
  },

  // FatSecret API - Food Search & Nutrition
  fatSecretSearch: async (query: string, limit: number = 20) => {
    return authFetch(`/fatsecret/search?q=${encodeURIComponent(query)}&limit=${limit}`, { method: 'GET' });
  },

  fatSecretGetFood: async (foodId: string) => {
    return authFetch(`/fatsecret/food/${foodId}`, { method: 'GET' });
  },

  fatSecretAnalyze: async (text: string, mealType: string) => {
    return authFetch('/fatsecret/analyze', {
      method: 'POST',
      body: JSON.stringify({ text, mealType }),
    });
  },

  fatSecretLogFood: async (foodId: string, servingId: string, quantity: number, mealType: string) => {
    return authFetch('/fatsecret/log-food', {
      method: 'POST',
      body: JSON.stringify({ foodId, servingId, quantity, mealType }),
    });
  },

  // Generic HTTP methods for direct API access
  get: async (path: string) => {
    return authFetch(path, { method: 'GET' });
  },

  post: async (path: string, data?: any) => {
    return authFetch(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put: async (path: string, data?: any) => {
    return authFetch(path, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete: async (path: string) => {
    return authFetch(path, { method: 'DELETE' });
  },
};
