const RAGService = require('./services/ragService');

// Test the RAG service
const ragService = new RAGService();

async function testRAG() {
  console.log('Testing RAG Service...');
  
  // Mock user data
  const userData = {
    email: 'test@example.com',
    weight: 70,
    height: 175,
    age: 30,
    gender: 'male'
  };
  
  const dailyLogs = [
    {
      date: new Date().toISOString().split('T')[0],
      foods: [{ calories: 500, protein: 20 }],
      exercises: [{ caloriesBurned: 200 }],
      waterIntake: 1500
    }
  ];
  
  const goals = {
    targetWeight: 68,
    weightGoal: 'lose',
    goalTimeline: 12
  };
  
  // Test context building
  const context = ragService.buildUserContext(userData, dailyLogs, goals);
  console.log('User Context:', JSON.stringify(context, null, 2));
  
  // Test response generation
  const testMessages = [
    'How much water should I drink?',
    'What about my protein intake?',
    'Suggest a workout for me',
    'How am I doing today?'
  ];
  
  for (const message of testMessages) {
    console.log(`\nTesting message: "${message}"`);
    try {
      const response = await ragService.generateResponse(message, context);
      console.log('Response:', response);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
  
  console.log('\nRAG Service test completed!');
}

testRAG().catch(console.error);
