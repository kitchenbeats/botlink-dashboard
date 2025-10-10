
-- Add new columns to team_api_keys table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'team_api_keys' AND column_name = 'api_key_prefix') THEN
        ALTER TABLE public.team_api_keys ADD COLUMN api_key_prefix VARCHAR(10);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'team_api_keys' AND column_name = 'api_key_length') THEN
        ALTER TABLE public.team_api_keys ADD COLUMN api_key_length INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'team_api_keys' AND column_name = 'api_key_mask_prefix') THEN
        ALTER TABLE public.team_api_keys ADD COLUMN api_key_mask_prefix VARCHAR(5);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'team_api_keys' AND column_name = 'api_key_mask_suffix') THEN
        ALTER TABLE public.team_api_keys ADD COLUMN api_key_mask_suffix VARCHAR(5);
    END IF;
END$$;

-- Add new columns to access_tokens table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_tokens' AND column_name = 'access_token_prefix') THEN
        ALTER TABLE public.access_tokens ADD COLUMN access_token_prefix VARCHAR(10);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_tokens' AND column_name = 'access_token_length') THEN
        ALTER TABLE public.access_tokens ADD COLUMN access_token_length INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_tokens' AND column_name = 'access_token_mask_prefix') THEN
        ALTER TABLE public.access_tokens ADD COLUMN access_token_mask_prefix VARCHAR(5);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_tokens' AND column_name = 'access_token_mask_suffix') THEN
        ALTER TABLE public.access_tokens ADD COLUMN access_token_mask_suffix VARCHAR(5);
    END IF;
END$$;



