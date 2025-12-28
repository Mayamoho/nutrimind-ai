export async function getUserData(userId: string) {
  // This would typically fetch from your database
  // For now, return mock data
  return {
    id: userId,
    name: 'User',
    age: 30,
    weight: 70, // kg
    height: 175, // cm
    gender: 'other',
    goals: {
      calories: 2000,
      protein: 50,
      carbs: 250,
      fat: 65
    },
    preferences: {
      dietary: [],
      allergies: []
    }
  };
}
