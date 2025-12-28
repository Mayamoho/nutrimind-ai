// import { LogStrategy } from './LogStrategy';
// import { analyzeFoodInput } from '../services/geminiService';
// import { FoodLog, MealType } from '../types';

// type RawFoodData = Omit<FoodLog, 'id' | 'timestamp'>;

// interface FoodStrategyOptions {
//     mealType: MealType;
//     image?: {
//         inlineData: {
//             data: string;
//             mimeType: string;
//         };
//     };
// }

// /**
//  * Concrete implementation of the LogStrategy for analyzing food inputs.
//  * Encapsulates the logic for calling the Gemini API for food analysis.
//  */
// export class FoodLogStrategy implements LogStrategy<RawFoodData[]> {
//     // FIX: Updated method signature to remove apiKey, which is not needed by the service.
//     async analyze(text: string, options: FoodStrategyOptions): Promise<RawFoodData[]> {
//         if (!options || !options.mealType) {
//             throw new Error("Meal type is required for food analysis.");
//         }
//         // FIX: Removed apiKey from the call to match the `analyzeFoodInput` function signature.
//         return await analyzeFoodInput(text, options.mealType, options.image);
//     }
// }


import { LogStrategy } from './LogStrategy';
import { analyzeFoodInput } from '../services/geminiService';
import { FoodLog, MealType } from '../types';

type RawFoodData = Omit<FoodLog, 'id' | 'timestamp'>;

interface FoodStrategyOptions {
    mealType: MealType;
    image?: {
        inlineData: {
            data: string;
            mimeType: string;
        };
    };
}

/**
 * Concrete implementation of the LogStrategy for analyzing food inputs.
 * Encapsulates the logic for calling the Gemini API for food analysis.
 */
export class FoodLogStrategy implements LogStrategy<RawFoodData[]> {
    async analyze(text: string, options: FoodStrategyOptions): Promise<RawFoodData[]> {
        if (!options || !options.mealType) {
            throw new Error("Meal type is required for food analysis.");
        }
        return await analyzeFoodInput(text, options.mealType, options.image);
    }
}
