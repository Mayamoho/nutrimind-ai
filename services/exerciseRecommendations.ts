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

export async function getExerciseRecommendations(userData: any): Promise<CoachSuggestion[]> {
  const { activity, nutrition, user } = userData;
  const recommendations = [];

  // Activity level recommendations
  if (activity.avgDailySteps < 5000) {
    recommendations.push({
      id: 'exercise-steps-low',
      type: 'exercise' as const,
      priority: 'high' as const,
      title: 'Increase Daily Steps',
      description: `Your average daily steps are ${Math.round(activity.avgDailySteps)}. Aim for at least 7,000-10,000 steps per day.`,
      category: 'cardio',
      source: 'activity-analysis',
      confidence: 0.9,
      actionItems: [
        'Take a 10-minute walk after each meal',
        'Use stairs instead of elevators',
        'Park further away from destinations',
        'Set hourly step reminders'
      ],
      references: [
        {
          title: 'Benefits of Walking 10,000 Steps',
          url: 'https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/10000-steps/art-20046956',
          source: 'Mayo Clinic'
        }
      ]
    });
  }

  // Strength training recommendations
  if (!user.exercise?.strengthTraining || user.exercise?.strengthTraining < 2) {
    recommendations.push({
      id: 'exercise-strength',
      type: 'exercise' as const,
      priority: 'medium' as const,
      title: 'Add Strength Training',
      description: 'Include strength training exercises at least 2-3 times per week for muscle health and metabolism.',
      category: 'strength',
      source: 'activity-analysis',
      confidence: 0.85,
      actionItems: [
        'Start with bodyweight exercises (push-ups, squats, lunges)',
        'Progress to resistance bands or weights',
        'Focus on compound movements for efficiency',
        'Allow rest days between sessions'
      ]
    });
  }

  // Cardio recommendations
  if (activity.activityLevel === 'sedentary' || activity.activityLevel === 'lightly active') {
    recommendations.push({
      id: 'exercise-cardio',
      type: 'exercise' as const,
      priority: 'high' as const,
      title: 'Increase Cardiovascular Activity',
      description: 'Aim for at least 150 minutes of moderate-intensity cardio per week.',
      category: 'cardio',
      source: 'activity-analysis',
      confidence: 0.8,
      actionItems: [
        'Start with 20-30 minute brisk walks',
        'Gradually increase intensity and duration',
        'Try activities you enjoy (dancing, swimming, cycling)',
        'Break exercise into smaller sessions if needed'
      ]
    });
  }

  // Flexibility and mobility
  recommendations.push({
    id: 'exercise-flexibility',
    type: 'exercise' as const,
    priority: 'low' as const,
    title: 'Improve Flexibility',
    description: 'Include stretching and mobility exercises to prevent injury and improve range of motion.',
    category: 'flexibility',
    source: 'activity-analysis',
    confidence: 0.75,
    actionItems: [
      'Stretch major muscle groups after workouts',
      'Try yoga or Pilates 1-2 times per week',
      'Take regular movement breaks during long periods of sitting',
      'Focus on hip flexors and shoulders if you sit a lot'
    ]
  });

  return recommendations;
}
