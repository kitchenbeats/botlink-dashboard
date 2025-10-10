
-- Add unique index for team_api_keys.api_key_hash for faster hash lookups and uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_api_keys_api_key_hash 
ON team_api_keys (api_key_hash);

-- Add unique index for access_tokens.access_token_hash for faster hash lookups and uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_access_tokens_access_token_hash 
ON access_tokens (access_token_hash);

