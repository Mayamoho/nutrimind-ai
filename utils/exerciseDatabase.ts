/**
 * Local Exercise Database
 * Comprehensive list of exercises with calorie burn estimates
 * Calories are estimated for 30 minutes of activity for a 70kg person
 */

export interface ExerciseDatabaseItem {
  name: string;
  category: string;
  caloriesPer30Min: number;
  intensity: 'low' | 'moderate' | 'high' | 'very high';
  description?: string;
}

export const EXERCISE_DATABASE: ExerciseDatabaseItem[] = [
  // Cardio
  { name: 'Walking (casual)', category: 'Cardio', caloriesPer30Min: 100, intensity: 'low', description: '3 mph pace' },
  { name: 'Walking (brisk)', category: 'Cardio', caloriesPer30Min: 150, intensity: 'moderate', description: '4 mph pace' },
  { name: 'Running (jogging)', category: 'Cardio', caloriesPer30Min: 280, intensity: 'high', description: '5 mph pace' },
  { name: 'Running (fast)', category: 'Cardio', caloriesPer30Min: 400, intensity: 'very high', description: '8 mph pace' },
  { name: 'Sprinting', category: 'Cardio', caloriesPer30Min: 500, intensity: 'very high', description: 'Maximum effort' },
  { name: 'Cycling (leisure)', category: 'Cardio', caloriesPer30Min: 145, intensity: 'low', description: '10-12 mph' },
  { name: 'Cycling (moderate)', category: 'Cardio', caloriesPer30Min: 260, intensity: 'moderate', description: '12-14 mph' },
  { name: 'Cycling (vigorous)', category: 'Cardio', caloriesPer30Min: 370, intensity: 'high', description: '14-16 mph' },
  { name: 'Stationary Bike', category: 'Cardio', caloriesPer30Min: 210, intensity: 'moderate' },
  { name: 'Elliptical Trainer', category: 'Cardio', caloriesPer30Min: 270, intensity: 'moderate' },
  { name: 'Stair Climbing', category: 'Cardio', caloriesPer30Min: 300, intensity: 'high' },
  { name: 'Jump Rope', category: 'Cardio', caloriesPer30Min: 340, intensity: 'high' },
  { name: 'Rowing Machine', category: 'Cardio', caloriesPer30Min: 260, intensity: 'moderate' },
  { name: 'Swimming (laps)', category: 'Cardio', caloriesPer30Min: 250, intensity: 'moderate' },
  { name: 'Swimming (freestyle)', category: 'Cardio', caloriesPer30Min: 300, intensity: 'high' },
  { name: 'Treadmill (incline)', category: 'Cardio', caloriesPer30Min: 280, intensity: 'high' },

  // HIIT & Interval Training
  { name: 'HIIT Workout', category: 'HIIT', caloriesPer30Min: 400, intensity: 'very high', description: 'High-intensity intervals' },
  { name: 'Tabata Training', category: 'HIIT', caloriesPer30Min: 380, intensity: 'very high', description: '20s work, 10s rest' },
  { name: 'Circuit Training', category: 'HIIT', caloriesPer30Min: 300, intensity: 'high' },
  { name: 'Burpees', category: 'HIIT', caloriesPer30Min: 350, intensity: 'very high' },
  { name: 'Mountain Climbers', category: 'HIIT', caloriesPer30Min: 280, intensity: 'high' },
  { name: 'Box Jumps', category: 'HIIT', caloriesPer30Min: 320, intensity: 'high' },
  { name: 'Battle Ropes', category: 'HIIT', caloriesPer30Min: 350, intensity: 'very high' },
  { name: 'Kettlebell Swings', category: 'HIIT', caloriesPer30Min: 300, intensity: 'high' },

  // Strength Training
  { name: 'Weight Lifting (general)', category: 'Strength', caloriesPer30Min: 180, intensity: 'moderate' },
  { name: 'Weight Lifting (vigorous)', category: 'Strength', caloriesPer30Min: 250, intensity: 'high' },
  { name: 'Bodyweight Exercises', category: 'Strength', caloriesPer30Min: 170, intensity: 'moderate' },
  { name: 'Push-ups', category: 'Strength', caloriesPer30Min: 200, intensity: 'moderate' },
  { name: 'Pull-ups', category: 'Strength', caloriesPer30Min: 230, intensity: 'high' },
  { name: 'Squats', category: 'Strength', caloriesPer30Min: 190, intensity: 'moderate' },
  { name: 'Deadlifts', category: 'Strength', caloriesPer30Min: 220, intensity: 'high' },
  { name: 'Bench Press', category: 'Strength', caloriesPer30Min: 180, intensity: 'moderate' },
  { name: 'Lunges', category: 'Strength', caloriesPer30Min: 200, intensity: 'moderate' },
  { name: 'Plank', category: 'Strength', caloriesPer30Min: 120, intensity: 'low' },
  { name: 'Resistance Bands', category: 'Strength', caloriesPer30Min: 150, intensity: 'moderate' },
  { name: 'Dumbbell Workout', category: 'Strength', caloriesPer30Min: 200, intensity: 'moderate' },

  // Flexibility & Mind-Body
  { name: 'Yoga (Hatha)', category: 'Flexibility', caloriesPer30Min: 90, intensity: 'low' },
  { name: 'Yoga (Vinyasa)', category: 'Flexibility', caloriesPer30Min: 150, intensity: 'moderate' },
  { name: 'Yoga (Power)', category: 'Flexibility', caloriesPer30Min: 200, intensity: 'moderate' },
  { name: 'Yoga (Hot/Bikram)', category: 'Flexibility', caloriesPer30Min: 230, intensity: 'high' },
  { name: 'Pilates', category: 'Flexibility', caloriesPer30Min: 140, intensity: 'moderate' },
  { name: 'Stretching', category: 'Flexibility', caloriesPer30Min: 70, intensity: 'low' },
  { name: 'Tai Chi', category: 'Flexibility', caloriesPer30Min: 80, intensity: 'low' },
  { name: 'Meditation', category: 'Flexibility', caloriesPer30Min: 30, intensity: 'low' },

  // Sports
  { name: 'Basketball', category: 'Sports', caloriesPer30Min: 290, intensity: 'high' },
  { name: 'Soccer/Football', category: 'Sports', caloriesPer30Min: 280, intensity: 'high' },
  { name: 'Tennis', category: 'Sports', caloriesPer30Min: 260, intensity: 'high' },
  { name: 'Badminton', category: 'Sports', caloriesPer30Min: 200, intensity: 'moderate' },
  { name: 'Table Tennis', category: 'Sports', caloriesPer30Min: 130, intensity: 'moderate' },
  { name: 'Volleyball', category: 'Sports', caloriesPer30Min: 180, intensity: 'moderate' },
  { name: 'Golf (walking)', category: 'Sports', caloriesPer30Min: 150, intensity: 'low' },
  { name: 'Golf (with cart)', category: 'Sports', caloriesPer30Min: 100, intensity: 'low' },
  { name: 'Boxing', category: 'Sports', caloriesPer30Min: 350, intensity: 'very high' },
  { name: 'Kickboxing', category: 'Sports', caloriesPer30Min: 370, intensity: 'very high' },
  { name: 'Martial Arts', category: 'Sports', caloriesPer30Min: 320, intensity: 'high' },
  { name: 'Wrestling', category: 'Sports', caloriesPer30Min: 350, intensity: 'very high' },
  { name: 'Hockey', category: 'Sports', caloriesPer30Min: 300, intensity: 'high' },
  { name: 'Cricket', category: 'Sports', caloriesPer30Min: 180, intensity: 'moderate' },
  { name: 'Baseball', category: 'Sports', caloriesPer30Min: 170, intensity: 'moderate' },
  { name: 'Softball', category: 'Sports', caloriesPer30Min: 170, intensity: 'moderate' },
  { name: 'Rugby', category: 'Sports', caloriesPer30Min: 320, intensity: 'high' },
  { name: 'Handball', category: 'Sports', caloriesPer30Min: 280, intensity: 'high' },
  { name: 'Squash', category: 'Sports', caloriesPer30Min: 350, intensity: 'very high' },
  { name: 'Racquetball', category: 'Sports', caloriesPer30Min: 320, intensity: 'high' },

  // Water Activities
  { name: 'Water Aerobics', category: 'Water', caloriesPer30Min: 150, intensity: 'moderate' },
  { name: 'Kayaking', category: 'Water', caloriesPer30Min: 180, intensity: 'moderate' },
  { name: 'Canoeing', category: 'Water', caloriesPer30Min: 160, intensity: 'moderate' },
  { name: 'Surfing', category: 'Water', caloriesPer30Min: 200, intensity: 'moderate' },
  { name: 'Water Polo', category: 'Water', caloriesPer30Min: 350, intensity: 'very high' },
  { name: 'Diving', category: 'Water', caloriesPer30Min: 120, intensity: 'moderate' },
  { name: 'Snorkeling', category: 'Water', caloriesPer30Min: 180, intensity: 'moderate' },

  // Dance & Aerobics
  { name: 'Dancing (general)', category: 'Dance', caloriesPer30Min: 180, intensity: 'moderate' },
  { name: 'Zumba', category: 'Dance', caloriesPer30Min: 280, intensity: 'high' },
  { name: 'Aerobics (low impact)', category: 'Dance', caloriesPer30Min: 180, intensity: 'moderate' },
  { name: 'Aerobics (high impact)', category: 'Dance', caloriesPer30Min: 260, intensity: 'high' },
  { name: 'Step Aerobics', category: 'Dance', caloriesPer30Min: 300, intensity: 'high' },
  { name: 'Ballet', category: 'Dance', caloriesPer30Min: 200, intensity: 'moderate' },
  { name: 'Hip Hop Dance', category: 'Dance', caloriesPer30Min: 250, intensity: 'high' },
  { name: 'Salsa Dancing', category: 'Dance', caloriesPer30Min: 200, intensity: 'moderate' },
  { name: 'Ballroom Dancing', category: 'Dance', caloriesPer30Min: 150, intensity: 'moderate' },

  // Outdoor Activities
  { name: 'Hiking', category: 'Outdoor', caloriesPer30Min: 220, intensity: 'moderate' },
  { name: 'Hiking (uphill)', category: 'Outdoor', caloriesPer30Min: 300, intensity: 'high' },
  { name: 'Rock Climbing', category: 'Outdoor', caloriesPer30Min: 350, intensity: 'high' },
  { name: 'Skiing (downhill)', category: 'Outdoor', caloriesPer30Min: 250, intensity: 'high' },
  { name: 'Skiing (cross-country)', category: 'Outdoor', caloriesPer30Min: 350, intensity: 'very high' },
  { name: 'Snowboarding', category: 'Outdoor', caloriesPer30Min: 250, intensity: 'high' },
  { name: 'Ice Skating', category: 'Outdoor', caloriesPer30Min: 250, intensity: 'moderate' },
  { name: 'Rollerblading', category: 'Outdoor', caloriesPer30Min: 280, intensity: 'high' },
  { name: 'Skateboarding', category: 'Outdoor', caloriesPer30Min: 180, intensity: 'moderate' },
  { name: 'Gardening', category: 'Outdoor', caloriesPer30Min: 130, intensity: 'low' },
  { name: 'Yard Work', category: 'Outdoor', caloriesPer30Min: 150, intensity: 'moderate' },
  { name: 'Shoveling Snow', category: 'Outdoor', caloriesPer30Min: 250, intensity: 'high' },

  // Daily Activities
  { name: 'Cleaning House', category: 'Daily', caloriesPer30Min: 100, intensity: 'low' },
  { name: 'Cooking', category: 'Daily', caloriesPer30Min: 75, intensity: 'low' },
  { name: 'Shopping', category: 'Daily', caloriesPer30Min: 90, intensity: 'low' },
  { name: 'Playing with Kids', category: 'Daily', caloriesPer30Min: 150, intensity: 'moderate' },
  { name: 'Moving Furniture', category: 'Daily', caloriesPer30Min: 220, intensity: 'high' },
  { name: 'Carrying Groceries', category: 'Daily', caloriesPer30Min: 130, intensity: 'moderate' },
  { name: 'Taking Stairs', category: 'Daily', caloriesPer30Min: 280, intensity: 'high' },
  { name: 'Standing (work)', category: 'Daily', caloriesPer30Min: 50, intensity: 'low' },
  { name: 'Sitting (work)', category: 'Daily', caloriesPer30Min: 40, intensity: 'low' },
];

