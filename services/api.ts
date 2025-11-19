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
      // keep credentials policy default unless caller overrides
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
  addFood: async (foods: FoodLog[]): Promise<{ success: boolean }> => {
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

  // Gemini Proxied Calls
  analyzeFood: async (prompt: string, mealType: MealType, image?: any, schema?: any) => {
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
};
