-- The index creation takes a lot of time
CREATE INDEX idx_env_builds_status ON public.env_builds(status);

