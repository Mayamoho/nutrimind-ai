// A simple client-side throttle to prevent hitting API rate limits.
// Separate timestamps for different API endpoints
const apiCallTimestamps: Record<string, number> = {
  analyzeFood: 0,
  analyzeExercise: 0,
  suggestion: 0,
};

// Cooldown periods in milliseconds for different endpoints
const COOLDOWNS: Record<string, number> = {
  analyzeFood: 3000,      // 3 seconds for food analysis
  analyzeExercise: 3000,  // 3 seconds for exercise analysis
  suggestion: 1000,       // 1 second for AI coach - allow frequent updates
};

/**
 * Checks if an API call can be made based on the cooldown period.
 * @param endpoint - The API endpoint type ('analyzeFood', 'analyzeExercise', 'suggestion')
 * @returns An object indicating if the call can proceed and a user-friendly message.
 */
export const checkApiCooldown = (endpoint: string = 'suggestion'): { canCall: boolean; message: string | null } => {
    const now = Date.now();
    const lastCall = apiCallTimestamps[endpoint] || 0;
    const cooldown = COOLDOWNS[endpoint] || 1000;
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall < cooldown) {
        const timeLeft = Math.ceil((cooldown - timeSinceLastCall) / 1000);
        return { 
            canCall: false, 
            message: `Please wait ${timeLeft} more second(s).`
        };
    }
    return { canCall: true, message: null };
};

/**
 * Records the timestamp of a new API call to reset the cooldown timer.
 * @param endpoint - The API endpoint type ('analyzeFood', 'analyzeExercise', 'suggestion')
 */
export const recordApiCall = (endpoint: string = 'suggestion') => {
    apiCallTimestamps[endpoint] = Date.now();
};

/**
 * Force reset cooldown for an endpoint (useful after errors)
 */
export const resetCooldown = (endpoint: string = 'suggestion') => {
    apiCallTimestamps[endpoint] = 0;
};
