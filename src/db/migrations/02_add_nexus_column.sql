-- Add nexus column to fleets table
ALTER TABLE fleets ADD COLUMN IF NOT EXISTS nexus boolean DEFAULT false;

-- Update existing fleets to have nexus = false by default
UPDATE fleets SET nexus = false WHERE nexus IS NULL; 