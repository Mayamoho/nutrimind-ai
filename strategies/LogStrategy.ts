/**
 * Strategy Pattern Interface for Log Analysis.
 * Defines a common method for analyzing different types of user inputs (food, exercise, etc.).
 * This allows for interchangeable analysis logic.
 */
export interface LogStrategy<T> {
    // FIX: Removed apiKey parameter to align with service function requirements.
    analyze(text: string, options?: any): Promise<T>;
}
