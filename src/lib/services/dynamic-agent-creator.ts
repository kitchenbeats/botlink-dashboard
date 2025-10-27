/**
 * Dynamic Agent Creator
 *
 * Allows the orchestrator to create specialized agents on-the-fly
 * This is the key feature that makes Agent-Kit powerful for our use case
 */

import { createAgent, createTool, anthropic, openai } from '@inngest/agent-kit';
import type { Sandbox } from 'e2b';
import { z } from 'zod';
import { createAgentEventEmitter } from './agent-events';

export interface DynamicAgentConfig {
  projectId: string;
  sandbox: Sandbox;
  workDir: string;
}

export interface AgentDefinition {
  name: string;
  role: string;
  systemPrompt: string;
  tools: string[]; // Tool names: 'terminal', 'fileOps', 'readFiles', etc.
  model?: string; // 'claude-sonnet-4-5', 'claude-haiku-4-5', 'gpt-5', 'gpt-5-mini'
}

/**
 * Get available tools that can be assigned to agents
 */
export function getAvailableTools(config: DynamicAgentConfig) {
  const { projectId, sandbox, workDir } = config;
  const events = createAgentEventEmitter(projectId);

  // Terminal execution tool
  const terminalTool = createTool({
    name: 'terminal',
    description: 'Execute commands in the sandbox terminal',
    parameters: z.object({
      command: z.string().describe('The command to execute'),
    }),
    handler: async ({ command }) => {
      await events.emitToolCalled({ name: 'terminal', args: { command } });

      try {
        const result = await sandbox.commands.run(command);
        const output = result.stdout || result.stderr || 'Command completed';

        await events.emitToolCompleted({ name: 'terminal', result: output });
        return output;
      } catch (error) {
        const errorMsg = `Command failed: ${error}`;
        await events.emitToolFailed({ name: 'terminal', error: errorMsg });
        return errorMsg;
      }
    },
  });

  // File operations tool (read/write/list)
  const fileOpsTool = createTool({
    name: 'fileOps',
    description: 'Read, write, or list files in the sandbox',
    parameters: z.object({
      operation: z.enum(['read', 'write', 'list']),
      path: z.string().optional(),
      content: z.string().optional(),
    }),
    handler: async ({ operation, path, content }) => {
      await events.emitToolCalled({ name: 'fileOps', args: { operation, path } });

      try {
        if (operation === 'read' && path) {
          const result = await sandbox.files.read(path);
          await events.emitToolCompleted({ name: 'fileOps', result: `Read ${path}` });
          return result;
        } else if (operation === 'write' && path && content) {
          await sandbox.files.write(path, content);
          await events.emitToolCompleted({ name: 'fileOps', result: `Wrote ${path}` });
          return `Successfully wrote ${path}`;
        } else if (operation === 'list') {
          const result = await sandbox.commands.run(`ls -la ${path || workDir}`);
          await events.emitToolCompleted({ name: 'fileOps', result: 'Listed files' });
          return result.stdout;
        }

        return 'Invalid operation';
      } catch (error) {
        const errorMsg = `File operation failed: ${error}`;
        await events.emitToolFailed({ name: 'fileOps', error: errorMsg });
        return errorMsg;
      }
    },
  });

  // Search files tool
  const searchFilesTool = createTool({
    name: 'searchFiles',
    description: 'Search for files by name or content',
    parameters: z.object({
      query: z.string().describe('Search query'),
      type: z.enum(['name', 'content']).describe('Search by filename or file content'),
    }),
    handler: async ({ query, type }) => {
      await events.emitToolCalled({ name: 'searchFiles', args: { query, type } });

      try {
        const command = type === 'name'
          ? `find ${workDir} -name "*${query}*" -type f`
          : `grep -r "${query}" ${workDir} || true`;

        const result = await sandbox.commands.run(command);
        await events.emitToolCompleted({ name: 'searchFiles', result: 'Search complete' });
        return result.stdout || 'No results found';
      } catch (error) {
        const errorMsg = `Search failed: ${error}`;
        await events.emitToolFailed({ name: 'searchFiles', error: errorMsg });
        return errorMsg;
      }
    },
  });

  // Git operations tool
  const gitTool = createTool({
    name: 'git',
    description: 'Execute git commands',
    parameters: z.object({
      command: z.string().describe('Git command (e.g., "status", "diff", "add .", "commit -m \'message\'"'),
    }),
    handler: async ({ command }) => {
      await events.emitToolCalled({ name: 'git', args: { command } });

      try {
        const result = await sandbox.commands.run(`cd ${workDir} && git ${command}`);
        const output = result.stdout || result.stderr || 'Git command completed';

        await events.emitToolCompleted({ name: 'git', result: output });
        return output;
      } catch (error) {
        const errorMsg = `Git command failed: ${error}`;
        await events.emitToolFailed({ name: 'git', error: errorMsg });
        return errorMsg;
      }
    },
  });

  return {
    terminal: terminalTool,
    fileOps: fileOpsTool,
    searchFiles: searchFilesTool,
    git: gitTool,
  };
}

