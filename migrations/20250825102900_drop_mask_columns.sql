
-- Drop the mask columns as they're no longer necessary
ALTER TABLE public.team_api_keys DROP COLUMN IF EXISTS api_key_mask;
ALTER TABLE public.access_tokens DROP COLUMN IF EXISTS access_token_mask;

