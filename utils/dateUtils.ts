/**
 * Date Utilities
 * Using simple calendar date for consistency across all systems (AI Coach, Daily History, etc.)
 * A day starts at midnight and ends at 11:59:59 PM the same calendar day.
 */

/**
 * Get the "effective date" using simple calendar date for consistency with backend
 */
export const getEffectiveDate = (date: Date = new Date()): string => {
  // Use simple calendar date for consistency with AI Coach
  const dateString = date.toISOString().split('T')[0];
  console.log('Frontend using calendar date:', dateString);
  return dateString;
};

/**
 * Get the effective date as a Date object (at midnight)
 */
export const getEffectiveDateObj = (date: Date = new Date()): Date => {
  const effectiveDateStr = getEffectiveDate(date);
  const effectiveDate = new Date(effectiveDateStr);
  effectiveDate.setHours(0, 0, 0, 0);
  return effectiveDate;
};

/**
 * Check if two dates are the same "effective day" (considering 6 AM boundary)
 */
export const isSameEffectiveDay = (date1: Date, date2: Date): boolean => {
  return getEffectiveDate(date1) === getEffectiveDate(date2);
};

/**
 * Check if a log has activity (food or exercise)
 */
const hasActivity = (log: { foods?: any[]; exercises?: any[] }): boolean => {
  return (log.foods?.length || 0) > 0 || (log.exercises?.length || 0) > 0;
};

/**
 * Get date string for a date that is N days before the given date
 */
const getDateNDaysAgo = (baseDate: Date, daysAgo: number): string => {
  const date = new Date(baseDate);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

/**
 * Calculate CURRENT streak - consecutive days with activity ending at today or yesterday
 * 
 * Rules:
 * - If user logs today, streak includes today
 * - If user hasn't logged today but logged yesterday, streak starts from yesterday
 * - If user missed a day, streak resets to 0 (or starts fresh from the next log)
 * 
 * Example:
 * - User logs on Dec 21, then Dec 23 -> Current streak on Dec 23 = 1 (missed Dec 22)
 * - User logs on Dec 21, Dec 22, Dec 23 -> Current streak on Dec 23 = 3
 */
export const calculateCurrentStreak = (
  dailyLogs: Array<{ date: string; foods?: any[]; exercises?: any[] }>
): number => {
  if (!dailyLogs || dailyLogs.length === 0) return 0;
  
  // Get today's effective date
  const todayEffective = getEffectiveDateObj();
  const todayStr = todayEffective.toISOString().split('T')[0];
  const yesterdayStr = getDateNDaysAgo(todayEffective, 1);
  
  // Create a set of dates that have activity for quick lookup
  const datesWithActivity = new Set<string>();
  dailyLogs.forEach(log => {
    if (hasActivity(log)) {
      datesWithActivity.add(log.date);
    }
  });
  
  if (datesWithActivity.size === 0) return 0;
  
  // Check if user has logged today
  const hasLoggedToday = datesWithActivity.has(todayStr);
  const hasLoggedYesterday = datesWithActivity.has(yesterdayStr);
  
  // If no activity today or yesterday, streak is 0
  if (!hasLoggedToday && !hasLoggedYesterday) {
    return 0;
  }
  
  // Start counting from today if logged today, otherwise from yesterday
  const startDate = hasLoggedToday ? todayEffective : new Date(yesterdayStr);
  startDate.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(startDate);
  
  // Count consecutive days going backwards
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    if (datesWithActivity.has(dateStr)) {
      streak++;
      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      // Gap found, stop counting
      break;
    }
  }
  
  return streak;
};

/**
 * Calculate BEST (longest) streak ever achieved
 * Goes through all logs and finds the longest consecutive sequence
 */
export const calculateBestStreak = (
  dailyLogs: Array<{ date: string; foods?: any[]; exercises?: any[] }>
): number => {
  if (!dailyLogs || dailyLogs.length === 0) return 0;
  
  // Get all dates with activity, sorted ascending
  const datesWithActivity = dailyLogs
    .filter(hasActivity)
    .map(log => log.date)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  if (datesWithActivity.length === 0) return 0;
  if (datesWithActivity.length === 1) return 1;
  
  let bestStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < datesWithActivity.length; i++) {
    const prevDate = new Date(datesWithActivity[i - 1]);
    const currDate = new Date(datesWithActivity[i]);
    
    // Calculate difference in days
    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else if (diffDays === 0) {
      // Same day (duplicate entry), skip
      continue;
    } else {
      // Gap in days, reset streak
      currentStreak = 1;
    }
  }
  
  return bestStreak;
};

/**
 * Legacy function for backward compatibility - returns current streak
 */
export const calculateStreak = (
  dailyLogs: Array<{ date: string; foods?: any[]; exercises?: any[] }>
): number => {
  return calculateCurrentStreak(dailyLogs);
};

/**
 * Get the start of the current "effective day" (6 AM)
 */
export const getEffectiveDayStart = (date: Date = new Date()): Date => {
  const effectiveDateStr = getEffectiveDate(date);
  const dayStart = new Date(effectiveDateStr);
  dayStart.setHours(6, 0, 0, 0);
  return dayStart;
};

/**
 * Get the end of the current "effective day" (5:59:59 AM next calendar day)
 */
export const getEffectiveDayEnd = (date: Date = new Date()): Date => {
  const effectiveDateStr = getEffectiveDate(date);
  const dayEnd = new Date(effectiveDateStr);
  dayEnd.setDate(dayEnd.getDate() + 1);
  dayEnd.setHours(5, 59, 59, 999);
  return dayEnd;
};

/**
 * Format date for display
 */
export const formatDateForDisplay = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Get the time of day based on current hour
 */
export const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};
