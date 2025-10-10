CREATE TABLE IF NOT EXISTS clusters (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint             TEXT NOT NULL,
    endpoint_tls         BOOLEAN NOT NULL DEFAULT TRUE,
    token                TEXT NOT NULL,
    sandbox_proxy_domain TEXT
);

ALTER TABLE "public"."clusters" ENABLE ROW LEVEL SECURITY;

ALTER TABLE teams
    ADD COLUMN IF NOT EXISTS cluster_id UUID NULL
    REFERENCES clusters(id);

CREATE INDEX IF NOT EXISTS teams_cluster_id_uq
    ON teams (cluster_id)
    WHERE cluster_id IS NOT NULL;

ALTER TABLE envs
    ADD COLUMN IF NOT EXISTS cluster_id UUID NULL
    REFERENCES clusters(id);

CREATE INDEX IF NOT EXISTS envs_cluster_id
    ON envs (cluster_id)
    WHERE cluster_id IS NOT NULL;

ALTER TABLE env_builds
    ADD COLUMN IF NOT EXISTS cluster_node_id TEXT NOT NULL DEFAULT 'unknown';
