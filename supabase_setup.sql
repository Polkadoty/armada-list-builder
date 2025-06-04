-- Create the legacy_beta_whitelist table
CREATE TABLE IF NOT EXISTS legacy_beta_whitelist (
    id SERIAL PRIMARY KEY,
    auth0_user_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on auth0_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_legacy_beta_whitelist_auth0_user_id 
ON legacy_beta_whitelist(auth0_user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE legacy_beta_whitelist ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to read their own whitelist status
CREATE POLICY "Users can read their own whitelist status" ON legacy_beta_whitelist
    FOR SELECT
    USING (auth0_user_id = auth.jwt() ->> 'sub');

-- Create a policy for service role to manage the whitelist (for admin operations)
CREATE POLICY "Service role can manage whitelist" ON legacy_beta_whitelist
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Example: Add a user to the whitelist (replace with actual Auth0 user ID)
-- INSERT INTO legacy_beta_whitelist (auth0_user_id) VALUES ('auth0|your-user-id-here');

-- Grant necessary permissions
GRANT SELECT ON legacy_beta_whitelist TO authenticated;
GRANT ALL ON legacy_beta_whitelist TO service_role; 