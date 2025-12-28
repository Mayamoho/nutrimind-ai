export async function getActivityData(userId: string, days: number = 7) {
  // This would typically fetch from your database or fitness tracker API
  // For now, return mock data
  const mockActivity = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    mockActivity.push({
      date: date.toISOString().split('T')[0],
      steps: Math.floor(Math.random() * 10000) + 2000,
      activeMinutes: Math.floor(Math.random() * 60) + 10,
      caloriesBurned: Math.floor(Math.random() * 500) + 200
    });
  }
  
  return mockActivity;
}
