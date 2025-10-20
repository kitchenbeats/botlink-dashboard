// ============================================================================
// DATABASE TYPES - Generated from Supabase schema
// ============================================================================

// Enums
export type ProjectTemplate = 'simple_site' | 'nextjs' | 'nextjs_saas';

export type BuilderType = 'simple_site' | 'nextjs' | 'nextjs_saas';
export type ProjectType = ProjectTemplate; // Legacy alias
export type MessageRole = 'user' | 'assistant' | 'system';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
export type TaskType = 'file_create' | 'file_update' | 'file_delete' | 'run_command' | 'install_package';
/**
 * Sandbox Status Values:
 * - 'starting': Sandbox is being created
 * - 'ready': Sandbox is running and available
 * - 'stopped': VM destroyed/removed (no cost)
 * - 'error': Sandbox creation or operation failed
 */
export type SandboxStatus = 'starting' | 'ready' | 'stopped' | 'error';
export type DeploymentStatus = 'building' | 'ready' | 'failed';
export type OrganizationRole = 'owner' | 'admin' | 'member';
export type AgentType = 'planner' | 'executor' | 'reviewer' | 'custom' | 'orchestrator' | 'logic_checker' | 'generic';

// ============================================================================
// CORE TABLES
// ============================================================================

export interface Profile {
  id: string; // uuid, references auth.users
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string; // unique
  avatar_url?: string | null;
  settings: Record<string, unknown>; // jsonb
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  team_id: string;
  user_id: string;
  role: OrganizationRole;
  created_at: string;
}

export interface Agent {
  id: string;
  team_id: string | null; // null = system agent
  execution_id?: string | null; // For dynamic agents created during workflow
  name: string;
  type: AgentType;
  model: string; // default: 'gpt-4o'
  system_prompt: string;
  user_prompt_template?: string; // Template for user prompts (optional)
  config: AgentConfig;
  is_system: boolean; // generated column
  created_at: string;
  updated_at: string;
}

export interface AgentConfig {
  temperature?: number;
  max_tokens?: number;
  tools?: string[];
  [key: string]: unknown;
}

