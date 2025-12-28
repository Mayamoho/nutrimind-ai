-- NutriMind AI Database Schema
-- CREATE DATABASE nutrimind;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    email VARCHAR(255) PRIMARY KEY,
    last_name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    weight DECIMAL(5,2),
    start_weight DECIMAL(5,2),
    height DECIMAL(5,2),
    age INTEGER,
    gender VARCHAR(50),
    country VARCHAR(100),
    economic_class VARCHAR(50) DEFAULT 'lower_middle',
    dietary_preferences JSONB DEFAULT '[]',
    cuisine_preferences JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migration: Add new columns for existing databases
DO $$ 
BEGIN
    -- Check if food_database table exists before adding columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'food_database') THEN
        -- Add nutrient columns to food_database if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_database' AND column_name = 'potassium') THEN
            ALTER TABLE food_database ADD COLUMN potassium NUMERIC(10, 2) DEFAULT 0;
            ALTER TABLE food_database ADD COLUMN cholesterol NUMERIC(10, 2) DEFAULT 0;
            ALTER TABLE food_database ADD COLUMN "vitaminA" NUMERIC(10, 2) DEFAULT 0;
            ALTER TABLE food_database ADD COLUMN "vitaminC" NUMERIC(10, 2) DEFAULT 0;
            ALTER TABLE food_database ADD COLUMN "vitaminD" NUMERIC(10, 2) DEFAULT 0;
            ALTER TABLE food_database ADD COLUMN calcium NUMERIC(10, 2) DEFAULT 0;
            ALTER TABLE food_database ADD COLUMN iron NUMERIC(10, 2) DEFAULT 0;
            ALTER TABLE food_database ADD COLUMN magnesium NUMERIC(10, 2) DEFAULT 0;
            ALTER TABLE food_database ADD COLUMN zinc NUMERIC(10, 2) DEFAULT 0;
        END IF;
    END IF;
    
    -- Existing user table migrations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'economic_class') THEN
        ALTER TABLE users ADD COLUMN economic_class VARCHAR(50) DEFAULT 'lower_middle';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'dietary_preferences') THEN
        ALTER TABLE users ADD COLUMN dietary_preferences JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'cuisine_preferences') THEN
        ALTER TABLE users ADD COLUMN cuisine_preferences JSONB DEFAULT '[]';
    END IF;
END $$;

-- User goals table
CREATE TABLE IF NOT EXISTS user_goals (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    target_weight DECIMAL(5,2),
    weight_goal VARCHAR(50),
    goal_timeline INTEGER,
    goal_strategy VARCHAR(50) DEFAULT 'standard_loss',
    activity_level VARCHAR(50) DEFAULT 'light',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migration: Add new columns for existing user_goals
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_goals' AND column_name = 'goal_strategy') THEN
        ALTER TABLE user_goals ADD COLUMN goal_strategy VARCHAR(50) DEFAULT 'standard_loss';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_goals' AND column_name = 'activity_level') THEN
        ALTER TABLE user_goals ADD COLUMN activity_level VARCHAR(50) DEFAULT 'light';
    END IF;
END $$;

-- Daily logs table
CREATE TABLE IF NOT EXISTS daily_logs (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    date DATE NOT NULL,
    foods JSONB DEFAULT '[]',
    exercises JSONB DEFAULT '[]',
    neat_activities JSONB DEFAULT '[]',
    water_intake INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_email, date)
);

-- Weight logs table
CREATE TABLE IF NOT EXISTS weight_logs (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_email, date)
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    achievement_id VARCHAR(100) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    points_earned INTEGER DEFAULT 0,
    UNIQUE(user_email, achievement_id)
);

