import { LogStrategy } from './LogStrategy';
import { analyzeExerciseInput } from '../services/geminiService';
import { ExerciseLog } from '../types';

type RawExerciseData = Omit<ExerciseLog, 'id' | 'timestamp'>;

interface ExerciseStrategyOptions {
    image?: {
        inlineData: {
            data: string;
            mimeType: string;
        };
    };
}

/**
 * Concrete implementation of the LogStrategy for analyzing exercise inputs.
 * Encapsulates the logic for calling the Gemini API for exercise analysis.
 */
export class ExerciseLogStrategy implements LogStrategy<RawExerciseData> {
    // FIX: Updated method signature to remove apiKey, which is not needed by the service.
    async analyze(text: string, options?: ExerciseStrategyOptions): Promise<RawExerciseData> {
        // FIX: Removed apiKey from the call to match the `analyzeExerciseInput` function signature.
        return await analyzeExerciseInput(text, options?.image);
    }
}