/**
 * Search exercises in the local database
 */
export const searchLocalExercises = (query: string, limit: number = 20): ExerciseDatabaseItem[] => {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  
  return EXERCISE_DATABASE
    .filter(exercise => 
      exercise.name.toLowerCase().includes(lowerQuery) ||
      exercise.category.toLowerCase().includes(lowerQuery)
    )
    .slice(0, limit);
};

/**
 * Get exercises by category
 */
export const getExercisesByCategory = (category: string): ExerciseDatabaseItem[] => {
  return EXERCISE_DATABASE.filter(exercise => 
    exercise.category.toLowerCase() === category.toLowerCase()
  );
};

/**
 * Get exercises by intensity
 */
export const getExercisesByIntensity = (intensity: ExerciseDatabaseItem['intensity']): ExerciseDatabaseItem[] => {
  return EXERCISE_DATABASE.filter(exercise => exercise.intensity === intensity);
};

/**
 * Get all unique categories
 */
export const getExerciseCategories = (): string[] => {
  return [...new Set(EXERCISE_DATABASE.map(exercise => exercise.category))];
};

/**
 * Calculate calories for custom duration
 */
export const calculateCaloriesForDuration = (caloriesPer30Min: number, durationMinutes: number): number => {
  return Math.round((caloriesPer30Min / 30) * durationMinutes);
};