-- User achievement stats table
CREATE TABLE IF NOT EXISTS user_achievement_stats (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE UNIQUE,
    total_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    last_activity_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily insights table
CREATE TABLE IF NOT EXISTS daily_insights (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    date DATE NOT NULL,
    overall_score INTEGER DEFAULT 0,
    grade CHAR(1) DEFAULT 'F',
    calorie_balance INTEGER DEFAULT 0,
    protein_percentage INTEGER DEFAULT 0,
    carbs_percentage INTEGER DEFAULT 0,
    fat_percentage INTEGER DEFAULT 0,
    top_achievement VARCHAR(255),
    primary_focus TEXT,
    insights_json JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_email, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_email, date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_email, date);
CREATE INDEX IF NOT EXISTS idx_user_goals_email ON user_goals(user_email);
CREATE INDEX IF NOT EXISTS idx_user_achievements_email ON user_achievements(user_email);
CREATE INDEX IF NOT EXISTS idx_user_achievement_stats_email ON user_achievement_stats(user_email);
CREATE INDEX IF NOT EXISTS idx_daily_insights_user_date ON daily_insights(user_email, date);

-- Food database table (local fallback for planner and suggestions)
CREATE TABLE IF NOT EXISTS food_database (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    serving_size TEXT,
    calories NUMERIC,
    protein NUMERIC,
    carbohydrates NUMERIC,
    fat NUMERIC,
    sodium NUMERIC,
    sugar NUMERIC,
    fiber NUMERIC,
    potassium NUMERIC(10, 2) DEFAULT 0,
    cholesterol NUMERIC(10, 2) DEFAULT 0,
    "vitaminA" NUMERIC(10, 2) DEFAULT 0,
    "vitaminC" NUMERIC(10, 2) DEFAULT 0,
    "vitaminD" NUMERIC(10, 2) DEFAULT 0,
    calcium NUMERIC(10, 2) DEFAULT 0,
    iron NUMERIC(10, 2) DEFAULT 0,
    magnesium NUMERIC(10, 2) DEFAULT 0,
    zinc NUMERIC(10, 2) DEFAULT 0,
    country TEXT,
    source TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_food_database_name ON food_database USING gin (to_tsvector('english', name));

-- Chat feedback table
CREATE TABLE IF NOT EXISTS chat_feedback (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL REFERENCES users(email),
    message_id VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat history table (optional - for future implementation)
CREATE TABLE IF NOT EXISTS chat_history (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL REFERENCES users(email),
    message_id VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'bot')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    context_data JSONB
);

-- Indexes for chat tables
CREATE INDEX IF NOT EXISTS idx_chat_feedback_user_email ON chat_feedback(user_email);
CREATE INDEX IF NOT EXISTS idx_chat_feedback_created_at ON chat_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_email ON chat_history(user_email);
CREATE INDEX IF NOT EXISTS idx_chat_history_timestamp ON chat_history(timestamp);

-- Notification Settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL REFERENCES users(email),
    meal_reminders BOOLEAN DEFAULT true,
    hydration_reminders BOOLEAN DEFAULT true,
    exercise_reminders BOOLEAN DEFAULT true,
    progress_reminders BOOLEAN DEFAULT true,
    meal_times JSONB DEFAULT '{"breakfast": "08:00", "lunch": "12:00", "dinner": "18:00"}',
    hydration_interval INTEGER DEFAULT 2, -- hours between reminders
    exercise_time VARCHAR(10) DEFAULT '09:00',
    progress_day VARCHAR(10) DEFAULT 'sunday', -- weekly check-in day
    notification_channels JSONB DEFAULT '{"in_app": true, "email": false}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification Logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL REFERENCES users(email),
    notification_type VARCHAR(50) NOT NULL, -- meal, hydration, exercise, progress
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    scheduled_time TIMESTAMP NOT NULL,
    sent_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, dismissed
    channel VARCHAR(20) DEFAULT 'in_app', -- in_app, email, push
    metadata JSONB, -- additional context data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reminder Schedules table (for automated notifications)
CREATE TABLE IF NOT EXISTS reminder_schedules (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL REFERENCES users(email),
    notification_type VARCHAR(50) NOT NULL,
    schedule_pattern VARCHAR(100) NOT NULL, -- cron-like pattern
    is_active BOOLEAN DEFAULT true,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for notification tables
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_email ON notification_settings(user_email);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_email ON notification_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_scheduled_time ON notification_logs(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_reminder_schedules_user_email ON reminder_schedules(user_email);
CREATE INDEX IF NOT EXISTS idx_reminder_schedules_next_run ON reminder_schedules(next_run);

-- Add additional columns to notification_settings table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'timezone') THEN
        ALTER TABLE notification_settings ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_logs' AND column_name = 'last_hydration_reminder') THEN
        ALTER TABLE daily_logs ADD COLUMN last_hydration_reminder TIMESTAMP;
    END IF;
END $$;

-- Social Features Tables
-- Friend relationships table
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    requester_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    addressee_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_email, addressee_email),
    CHECK (requester_email != addressee_email)
);

-- Group challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    challenge_type VARCHAR(50) NOT NULL CHECK (challenge_type IN ('streak', 'protein', 'weight_loss', 'workout', 'water', 'custom')),
    duration_days INTEGER NOT NULL,
    target_value DECIMAL(10,2), -- target for the challenge (e.g., 7 days streak, 100g protein)
    reward_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(255) NOT NULL REFERENCES users(email),
    max_participants INTEGER DEFAULT 50,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Challenge participants table
CREATE TABLE IF NOT EXISTS challenge_participants (
    id SERIAL PRIMARY KEY,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    participant_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_progress DECIMAL(10,2) DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    UNIQUE(challenge_id, participant_email)
);

-- Social feed posts table
CREATE TABLE IF NOT EXISTS social_posts (
    id SERIAL PRIMARY KEY,
    author_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    content TEXT NOT NULL,
    post_type VARCHAR(50) DEFAULT 'update' CHECK (post_type IN ('update', 'milestone', 'achievement', 'challenge_join', 'challenge_complete')),
    metadata JSONB, -- additional data like achievement details, challenge info, etc.
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_email)
);

