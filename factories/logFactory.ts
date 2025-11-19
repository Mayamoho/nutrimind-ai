
import { FoodLog, ExerciseLog } from '../types';

// The input data is the object shape returned by the Gemini service
type RawFoodData = Omit<FoodLog, 'id' | 'timestamp'>;
type RawExerciseData = Omit<ExerciseLog, 'id' | 'timestamp'>;

/**
 * Factory function to create a complete FoodLog object.
 * It centralizes the logic for adding a unique ID and a timestamp.
 * @param data - The raw food data analyzed by the AI.
 * @returns A complete FoodLog object.
 */
export const createFoodLog = (data: RawFoodData): FoodLog => {
    return {
        ...data,
        id: crypto.randomUUID(),
        timestamp: new Date(),
    };
};

/**
 * Factory function to create a complete ExerciseLog object.
 * It centralizes the logic for adding a unique ID and a timestamp.
 * @param data - The raw exercise data analyzed by the AI.
 * @returns A complete ExerciseLog object.
 */
export const createExerciseLog = (data: RawExerciseData): ExerciseLog => {
    return {
        ...data,
        id: crypto.randomUUID(),
        timestamp: new Date(),
    };
};
