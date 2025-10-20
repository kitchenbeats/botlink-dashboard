/**
 * Custom Agent Loader
 * Dynamically creates Inngest agents from database configurations
 */

import {
  anthropic,
  openai,
  createAgent,
  createTool,
  type Agent,
  type StateData,
} from '@inngest/agent-kit';
import { z } from 'zod';
import type { Sandbox } from 'e2b';

interface AgentConfig {
  id: string;
  name: string;
  model: string;
  system_prompt: string;
  config: {
    provider: 'anthropic' | 'openai';
    temperature: number;
    max_tokens: number;
    tools: string[]; // Tool IDs like ['terminal', 'files', 'code']
  };
}

/**
 * Get the appropriate model instance based on provider
 */
function getModelInstance(provider: string, model: string, temperature: number, maxTokens: number) {
  if (provider === 'anthropic') {
    return anthropic({
      model,
      defaultParameters: {
        max_tokens: maxTokens,
        temperature,
      },
    });
  }

  if (provider === 'openai') {
    return openai({
      model,
      defaultParameters: {
        temperature,
        // max_completion_tokens: maxTokens,
      },
    });
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

/**
 * Create tools based on tool IDs
 */
function createToolsForAgent(toolIds: string[], sandbox?: Sandbox, onProgress?: (message: string) => void) {
  const tools = [];

  if (toolIds.includes('terminal') && sandbox) {
    tools.push(
      createTool({
        name: 'terminal',
        description: 'Execute commands in the sandbox terminal',
        parameters: z.object({
          command: z.string().describe('The command to execute'),
        }),
        handler: async ({ command }) => {
          console.log('[Custom Agent] terminal:', command);
          onProgress?.(`Running: ${command}`);

          try {
            const result = await sandbox.commands.run(command);
            return result.stdout || result.stderr || 'Command completed';
          } catch (error) {
            return `Command failed: ${error}`;
          }
        },
      })
    );
  }

  if (toolIds.includes('files') && sandbox) {
    tools.push(
      createTool({
        name: 'createOrUpdateFiles',
        description: 'Create or update multiple files in the sandbox',
        parameters: z.object({
          files: z.array(
            z.object({
              path: z.string().describe('File path relative to project root'),
              content: z.string().describe('File content'),
            })
          ),
        }),
        handler: async ({ files }) => {
          console.log('[Custom Agent] createOrUpdateFiles:', files.map((f) => f.path));
          onProgress?.(`Writing ${files.length} file(s)`);

          try {
            for (const file of files) {
              await sandbox.files.write(file.path, file.content);
            }
            return `Files created/updated: ${files.map((f) => f.path).join(', ')}`;
          } catch (error) {
            return `File operation failed: ${error}`;
          }
        },
      }),
      createTool({
        name: 'readFiles',
        description: 'Read contents of multiple files from the sandbox',
        parameters: z.object({
          files: z.array(z.string()).describe('Array of file paths to read'),
        }),
        handler: async ({ files }) => {
          console.log('[Custom Agent] readFiles:', files);
          onProgress?.(`Reading ${files.length} file(s)`);

          try {
            const contents = [];
            for (const filePath of files) {
              const content = await sandbox.files.read(filePath);
              contents.push({ path: filePath, content });
            }
            return JSON.stringify(contents, null, 2);
          } catch (error) {
            return `File read failed: ${error}`;
          }
        },
      })
    );
  }

  if (toolIds.includes('code') && sandbox) {
    tools.push(
      createTool({
        name: 'runCode',
        description: 'Execute Python or JavaScript code in the sandbox',
        parameters: z.object({
          code: z.string().describe('Code to execute'),
          language: z
            .enum(['python', 'javascript'])
            .optional()
            .describe('Programming language (default: python)'),
        }),
        handler: async ({ code, language = 'python' }) => {
          console.log('[Custom Agent] runCode:', language);
          onProgress?.(`Executing ${language} code`);

          try {
            if (language === 'python') {
              // @ts-expect-error - E2B has runCode for Python
              const result = await sandbox.runCode(code);
              return result.logs.stdout.join('\n') || result.logs.stderr.join('\n');
            } else {
              const result = await sandbox.commands.run(
                `node -e "${code.replace(/"/g, '\\"')}"`
              );
              return result.stdout || result.stderr;
            }
          } catch (error) {
            return `Code execution failed: ${error}`;
          }
        },
      })
    );
  }

  // Web search tool (no sandbox needed)
  if (toolIds.includes('web')) {
    tools.push(
      createTool({
        name: 'webSearch',
        description: 'Search the internet for information',
        parameters: z.object({
          query: z.string().describe('Search query'),
        }),
        handler: async ({ query }) => {
          console.log('[Custom Agent] webSearch:', query);
          onProgress?.(`Searching for: ${query}`);

          // TODO: Implement actual web search (Tavily, Serper, etc)
          return `Web search for "${query}" - (Integration pending)`;
        },
      })
    );
  }

  return tools;
}

/**
 * Load and create an Inngest agent from database configuration
 */
export async function loadCustomAgent(
  agentConfig: AgentConfig,
  sandbox?: Sandbox,
  onProgress?: (message: string) => void
): Promise<Agent<StateData>> {
  const { name, model, system_prompt, config } = agentConfig;

  const modelInstance = getModelInstance(
    config.provider,
    model,
    config.temperature,
    config.max_tokens
  );

  const tools = createToolsForAgent(config.tools, sandbox, onProgress);

  const agent = createAgent({
    name,
    description: `Custom agent: ${name}`,
    system: system_prompt,
    model: modelInstance,
    tools,
  });

  console.log(`[Custom Agent Loader] Loaded agent: ${name} (${config.provider}/${model})`);

  return agent;
}
