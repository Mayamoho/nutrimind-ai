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

export async function getLifestyleRecommendations(userData: any): Promise<CoachSuggestion[]> {
  const { nutrition, activity, user } = userData;
  const recommendations = [];

  // Sleep recommendations
  if (!user.sleep?.hours || user.sleep?.hours < 7) {
    recommendations.push({
      id: 'lifestyle-sleep',
      type: 'lifestyle' as const,
      priority: 'high' as const,
      title: 'Improve Sleep Quality',
      description: 'Aim for 7-9 hours of quality sleep per night for optimal health and recovery.',
      category: 'sleep',
      source: 'lifestyle-analysis',
      confidence: 0.9,
      actionItems: [
        'Establish a consistent sleep schedule',
        'Create a relaxing bedtime routine',
        'Avoid screens 1 hour before bed',
        'Keep your bedroom cool and dark',
        'Consider limiting caffeine after 2 PM'
      ],
      references: [
        {
          title: 'Sleep Recommendations for Adults',
          url: 'https://www.cdc.gov/sleep/about_sleep/how_much_sleep.html',
          source: 'CDC'
        }
      ]
    });
  }

  // Stress management
  recommendations.push({
    id: 'lifestyle-stress',
    type: 'lifestyle' as const,
    priority: 'medium' as const,
    title: 'Manage Stress Effectively',
    description: 'Chronic stress can impact your health goals. Practice stress management techniques daily.',
    category: 'stress',
    source: 'lifestyle-analysis',
    confidence: 0.85,
    actionItems: [
      'Practice deep breathing exercises for 5 minutes daily',
      'Try meditation or mindfulness apps',
      'Take regular breaks during work',
      'Engage in hobbies you enjoy',
      'Consider journaling to process thoughts'
    ]
  });

  // Meal timing
  if (nutrition.averages.dailyCalories > 0) {
    recommendations.push({
      id: 'lifestyle-meal-timing',
      type: 'lifestyle' as const,
      priority: 'medium' as const,
      title: 'Optimize Meal Timing',
      description: 'Regular meal timing can help maintain energy levels and support your fitness goals.',
      category: 'nutrition-timing',
      source: 'lifestyle-analysis',
      confidence: 0.8,
      actionItems: [
        'Eat breakfast within 2 hours of waking',
        'Space meals 3-4 hours apart',
        'Avoid large meals 2-3 hours before bedtime',
        'Consider pre/post-workout nutrition timing'
      ]
    });
  }

  // Social support
  recommendations.push({
    id: 'lifestyle-social',
    type: 'lifestyle' as const,
    priority: 'low' as const,
    title: 'Build Support System',
    description: 'Social support can significantly improve your health and fitness journey success.',
    category: 'social',
    source: 'lifestyle-analysis',
    confidence: 0.75,
    actionItems: [
      'Share your goals with supportive friends/family',
      'Find a workout buddy or accountability partner',
      'Join fitness communities or groups',
      'Celebrate your progress with others'
    ]
  });

  // Environmental factors
  recommendations.push({
    id: 'lifestyle-environment',
    type: 'lifestyle' as const,
    priority: 'low' as const,
    title: 'Optimize Your Environment',
    description: 'Create an environment that supports your health and fitness goals.',
    category: 'environment',
    source: 'lifestyle-analysis',
    confidence: 0.7,
    actionItems: [
      'Keep healthy foods visible and accessible',
      'Remove tempting unhealthy foods from sight',
      'Set up a dedicated workout space',
      'Prepare healthy meals in advance',
      'Keep workout clothes ready to go'
    ]
  });

  return recommendations;
}