/**
 * Get tools by their names
 */
export function getToolsByNames(toolNames: string[], config: DynamicAgentConfig) {
  const availableTools = getAvailableTools(config);

  return toolNames
    .filter(name => name in availableTools)
    .map(name => availableTools[name as keyof typeof availableTools]);
}

/**
 * Create a new agent dynamically
 */
export function createDynamicAgent(
  definition: AgentDefinition,
  config: DynamicAgentConfig
) {
  const { name, role, systemPrompt, tools, model = 'claude-haiku-4-5' } = definition;

  // Get the requested tools
  const agentTools = getToolsByNames(tools, config);

  // Get model config
  const modelConfig = model.includes('claude')
    ? anthropic({
        model: model === 'claude-sonnet-4-5' ? 'claude-sonnet-4-5' : 'claude-haiku-4-5',
        defaultParameters: { max_tokens: 8192 }
      })
    : openai({
        model: model === 'gpt-5' ? 'gpt-5' : 'gpt-5-mini'
      });

  // Create the agent
  const agent = createAgent({
    name,
    description: role,
    system: systemPrompt,
    model: modelConfig,
    tools: agentTools,
  });

  return agent;
}

/**
 * Create the createAgent tool for the orchestrator
 */
export function createAgentCreatorTool(config: DynamicAgentConfig) {
  const { projectId } = config;

  return createTool({
    name: 'createAgent',
    description: `Create a new specialized agent to handle a specific task.

Use this when you need expertise in a specific domain that isn't covered by existing agents.

Examples:
- "CSS Specialist" for styling complex layouts
- "API Integration Expert" for third-party API work
- "Security Auditor" for checking vulnerabilities
- "Performance Optimizer" for speed improvements
- "Database Designer" for schema design

The new agent will have access to the tools you specify and can work independently.`,
    parameters: z.object({
      name: z.string().describe('Agent name (e.g., "CSS Specialist", "API Expert")'),
      role: z.string().describe('Brief description of the agent\'s role and expertise'),
      systemPrompt: z.string().describe('Detailed system prompt defining the agent\'s capabilities, knowledge, and behavior'),
      tools: z.array(z.enum(['terminal', 'fileOps', 'searchFiles', 'git'])).describe('Tools this agent should have access to'),
      model: z.enum(['claude-haiku-4-5', 'claude-sonnet-4-5', 'gpt-5-mini', 'gpt-5']).optional().describe('Model to use (default: claude-haiku-4-5)'),
    }),
    handler: async ({ name, role, systemPrompt, tools, model }) => {
      console.log(`[Dynamic Agent] Creating new agent: ${name}`);

      const events = createAgentEventEmitter(projectId);
      await events.emitToolCalled({ name: 'createAgent', args: { name, role } });

      try {
        // Create the agent
        const agent = createDynamicAgent(
          { name, role, systemPrompt, tools, model },
          config
        );

        // Store in database
        const { createCustomAgent } = await import('@/lib/db/agents');
        await createCustomAgent({
          project_id: projectId,
          name,
          role,
          system_prompt: systemPrompt,
          model: model || 'claude-haiku-4-5',
          tools: tools as string[],
          type: 'custom',
        });

        const result = `✅ Created "${name}" agent
Role: ${role}
Tools: ${tools.join(', ')}
Model: ${model || 'claude-haiku-4-5'}

The agent is now available in the network and can be delegated tasks.`;

        await events.emitToolCompleted({ name: 'createAgent', result });

        // Return both the result and the agent
        return { result, agent };
      } catch (error) {
        const errorMsg = `Failed to create agent: ${error}`;
        console.error('[Dynamic Agent]', errorMsg);
        await events.emitToolFailed({ name: 'createAgent', error: errorMsg });
        return { result: errorMsg, agent: null };
      }
    },
  });
}