-- Post comments table
CREATE TABLE IF NOT EXISTS post_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    author_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Encouragement messages table
CREATE TABLE IF NOT EXISTS encouragements (
    id SERIAL PRIMARY KEY,
    sender_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    message TEXT NOT NULL,
    encouragement_type VARCHAR(50) DEFAULT 'general' CHECK (encouragement_type IN ('general', 'milestone', 'streak', 'goal_achievement')),
    metadata JSONB, -- context data like streak length, goal achieved, etc.
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accountability partnerships table
CREATE TABLE IF NOT EXISTS accountability_partnerships (
    id SERIAL PRIMARY KEY,
    partner1_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    partner2_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    partnership_type VARCHAR(50) DEFAULT 'general' CHECK (partnership_type IN ('general', 'weight_loss', 'fitness', 'nutrition')),
    goals JSONB DEFAULT '[]', -- shared goals
    check_in_frequency VARCHAR(20) DEFAULT 'daily' CHECK (check_in_frequency IN ('daily', 'weekly', 'biweekly')),
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(partner1_email, partner2_email),
    CHECK (partner1_email != partner2_email)
);

-- Check-in records for accountability partnerships
CREATE TABLE IF NOT EXISTS check_ins (
    id SERIAL PRIMARY KEY,
    partnership_id INTEGER NOT NULL REFERENCES accountability_partnerships(id) ON DELETE CASCADE,
    checker_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    check_in_data JSONB NOT NULL, -- includes metrics, progress, notes
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Live group activities table
CREATE TABLE IF NOT EXISTS live_activities (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('workout', 'nutrition_workshop', 'qna', 'challenge_prep')),
    host_email VARCHAR(255) NOT NULL REFERENCES users(email),
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    max_participants INTEGER DEFAULT 20,
    is_active BOOLEAN DEFAULT true,
    meeting_link VARCHAR(500), -- video call link
    meeting_password VARCHAR(100),
    metadata JSONB, -- activity-specific data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Live activity participants table
CREATE TABLE IF NOT EXISTS live_activity_participants (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES live_activities(id) ON DELETE CASCADE,
    participant_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    joined_at TIMESTAMP,
    left_at TIMESTAMP,
    is_host BOOLEAN DEFAULT false,
    UNIQUE(activity_id, participant_email)
);

-- Weekly summaries table (for sharing progress)
CREATE TABLE IF NOT EXISTS weekly_summaries (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    summary_data JSONB NOT NULL, -- includes metrics, achievements, progress
    is_shared BOOLEAN DEFAULT false,
    shared_with JSONB DEFAULT '[]', -- array of friend emails
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_email, week_start_date)
);

-- Milestone celebrations table
CREATE TABLE IF NOT EXISTS milestone_celebrations (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    milestone_type VARCHAR(50) NOT NULL CHECK (milestone_type IN ('weight_goal', 'streak', 'challenge_complete', 'level_up', 'personal_record')),
    milestone_value DECIMAL(10,2),
    description TEXT,
    is_shared BOOLEAN DEFAULT false,
    shared_with JSONB DEFAULT '[]', -- array of friend emails
    celebration_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for social tables
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_email);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_email);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(participant_email);

CREATE INDEX IF NOT EXISTS idx_social_posts_author ON social_posts(author_email);
CREATE INDEX IF NOT EXISTS idx_social_posts_type ON social_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_social_posts_public ON social_posts(is_public);
CREATE INDEX IF NOT EXISTS idx_social_posts_created ON social_posts(created_at);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_email);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author ON post_comments(author_email);

CREATE INDEX IF NOT EXISTS idx_encouragements_sender ON encouragements(sender_email);
CREATE INDEX IF NOT EXISTS idx_encouragements_recipient ON encouragements(recipient_email);
CREATE INDEX IF NOT EXISTS idx_encouragements_unread ON encouragements(recipient_email, is_read);

CREATE INDEX IF NOT EXISTS idx_accountability_partnerships_partner1 ON accountability_partnerships(partner1_email);
CREATE INDEX IF NOT EXISTS idx_accountability_partnerships_partner2 ON accountability_partnerships(partner2_email);
CREATE INDEX IF NOT EXISTS idx_accountability_partnerships_active ON accountability_partnerships(is_active);

CREATE INDEX IF NOT EXISTS idx_check_ins_partnership ON check_ins(partnership_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_checker ON check_ins(checker_email);

CREATE INDEX IF NOT EXISTS idx_live_activities_host ON live_activities(host_email);
CREATE INDEX IF NOT EXISTS idx_live_activities_type ON live_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_live_activities_dates ON live_activities(scheduled_start, scheduled_end);

CREATE INDEX IF NOT EXISTS idx_live_activity_participants_activity ON live_activity_participants(activity_id);
CREATE INDEX IF NOT EXISTS idx_live_activity_participants_user ON live_activity_participants(participant_email);

CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user ON weekly_summaries(user_email);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_week ON weekly_summaries(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_shared ON weekly_summaries(is_shared);

CREATE INDEX IF NOT EXISTS idx_milestone_celebrations_user ON milestone_celebrations(user_email);
CREATE INDEX IF NOT EXISTS idx_milestone_celebrations_type ON milestone_celebrations(milestone_type);
CREATE INDEX IF NOT EXISTS idx_milestone_celebrations_date ON milestone_celebrations(celebration_date);
