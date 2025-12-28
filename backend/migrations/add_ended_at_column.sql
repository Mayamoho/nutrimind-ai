-- Migration: Add ended_at column to live_activities table
ALTER TABLE live_activities ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP;
