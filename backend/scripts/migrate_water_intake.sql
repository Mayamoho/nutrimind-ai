-- Migration: convert daily_logs.water_intake from DECIMAL(5,2) to INTEGER (ml)
-- This rounds existing values to nearest integer.
-- Run this in your DB (psql) when upgrading schema.

BEGIN;

-- Back up current values just in case
CREATE TABLE IF NOT EXISTS daily_logs_water_intake_backup AS
SELECT id, user_email, date, water_intake AS old_water_intake FROM daily_logs;

-- Null-safe update of existing rows: if water_intake is null set to 0
UPDATE daily_logs SET water_intake = 0 WHERE water_intake IS NULL;

-- Alter column type to integer using ROUND
ALTER TABLE daily_logs ALTER COLUMN water_intake TYPE INTEGER USING ROUND(water_intake);

COMMIT;

-- Note: After running this migration, ensure application restarts so connection pools see new schema.
