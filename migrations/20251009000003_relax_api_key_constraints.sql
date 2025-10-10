-- The 20250825102800_hash_existing_keys.sql migration added NOT NULL constraints
-- assuming all keys would be hashed. But for new keys created by triggers,
-- we need to allow NULL temporarily until the trigger populates them.
-- Actually, our fixed trigger will populate them immediately, but let's be safe.

-- Check if constraints exist and make them nullable
DO $$
BEGIN
    -- Check each constraint and drop if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'team_api_keys'
        AND column_name = 'api_key_hash'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.team_api_keys
            ALTER COLUMN api_key_hash DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'team_api_keys'
        AND column_name = 'api_key_prefix'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.team_api_keys
            ALTER COLUMN api_key_prefix DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'team_api_keys'
        AND column_name = 'api_key_length'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.team_api_keys
            ALTER COLUMN api_key_length DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'team_api_keys'
        AND column_name = 'api_key_mask_prefix'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.team_api_keys
            ALTER COLUMN api_key_mask_prefix DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'team_api_keys'
        AND column_name = 'api_key_mask_suffix'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.team_api_keys
            ALTER COLUMN api_key_mask_suffix DROP NOT NULL;
    END IF;
END$$;
