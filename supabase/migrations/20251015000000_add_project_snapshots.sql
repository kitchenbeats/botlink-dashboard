-- Project Snapshots Table
-- Stores E2B runtime snapshots for projects to enable pause/resume functionality
-- This allows users to close their workspace and resume exactly where they left off

CREATE TABLE IF NOT EXISTS public.project_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    snapshot_id text NOT NULL, -- E2B snapshot ID
    description text,
    file_count integer,
    size_mb integer,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_project_snapshots_project_id ON project_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_project_snapshots_created_at ON project_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_snapshots_snapshot_id ON project_snapshots(snapshot_id);

-- RLS policies for team isolation
ALTER TABLE project_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view snapshots for their team's projects"
    ON project_snapshots FOR SELECT
    TO authenticated
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE team_id IN (
                SELECT team_id FROM users_teams WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create snapshots for their team's projects"
    ON project_snapshots FOR INSERT
    TO authenticated
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects
            WHERE team_id IN (
                SELECT team_id FROM users_teams WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete snapshots for their team's projects"
    ON project_snapshots FOR DELETE
    TO authenticated
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE team_id IN (
                SELECT team_id FROM users_teams WHERE user_id = auth.uid()
            )
        )
    );
