// A simple client-side throttle to prevent hitting API rate limits.
let lastApiCallTimestamp = 0;

// The free tier of the Gemini API allows for 15 requests per minute (RPM).
// 60 seconds / 15 requests = 4 seconds per request.
// We'll set the cooldown slightly higher to be safe.
const COOLDOWN_MS = 4100;

/**
 * Checks if an API call can be made based on the cooldown period.
 * @returns An object indicating if the call can proceed and a user-friendly message.
 */
export const checkApiCooldown = (): { canCall: boolean; message: string | null } => {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallTimestamp;

    if (timeSinceLastCall < COOLDOWN_MS) {
        const timeLeft = Math.ceil((COOLDOWN_MS - timeSinceLastCall) / 1000);
        return { 
            canCall: false, 
            message: `You're making requests too quickly. Please wait ${timeLeft} more second(s).`
        };
    }
    return { canCall: true, message: null };
};

/**
 * Records the timestamp of a new API call to reset the cooldown timer.
 */
export const recordApiCall = () => {
    lastApiCallTimestamp = Date.now();
};
