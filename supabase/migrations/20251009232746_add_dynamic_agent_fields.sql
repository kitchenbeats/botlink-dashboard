-- Add support for dynamic agent generation and Inngest workflow tracking
-- This migration adds fields needed for the orchestrator to create specialized agents

-- Add execution_id to agents table for dynamic agents created during workflow
ALTER TABLE agents ADD COLUMN IF NOT EXISTS execution_id uuid REFERENCES executions(id) ON DELETE CASCADE;

-- Add Inngest run tracking to executions
ALTER TABLE executions ADD COLUMN IF NOT EXISTS inngest_run_id text;
ALTER TABLE executions ADD COLUMN IF NOT EXISTS channel_id text;

-- Add step tracking to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS step_id text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attempts int DEFAULT 0;

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_agents_execution_id ON agents(execution_id);
CREATE INDEX IF NOT EXISTS idx_executions_inngest_run_id ON executions(inngest_run_id);
CREATE INDEX IF NOT EXISTS idx_executions_channel_id ON executions(channel_id);
CREATE INDEX IF NOT EXISTS idx_tasks_step_id ON tasks(step_id);

-- Add function to get agents by execution
CREATE OR REPLACE FUNCTION get_agents_by_execution(p_execution_id uuid)
RETURNS SETOF agents
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM agents
  WHERE execution_id = p_execution_id
  ORDER BY created_at ASC;
$$;

-- Add function to get pending tasks for execution
CREATE OR REPLACE FUNCTION get_pending_tasks_for_execution(p_execution_id uuid)
RETURNS SETOF tasks
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM tasks
  WHERE execution_id = p_execution_id
  AND status = 'pending'
  ORDER BY (metadata->>'order')::int NULLS LAST, created_at ASC;
$$;

-- Add comment explaining the execution_id field
COMMENT ON COLUMN agents.execution_id IS 'Links dynamic agents to the execution that created them. NULL for user-created permanent agents.';
COMMENT ON COLUMN executions.inngest_run_id IS 'Inngest function run ID for tracking async execution';
COMMENT ON COLUMN executions.channel_id IS 'Realtime channel ID for streaming updates to UI';
COMMENT ON COLUMN tasks.step_id IS 'Inngest step ID for tracking within workflow';
COMMENT ON COLUMN tasks.attempts IS 'Number of execution attempts (for retry logic)';
