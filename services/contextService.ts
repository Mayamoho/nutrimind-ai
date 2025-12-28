import { getTimeOfDay } from '../utils/dateUtils';
import { getWeather } from './weatherService';

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

export async function getContextAwareSuggestions(context?: any): Promise<CoachSuggestion[]> {
  const currentContext = await getCurrentContext();
  const suggestions: CoachSuggestion[] = [];

  // Time-based suggestions
  const timeOfDay = getTimeOfDay();
  if (timeOfDay === 'morning') {
    suggestions.push(createMorningSuggestion());
  } else if (timeOfDay === 'evening') {
    suggestions.push(createEveningSuggestion());
  }

  // Weather-based suggestions
  if (currentContext.weather) {
    if (currentContext.weather.temp > 25) {
      suggestions.push(createHotWeatherSuggestion());
    } else if (currentContext.weather.temp < 10) {
      suggestions.push(createColdWeatherSuggestion());
    }
  }

  return suggestions;
}

function createMorningSuggestion(): CoachSuggestion {
  return {
    id: 'ctx-morning',
    type: 'lifestyle',
    priority: 'medium',
    title: 'Morning Hydration',
    description: 'Start your day with a glass of water to rehydrate after sleep.',
    category: 'hydration',
    source: 'context',
    confidence: 0.95,
    actionItems: [
      'Drink water immediately upon waking',
      'Add lemon for flavor and vitamin C',
      'Continue hydrating throughout the morning'
    ]
  };
}

function createEveningSuggestion(): CoachSuggestion {
  return {
    id: 'ctx-evening',
    type: 'lifestyle',
    priority: 'medium',
    title: 'Evening Wind Down',
    description: 'Prepare your body for rest with a relaxing evening routine.',
    category: 'sleep',
    source: 'context',
    confidence: 0.9,
    actionItems: [
      'Avoid screens 1 hour before bed',
      'Practice gentle stretching or meditation',
      'Keep your bedroom cool and dark'
    ]
  };
}

function createHotWeatherSuggestion(): CoachSuggestion {
  return {
    id: 'ctx-hot-weather',
    type: 'lifestyle',
    priority: 'high',
    title: 'Hot Weather Alert',
    description: 'Stay hydrated in this heat! Drink extra water today.',
    category: 'weather',
    source: 'context',
    confidence: 0.9,
    actionItems: [
      'Increase water intake by 20%',
      'Monitor urine color for hydration status',
      'Avoid excessive caffeine and alcohol'
    ]
  };
}

function createColdWeatherSuggestion(): CoachSuggestion {
  return {
    id: 'ctx-cold-weather',
    type: 'lifestyle',
    priority: 'medium',
    title: 'Cold Weather Care',
    description: 'Stay warm and maintain your energy in cold weather.',
    category: 'weather',
    source: 'context',
    confidence: 0.85,
    actionItems: [
      'Dress in layers for outdoor activities',
      'Warm up properly before exercise',
      'Consider indoor workout alternatives'
    ]
  };
}

async function getCurrentContext() {
  return {
    time: new Date(),
    weather: await getWeather(),
  };
}
