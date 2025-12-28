const planner = require('../services/personalizedPlannerService');

async function run() {
  const user = { email: 'test@example.com', country: 'India', weightGoal: 'maintain', goalCalories: 2000, proteinTarget: 100 };
  console.log('Daily Plan (budget=budget):');
  console.log(JSON.stringify(planner.generateDailyPlan(user, 'budget'), null, 2));

  console.log('\nWeekly Plan (moderate):');
  console.log(JSON.stringify(planner.generateWeeklyPlan(user, 'moderate'), null, 2));

  console.log('\nWorkout Plan:');
  console.log(JSON.stringify(planner.generateWorkoutPlan(user), null, 2));
}

run().catch(err => { console.error(err); process.exit(1); });