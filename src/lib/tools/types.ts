// ============================================================================
// TOOL SYSTEM TYPES - Model Agnostic
// ============================================================================

import type { Sandbox } from 'e2b';

/**
 * Universal tool definition (works with any LLM provider)
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required?: string[];
  };
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: ToolParameter;
  properties?: Record<string, ToolParameter>;
}

/**
 * Tool execution context (passed to all tool handlers)
 */
export interface ToolContext {
  projectId: string;
  sandbox?: Sandbox;
  userId?: string;
}

/**
 * Tool execution result
 */
export interface ToolResult {
  success: boolean;
  data?: Record<string, unknown> | unknown[];
  error?: string;
  metadata?: {
    filesChanged?: string[];
    commandOutput?: string;
    gitCommit?: string;
  };
}

/**
 * Tool handler function type
 */
export type ToolHandler = (
  input: Record<string, unknown>,
  context: ToolContext
) => Promise<ToolResult>;

/**
 * Complete tool with definition and handler
 */
export interface Tool {
  definition: ToolDefinition;
  handler: ToolHandler;
}

/**
 * Tool categories for organization
 */
export enum ToolCategory {
  FILE_OPERATIONS = 'file_operations',
  COMMAND_EXECUTION = 'command_execution',
  GIT_OPERATIONS = 'git_operations',
  PROJECT_MANAGEMENT = 'project_management',
  SEARCH = 'search',
  WEB = 'web',
}
