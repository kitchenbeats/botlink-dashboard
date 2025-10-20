-- BotLink Application Tables
-- These tables support the AI coding assistant functionality

-- Projects table (team-based)
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name text NOT NULL,
    template text NOT NULL, -- 'simple_site', 'nextjs', 'react_spa', etc.
    description text,
    settings jsonb DEFAULT '{}'::jsonb,
    github_repo_url text, -- GitHub repo URL (created on first commit)
    last_commit_hash text, -- Latest commit hash for restoration
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_opened_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);

-- Files table (belongs to projects)
CREATE TABLE IF NOT EXISTS public.files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    path text NOT NULL,
    content text NOT NULL,
    language text,
    created_by text NOT NULL CHECK (created_by IN ('user', 'ai')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(project_id, path)
);

CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);

-- Messages table (chat history for projects)
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_project_id ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Sandbox sessions table (E2B sandboxes)
CREATE TABLE IF NOT EXISTS public.sandbox_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    e2b_session_id text NOT NULL UNIQUE,
    template text NOT NULL,
    status text NOT NULL CHECK (status IN ('starting', 'ready', 'stopped', 'error')),
    url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    stopped_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_project_id ON sandbox_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_e2b_id ON sandbox_sessions(e2b_session_id);

-- Agents table (custom and system agents)
CREATE TABLE IF NOT EXISTS public.agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE, -- NULL for system agents
    name text NOT NULL,
    type text NOT NULL, -- 'planner', 'executor', 'reviewer', 'custom', etc.
    model text NOT NULL DEFAULT 'claude-sonnet-4-5',
    system_prompt text NOT NULL,
    user_prompt_template text,
    config jsonb DEFAULT '{}'::jsonb,
    is_system boolean GENERATED ALWAYS AS (team_id IS NULL) STORED,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_team_id ON agents(team_id);
CREATE INDEX IF NOT EXISTS idx_agents_is_system ON agents(is_system);

-- Workflows table (visual workflow definitions)
CREATE TABLE IF NOT EXISTS public.workflows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
    edges jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflows_team_id ON workflows(team_id);

-- Executions table (workflow runs)
CREATE TABLE IF NOT EXISTS public.executions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    workflow_id uuid REFERENCES workflows(id) ON DELETE SET NULL,
    status text NOT NULL CHECK (status IN ('draft', 'clarifying', 'pending', 'running', 'paused', 'completed', 'failed')),
    input text NOT NULL,
    output text,
    builder_type text NOT NULL, -- 'simple_site', 'nextjs', etc.
    created_at timestamptz DEFAULT now(),
    completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_executions_team_id ON executions(team_id);
CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);

-- Tasks table (individual tasks within executions)
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    execution_id uuid REFERENCES executions(id) ON DELETE CASCADE,
    message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
    agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
    system_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    input text NOT NULL,
    output text,
    result_type text,
    status text NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    type text NOT NULL CHECK (type IN ('file_create', 'file_update', 'file_delete', 'run_command', 'install_package')),
    metadata jsonb DEFAULT '{}'::jsonb,
    attempts int DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_tasks_execution_id ON tasks(execution_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Deployments table (project deployments)
CREATE TABLE IF NOT EXISTS public.deployments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version int NOT NULL,
    url text NOT NULL UNIQUE,
    status text NOT NULL CHECK (status IN ('building', 'ready', 'failed')),
    snapshot jsonb NOT NULL,
    build_logs text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deployments_project_id ON deployments(project_id);

-- RLS Policies for team isolation
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their team's projects"
    ON projects FOR SELECT
    TO authenticated
    USING (team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert projects for their team"
    ON projects FOR INSERT
    TO authenticated
    WITH CHECK (team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their team's projects"
    ON projects FOR UPDATE
    TO authenticated
    USING (team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their team's projects"
    ON projects FOR DELETE
    TO authenticated
    USING (team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid()));

-- Files policies (inherit from projects)
CREATE POLICY "Users can view files in their team's projects"
    ON files FOR SELECT
    TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid())));

CREATE POLICY "Users can insert files in their team's projects"
    ON files FOR INSERT
    TO authenticated
    WITH CHECK (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid())));

CREATE POLICY "Users can update files in their team's projects"
    ON files FOR UPDATE
    TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid())));

CREATE POLICY "Users can delete files in their team's projects"
    ON files FOR DELETE
    TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid())));

-- Messages policies (inherit from projects)
CREATE POLICY "Users can view messages in their team's projects"
    ON messages FOR SELECT
    TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid())));

CREATE POLICY "Users can insert messages in their team's projects"
    ON messages FOR INSERT
    TO authenticated
    WITH CHECK (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid())));

-- Sandbox sessions policies
CREATE POLICY "Users can view sandbox sessions for their team's projects"
    ON sandbox_sessions FOR SELECT
    TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage sandbox sessions for their team's projects"
    ON sandbox_sessions FOR ALL
    TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid())));

-- Agents policies
CREATE POLICY "Users can view system agents and their team's agents"
    ON agents FOR SELECT
    TO authenticated
    USING (team_id IS NULL OR team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid()));

CREATE POLICY "Users can create agents for their team"
    ON agents FOR INSERT
    TO authenticated
    WITH CHECK (team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their team's agents"
    ON agents FOR UPDATE
    TO authenticated
    USING (team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid()));

-- Workflows policies
CREATE POLICY "Users can view their team's workflows"
    ON workflows FOR SELECT
    TO authenticated
    USING (team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their team's workflows"
    ON workflows FOR ALL
    TO authenticated
    USING (team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid()));

-- Executions policies
CREATE POLICY "Users can view their team's executions"
    ON executions FOR SELECT
    TO authenticated
    USING (team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their team's executions"
    ON executions FOR ALL
    TO authenticated
    USING (team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid()));

-- Tasks policies
CREATE POLICY "Users can view tasks for their team's executions"
    ON tasks FOR SELECT
    TO authenticated
    USING (
        (team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid()))
        OR (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid())))
    );

CREATE POLICY "Users can manage tasks for their team"
    ON tasks FOR ALL
    TO authenticated
    USING (
        (team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid()))
        OR (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid())))
    );

-- Deployments policies
CREATE POLICY "Users can view deployments for their team's projects"
    ON deployments FOR SELECT
    TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage deployments for their team's projects"
    ON deployments FOR ALL
    TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM users_teams WHERE user_id = auth.uid())));
