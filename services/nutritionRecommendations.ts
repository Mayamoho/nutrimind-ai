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

export async function getNutritionRecommendations(userData: any): Promise<CoachSuggestion[]> {
  const { nutrition, user } = userData;
  const recommendations = [];

  // Protein intake recommendation
  if (nutrition.averages.dailyProtein < (user.goals?.protein || 50)) {
    recommendations.push({
      id: 'nutr-protein',
      type: 'diet' as const,
      priority: 'high' as const,
      title: 'Increase Protein Intake',
      description: `Your protein intake is ${Math.round(nutrition.averages.dailyProtein)}g, which is below your target of ${user.goals?.protein || 50}g.`,
      category: 'protein',
      source: 'nutrition-analysis',
      confidence: 0.9,
      actionItems: [
        'Add a protein source to each meal',
        'Consider protein-rich snacks like Greek yogurt or nuts',
        'Try protein supplements if needed'
      ],
      references: [
        {
          title: 'Protein Requirements for Adults',
          url: 'https://www.healthline.com/nutrition/how-much-protein-per-day',
          source: 'Healthline'
        }
      ]
    });
  }

  // Calorie intake recommendation
  if (Math.abs(nutrition.averages.dailyCalories - (user.goals?.calories || 2000)) > 200) {
    const isOver = nutrition.averages.dailyCalories > (user.goals?.calories || 2000);
    recommendations.push({
      id: 'nutr-calories',
      type: 'diet' as const,
      priority: 'high' as const,
      title: isOver ? 'Reduce Calorie Intake' : 'Increase Calorie Intake',
      description: `Your daily calories are ${Math.round(nutrition.averages.dailyCalories)}, which is ${isOver ? 'above' : 'below'} your target of ${user.goals?.calories || 2000}.`,
      category: 'calories',
      source: 'nutrition-analysis',
      confidence: 0.85,
      actionItems: isOver ? [
        'Reduce portion sizes by 20%',
        'Choose lower-calorie alternatives',
        'Increase physical activity'
      ] : [
        'Add healthy snacks between meals',
        'Include more calorie-dense foods',
        'Consider healthy fats like nuts and avocados'
      ]
    });
  }

  // Fiber intake recommendation
  if (nutrition.averages.dailyCalories > 0 && nutrition.averages.dailyProtein < 25) {
    recommendations.push({
      id: 'nutr-fiber',
      type: 'diet' as const,
      priority: 'medium' as const,
      title: 'Increase Fiber Intake',
      description: 'Aim for at least 25g of fiber daily for better digestive health.',
      category: 'fiber',
      source: 'nutrition-analysis',
      confidence: 0.8,
      actionItems: [
        'Add more vegetables and fruits to meals',
        'Choose whole grains over refined grains',
        'Include legumes and beans in your diet'
      ]
    });
  }

  // Hydration recommendation
  recommendations.push({
    id: 'nutr-hydration',
    type: 'lifestyle' as const,
    priority: 'medium' as const,
    title: 'Stay Hydrated',
    description: 'Drink at least 8 glasses of water daily to maintain optimal hydration.',
    category: 'hydration',
    source: 'nutrition-analysis',
    confidence: 0.95,
    actionItems: [
      'Carry a water bottle with you',
      'Set hourly hydration reminders',
      'Drink water before, during, and after exercise'
    ]
  });

  return recommendations;
}
