import { createClient } from '@/lib/clients/supabase/server';

/**
 * Database service layer
 * Provides type-safe database operations with error handling
 */

// Re-export types (selective to avoid conflicts)
export type {
  Profile,
  Organization,
  OrganizationMember,
  Agent,
  AgentConfig,
  AgentType,
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  Execution,
  ExecutionStatus,
  Project,
  ProjectTemplate,
  ProjectSettings,
  File,
  Message,
  MessageRole,
  Task,
  TaskStatus,
  TaskType,
  TaskMetadata,
  SandboxSession,
  SandboxStatus,
  Deployment,
  DeploymentStatus,
  // Note: ProjectWithFiles is exported from ./projects
} from '../types/database';

// Get Supabase client (server-side)
// Return type is inferred from createClient() to maintain type compatibility
export async function getDb() {
  return createClient();
}

// Error handling wrapper
export async function handleDbError<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Better error logging - extract all useful properties
    const errorInfo = error instanceof Error
      ? {
          message: error.message,
          name: error.name,
          stack: error.stack,
          ...(error as any), // Include any additional properties
        }
      : error;

    console.error(`[DB Error] ${context}:`, errorInfo);
    // Re-throw the actual error instead of hiding it
    throw error;
  }
}

// Re-export all repositories
export * from './teams'; // E2B architecture - teams instead of organizations
export * from './projects';
export * from './files';
export * from './messages';
export * from './tasks';
export * from './agents';
export * from './sandboxes';
export * from './deployments';
export * from './workflows';
export * from './executions';