export interface Workflow {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowNodeData {
  agentId?: string;
  label?: string;
  [key: string]: unknown;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export type ExecutionStatus = 'draft' | 'clarifying' | 'pending' | 'running' | 'paused' | 'completed' | 'failed';

export interface Execution {
  id: string;
  team_id: string;
  workflow_id: string | null;
  status: ExecutionStatus;
  input: string;
  output: string | null;
  builder_type: BuilderType;
  inngest_run_id: string | null; // Inngest function run ID for tracking
  channel_id: string | null; // Realtime channel ID for streaming
  created_at: string;
  completed_at: string | null;
}

export interface Project {
  id: string;
  team_id: string;
  name: string;
  template: ProjectTemplate;
  description: string | null;
  settings: ProjectSettings;
  created_at: string;
  updated_at: string;
  last_opened_at: string;
}

export interface ProjectSettings {
  theme?: string;
  auto_deploy?: boolean;
  default_agent_id?: string;
  [key: string]: unknown;
}

export interface File {
  id: string;
  project_id: string;
  path: string; // unique per project
  content: string;
  language: string | null; // e.g., 'typescript', 'css', 'html'
  created_by: 'user' | 'ai';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  project_id: string;
  role: MessageRole;
  content: string;
  metadata: MessageMetadata;
  created_at: string;
}

export type ExecutionMode = 'simple' | 'agents';

export interface MessageMetadata {
  execution_mode?: ExecutionMode; // Track which mode was used for this message
  execution_id?: string; // Link to execution if using agents mode
  plan?: {
    overall_strategy: string;
    tasks: Array<{
      title: string;
      description: string;
      status?: TaskStatus;
    }>;
  };
  specialized_agents?: Array<{
    id: string;
    name: string;
    type: string;
  }>; // Agents created by orchestrator
  thinking?: string;
  file_changes?: Array<{
    file_id: string;
    path: string;
    action: 'created' | 'updated' | 'deleted';
  }>;
  tools_used?: Array<{
    name: string;
    input: Record<string, unknown>;
    result?: unknown;
  }>; // Tools used in simple mode
  [key: string]: unknown;
}

export interface Task {
  id: string;
  team_id?: string; // For execution-based tasks (agents mode)
  project_id?: string; // For project-based tasks (simple mode)
  execution_id?: string; // For execution-based tasks (agents mode)
  message_id: string | null; // which AI message spawned this
  agent_id: string | null; // which agent executed this
  system_agent_id?: string | null; // for system agents (planner, orchestrator, logic_checker)
  title: string; // e.g., "Creating index.html"
  description: string | null; // e.g., "Added hero section, about section, contact form"
  input: string; // Task input (user prompt or task description)
  output?: string | null; // Task output (result from agent)
  result_type?: string | null; // Type of result (task_plan, logic_check, etc.)
  status: TaskStatus;
  type: TaskType;
  metadata: TaskMetadata;
  step_id?: string | null; // Inngest step ID for tracking within workflow
  attempts: number;
  created_at: string;
  completed_at: string | null;
}

export interface TaskMetadata {
  file_path?: string;
  command?: string;
  error?: string;
  diff?: {
    before: string;
    after: string;
  };
  [key: string]: unknown;
}

export interface SandboxSession {
  id: string;
  project_id: string;
  e2b_session_id: string; // unique - the actual E2B sandbox ID
  sandbox_id?: string; // Alias for e2b_session_id (for backward compatibility)
  template: string; // 'simple_site' | 'nextjs'
  status: SandboxStatus;
  url: string | null; // preview URL
  metadata: SandboxMetadata;
  created_at: string;
  expires_at: string;
  stopped_at: string | null;
}

export interface SandboxMetadata {
  port?: number;
  env_vars?: Record<string, string>;
  [key: string]: unknown;
}

export interface Deployment {
  id: string;
  project_id: string;
  version: number; // auto-increment per project
  url: string; // unique
  status: DeploymentStatus;
  snapshot: DeploymentSnapshot;
  build_logs: string | null;
  created_at: string;
}

export interface DeploymentSnapshot {
  files: Record<string, string>; // path -> content
  metadata?: {
    commit_sha?: string;
    [key: string]: unknown;
  };
}

// ============================================================================
// E2B SANDBOX TEMPLATES
// ============================================================================

export interface E2BTemplate {
  id: string; // template ID from E2B
  aliases: string[];
  buildCount: number;
  buildID: string | null;
  cpuCount: number;
  createdAt: string;
  createdBy: {
    email: string;
    id: string;
  };
  diskSizeMB: number;
  envdVersion: string | null;
  lastSpawnedAt: string | null;
  memoryMB: number;
  public: boolean;
  isSystem?: boolean; // System/curated templates
  spawnCount: number;
  templateID: string;
  updatedAt: string;
}

export interface CreateE2BTemplateRequest {
  alias: string;
  cpuCount?: number;
  memoryMB?: number;
  dockerfile?: string;
}

export interface UpdateE2BTemplateRequest {
  public?: boolean;
  isSystem?: boolean;
}

// ============================================================================
// LEGACY TYPES (for old schema compatibility)
// ============================================================================

export interface TaskPlannerOutput {
  overall_strategy: string;
  tasks: Array<{
    title: string;
    description: string;
    complexity?: string;
    dependencies?: number[]; // Array of task indices this task depends on
  }>;
}

export interface OrchestratorOutput {
  agents: Array<{
    name: string;
    type: string;
    system_prompt: string;
    user_prompt_template?: string;
    model?: string;
    config?: {
      temperature?: number;
      max_tokens?: number;
      [key: string]: unknown;
    };
  }>;
}

export interface LogicCheckResult {
  is_complete: boolean;
  feedback?: string;
  missing_items?: string[];
}

// ============================================================================
// INSERT TYPES (for creating new records)
// ============================================================================

export type InsertProfile = Omit<Profile, 'created_at' | 'updated_at'>;

export type InsertOrganization = Omit<Organization, 'id' | 'created_at' | 'updated_at'>;

export type InsertOrganizationMember = Omit<OrganizationMember, 'id' | 'created_at'>;

export type InsertAgent = Omit<Agent, 'id' | 'is_system' | 'created_at' | 'updated_at'>;

export type InsertWorkflow = Omit<Workflow, 'id' | 'created_at' | 'updated_at'>;

export type InsertExecution = Omit<Execution, 'id' | 'created_at' | 'completed_at'>;

export type InsertProject = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'last_opened_at'>;

export type InsertFile = Omit<File, 'id' | 'created_at' | 'updated_at'>;

export type InsertMessage = Omit<Message, 'id' | 'created_at'>;

export type InsertTask = Omit<Task, 'id' | 'created_at' | 'completed_at' | 'output' | 'result_type'>;

export type InsertSandboxSession = Omit<SandboxSession, 'id' | 'created_at' | 'stopped_at'>;

export type InsertDeployment = Omit<Deployment, 'id' | 'created_at'>;

// ============================================================================
// UPDATE TYPES (for updating records)
// ============================================================================

export type UpdateProfile = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;

export type UpdateOrganization = Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>;

export type UpdateAgent = Partial<Omit<Agent, 'id' | 'team_id' | 'is_system' | 'created_at' | 'updated_at'>>;

export type UpdateWorkflow = Partial<Omit<Workflow, 'id' | 'team_id' | 'created_at' | 'updated_at'>>;

export type UpdateExecution = Partial<Omit<Execution, 'id' | 'team_id' | 'created_at'>>;

export type UpdateProject = Partial<Omit<Project, 'id' | 'team_id' | 'created_at' | 'updated_at'>>;

export type UpdateFile = Partial<Omit<File, 'id' | 'project_id' | 'created_at' | 'updated_at'>>;

export type UpdateTask = Partial<Omit<Task, 'id' | 'project_id' | 'message_id' | 'agent_id' | 'created_at'>>;

export type UpdateSandboxSession = Partial<Omit<SandboxSession, 'id' | 'project_id' | 'e2b_session_id' | 'created_at'>>;

export type UpdateDeployment = Partial<Omit<Deployment, 'id' | 'project_id' | 'version' | 'created_at'>>;

// ============================================================================
// QUERY RESULT TYPES (with joins)
// ============================================================================

export interface ProjectWithFiles {
  project: Project;
  files: File[];
}

export interface MessageWithTasks {
  message: Message;
  tasks: Task[];
}

export interface OrganizationWithMembers {
  organization: Organization;
  members: Array<OrganizationMember & { profile: Profile }>;
}

export interface ProjectWithSandbox {
  project: Project;
  sandbox: SandboxSession | null;
}
