import { analyzeUserData } from './userAnalysisService';
import { generatePersonalizedRecommendations } from './recommendationService';
import { trackProgress } from './progressService';
import { getContextAwareSuggestions } from './contextService';

interface CoachSuggestion {
  id: string;
  type: 'diet' | 'exercise' | 'lifestyle' | 'supplement';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  category: string;
  data?: any;
  source: string;
  confidence: number;
  actionItems?: string[];
  references?: {
    title: string;
    url: string;
    source: string;
  }[];
}

export class AICoach {
  private userId: string;
  private context: any;

  constructor(userId: string, context?: any) {
    this.userId = userId;
    this.context = context;
  }

  async getRecommendations(): Promise<CoachSuggestion[]> {
    try {
      // Use context data if available, otherwise fall back to mock services
      if (this.context) {
        const recommendations = await this.generateRecommendationsFromContext(this.context);
        const contextSuggestions = await this.getContextAwareSuggestions();
        const allSuggestions = this.prioritizeSuggestions([...recommendations, ...contextSuggestions]);
        await this.trackRecommendations(allSuggestions);
        return allSuggestions;
      } else {
        // Original flow with mock services
        const userData = await this.analyzeUserData();
        const recommendations = await this.generateRecommendations(userData);
        const contextSuggestions = await this.getContextAwareSuggestions();
        const allSuggestions = this.prioritizeSuggestions([...recommendations, ...contextSuggestions]);
        await this.trackRecommendations(allSuggestions);
        return allSuggestions;
      }
    } catch (error) {
      // Silently handle errors to prevent console spam
      return this.getFallbackSuggestions();
    }
  }

  private async analyzeUserData() {
    try {
      return analyzeUserData(this.userId);
    } catch (error) {
      return { user: {}, nutrition: { totals: { calories: 0 }, averages: { calories: 0 } }, activity: { avgDailySteps: 0 } };
    }
  }

  private async generateRecommendations(userData: any): Promise<CoachSuggestion[]> {
    try {
      return generatePersonalizedRecommendations(userData);
    } catch (error) {
      return [];
    }
  }

  private async generateRecommendationsFromContext(context: any): Promise<CoachSuggestion[]> {
    try {
      const { user, dailyLog, userGoals, dailyProgress } = context;
      
      // Transform context data into the expected format for recommendation services
      const userData = {
        user,
        nutrition: {
          totals: {
            calories: dailyProgress.calories?.achieved || 0,
            protein: dailyProgress.protein || 0,
            carbs: dailyProgress.carbs || 0,
            fat: dailyProgress.fat || 0
          },
          averages: {
            dailyCalories: dailyProgress.calories?.achieved || 0,
            dailyProtein: dailyProgress.protein || 0,
            dailyCarbs: dailyProgress.carbs || 0,
            dailyFat: dailyProgress.fat || 0
          }
        },
        activity: {
          avgDailySteps: 8000, // Default value
          activityLevel: 'lightly active'
        }
      };

      return generatePersonalizedRecommendations(userData);
    } catch (error) {
      return [];
    }
  }

  private async getContextAwareSuggestions(): Promise<CoachSuggestion[]> {
    try {
      return getContextAwareSuggestions(this.context);
    } catch (error) {
      return [];
    }
  }

  private prioritizeSuggestions(suggestions: CoachSuggestion[]): CoachSuggestion[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return suggestions.sort((a, b) => {
      const aScore = priorityOrder[a.priority] * a.confidence;
      const bScore = priorityOrder[b.priority] * b.confidence;
      return bScore - aScore;
    });
  }

  private async trackRecommendations(suggestions: CoachSuggestion[]) {
    try {
      await trackProgress(this.userId, {
        type: 'recommendations_shown',
        data: suggestions.map(s => s.id)
      });
    } catch (error) {
      // Silently ignore tracking errors
    }
  }

  private getFallbackSuggestions(): CoachSuggestion[] {
    return [
      {
        id: 'fallback-1',
        type: 'lifestyle',
        priority: 'medium',
        title: 'Stay Hydrated',
        description: 'Drink at least 8 glasses of water daily to maintain optimal hydration.',
        category: 'hydration',
        source: 'system',
        confidence: 0.9,
        actionItems: [
          'Carry a water bottle with you',
          'Set hourly hydration reminders'
        ]
      },
      {
        id: 'fallback-2',
        type: 'diet',
        priority: 'high',
        title: 'Balanced Meals',
        description: 'Ensure each meal contains a balance of protein, healthy fats, and complex carbohydrates.',
        category: 'nutrition',
        source: 'system',
        confidence: 0.95
      }
    ];
  }
}
