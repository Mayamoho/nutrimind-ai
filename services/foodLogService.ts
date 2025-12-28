export async function getRecentFoodLogs(userId: string, days: number = 7) {
  // This would typically fetch from your database
  // For now, return mock data
  const mockLogs = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    mockLogs.push({
      date: dateStr,
      foods: [
        {
          name: 'Sample Food',
          calories: 300,
          nutrients: {
            protein: 20,
            carbs: 30,
            fat: 10
          }
        }
      ]
    });
  }
  
  return mockLogs;
}
