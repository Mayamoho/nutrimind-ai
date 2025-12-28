import { getNutritionRecommendations } from './nutritionRecommendations';
import { getExerciseRecommendations } from './exerciseRecommendations';
import { getLifestyleRecommendations } from './lifestyleRecommendations';

export async function generatePersonalizedRecommendations(userData: any) {
  const recommendations = [
    ...(await getNutritionRecommendations(userData)),
    ...(await getExerciseRecommendations(userData)),
    ...(await getLifestyleRecommendations(userData))
  ];

  return recommendations;
}
