-- Ensure reason column exists (may have been created in 20250624232413 but Supabase might have failed silently)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'env_builds' AND column_name = 'reason') THEN
        ALTER TABLE public.env_builds ADD COLUMN reason JSONB;
    END IF;
END$$;

UPDATE public.env_builds
    SET reason = '{}'::jsonb
    WHERE reason IS NULL;

ALTER TABLE public.env_builds
    ALTER COLUMN env_id SET NOT NULL,
    ALTER COLUMN reason SET DEFAULT '{}'::jsonb,
    ALTER COLUMN reason SET NOT NULL;

