-- Add encrypted column in a simple, isolated migration
-- This works around Supabase's silent failure on complex ALTER TABLE statements

ALTER TABLE public.team_api_keys ADD COLUMN api_key_encrypted bytea;
