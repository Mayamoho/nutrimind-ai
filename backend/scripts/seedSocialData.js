const db = require('../db');

async function seedSocialData() {
  try {
    console.log('Seeding social data...');
    
    // Wait for database to be available
    await db.query('SELECT 1');

    // Insert sample challenges
    const challenges = [
      {
        title: '7-Day Protein Streak',
        description: 'Log protein-rich foods for 7 consecutive days',
        challenge_type: 'protein',
        duration_days: 7,
        target_value: 7,
        reward_points: 100,
        is_active: true,
        created_by: 'system',
        max_participants: 100,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Weight Loss Warrior',
        description: 'Lose 2kg this month',
        challenge_type: 'weight_loss',
        duration_days: 30,
        target_value: 2,
        reward_points: 150,
        is_active: true,
        created_by: 'system',
        max_participants: 50,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Hydration Hero',
        description: 'Drink 8 glasses of water daily for 14 days',
        challenge_type: 'water',
        duration_days: 14,
        target_value: 8,
        reward_points: 75,
        is_active: true,
        created_by: 'system',
        max_participants: 200,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Workout Champion',
        description: 'Complete 20 workouts this month',
        challenge_type: 'workout',
        duration_days: 30,
        target_value: 20,
        reward_points: 200,
        is_active: true,
        created_by: 'system',
        max_participants: 100,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const challenge of challenges) {
      await db.query(`
        INSERT INTO challenges (title, description, challenge_type, duration_days, target_value, reward_points, is_active, created_by, max_participants, start_date, end_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
      `, Object.values(challenge));
    }

    // Insert sample live activities
    const activities = [
      {
        title: 'Group Workout Session',
        description: 'Join us for a 30-minute HIIT workout',
        activity_type: 'workout',
        host_email: 'trainer@nutrimind.com',
        host_name: 'Coach Mike',
        scheduled_start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        scheduled_end: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
        max_participants: 20
      },
      {
        title: 'Nutrition Workshop',
        description: 'Learn about meal planning and macro counting',
        activity_type: 'nutrition_workshop',
        host_email: 'nutritionist@nutrimind.com',
        host_name: 'Dr. Sarah',
        scheduled_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        scheduled_end: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        max_participants: 50
      },
      {
        title: 'Q&A Session',
        description: 'Ask your nutrition questions to experts',
        activity_type: 'qna',
        host_email: 'support@nutrimind.com',
        host_name: 'NutriMind Team',
        scheduled_start: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        scheduled_end: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        max_participants: 100
      }
    ];

    for (const activity of activities) {
      await db.query(`
        INSERT INTO live_activities (title, description, activity_type, host_email, host_name, scheduled_start, scheduled_end, max_participants)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING
      `, Object.values(activity));
    }

    // Insert sample milestone celebrations
    const milestones = [
      {
        user_email: 'demo@example.com',
        milestone_type: 'weight_goal',
        milestone_value: 5,
        description: 'Lost 5kg! Great progress!',
        is_shared: true,
        celebration_date: new Date().toISOString()
      },
      {
        user_email: 'demo@example.com',
        milestone_type: 'streak',
        milestone_value: 30,
        description: '30-day logging streak achieved!',
        is_shared: true,
        celebration_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const milestone of milestones) {
      await db.query(`
        INSERT INTO milestone_celebrations (user_email, milestone_type, milestone_value, description, is_shared, celebration_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, Object.values(milestone));
    }

    console.log('Social data seeded successfully!');
  } catch (error) {
    console.error('Error seeding social data:', error);
  } finally {
    process.exit(0);
  }
}

seedSocialData();
