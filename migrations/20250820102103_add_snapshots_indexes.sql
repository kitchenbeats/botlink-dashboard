CREATE INDEX IF NOT EXISTS idx_snapshots_time_id
  ON public.snapshots (sandbox_started_at DESC, sandbox_id);

CREATE INDEX IF NOT EXISTS idx_env_builds_env_status_created
    ON public.env_builds (env_id, status, created_at DESC);
-- Redundant with (env_id, status, created_at DESC)
DROP INDEX IF EXISTS idx_envs_builds_envs;

