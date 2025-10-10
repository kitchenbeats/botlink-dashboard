-- Ensure team_id column exists (may have been created in 20250923094021 but Supabase might have failed silently)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'snapshots' AND column_name = 'team_id') THEN
        ALTER TABLE public.snapshots ADD COLUMN team_id uuid NULL;
        -- Populate team_id from envs table
        UPDATE public.snapshots SET team_id = e.team_id FROM public.envs e WHERE e.id = snapshots.env_id;
        -- Add foreign key constraint
        ALTER TABLE public.snapshots
            ADD CONSTRAINT fk_snapshots_team
            FOREIGN KEY (team_id)
            REFERENCES teams(id)
            ON UPDATE NO ACTION ON DELETE NO ACTION;
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_snapshots_team_time_id
    ON public.snapshots (team_id, sandbox_started_at DESC, sandbox_id);
DROP INDEX IF EXISTS idx_snapshots_time_id;

