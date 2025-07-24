-- Allow anonymous fleets by making user_id nullable
-- This migration ensures the fleets table can store anonymous fleets with null user_id

-- Check if the user_id column exists and alter it to allow null values
-- Also ensure we have the necessary columns for fleet functionality
ALTER TABLE fleets ALTER COLUMN user_id DROP NOT NULL;

-- Add an index for better performance when filtering out anonymous fleets
-- (used by FleetList to show only user-specific fleets)
CREATE INDEX IF NOT EXISTS idx_fleets_user_id_not_null 
ON fleets(user_id) 
WHERE user_id IS NOT NULL;

-- Add an index for anonymous fleets (for potential future admin functionality)
CREATE INDEX IF NOT EXISTS idx_fleets_anonymous 
ON fleets(created_at) 
WHERE user_id IS NULL;

-- Ensure all necessary columns exist with proper defaults
ALTER TABLE fleets ADD COLUMN IF NOT EXISTS shared boolean DEFAULT false;
ALTER TABLE fleets ADD COLUMN IF NOT EXISTS legends boolean DEFAULT false;
ALTER TABLE fleets ADD COLUMN IF NOT EXISTS legacy boolean DEFAULT false;
ALTER TABLE fleets ADD COLUMN IF NOT EXISTS legacy_beta boolean DEFAULT false;
ALTER TABLE fleets ADD COLUMN IF NOT EXISTS arc boolean DEFAULT false;
ALTER TABLE fleets ADD COLUMN IF NOT EXISTS arc_beta boolean DEFAULT false;
ALTER TABLE fleets ADD COLUMN IF NOT EXISTS nexus boolean DEFAULT false;

-- Add timestamp columns if they don't exist
ALTER TABLE fleets ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE fleets ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to the fleets table
DROP TRIGGER IF EXISTS update_fleets_updated_at ON fleets;
CREATE TRIGGER update_fleets_updated_at
    BEFORE UPDATE ON fleets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 