/**
 * CODING AGENT - Inngest Agent-Kit Pattern
 *
 * Based on: https://github.com/inngest/agent-kit/tree/main/examples/e2b-coding-agent
 *
 * Single AI agent with E2B sandbox tools for direct code editing.
 * Used in "Simple Agent" mode in workspace.
 */

import { z } from 'zod';
import {
  createAgent,
  createNetwork,
  createTool,
  anthropic,
  openai,
} from '@inngest/agent-kit';
import type { Sandbox } from 'e2b';

export interface CodingAgentConfig {
  sandbox: Sandbox;
  model?: 'claude' | 'gpt';
  maxIterations?: number;
  onProgress?: (message: string) => void;
}

export interface CodingAgentResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Create a coding agent that can execute code in an E2B sandbox
 */
export async function createCodingAgent(config: CodingAgentConfig) {
  const {
    sandbox,
    model = 'claude',
    maxIterations = 15,
    onProgress,
  } = config;

  const agent = createAgent({
    name: 'Coding Agent',
    description: 'An expert coding agent for building and modifying web applications',
    system: `You are a coding agent helping the user build web applications.

You have access to an E2B sandbox where you can:
- Read and write files
- Run terminal commands
- Execute code

When running commands, keep in mind that the terminal is non-interactive, use the '-y' flag when needed.

Think step-by-step before starting tasks. When you complete a task, wrap your summary in:
<task_summary>
[Your summary here]
</task_summary>
`,
    model: model === 'claude'
      ? anthropic({
          model: 'claude-sonnet-4-5-20250929',
          defaultParameters: {
            max_tokens: 4096,
          },
        })
      : openai({
          model: 'gpt-4-turbo-preview',
          defaultParameters: {
            max_tokens: 4096,
          },
        }),
    tools: [
      // Terminal command execution
      createTool({
        name: 'terminal',
        description: 'Execute commands in the sandbox terminal',
        parameters: z.object({
          command: z.string().describe('The command to execute'),
        }),
        handler: async ({ command }) => {
          console.log('[Coding Agent] terminal:', command);
          onProgress?.(`Running: ${command}`);

          try {
            const result = await sandbox.commands.run(command);
            console.log('[Coding Agent] terminal result:', result.stdout);
            return result.stdout || result.stderr || 'Command completed';
          } catch (error) {
            const errorMsg = `Command failed: ${error}`;
            console.error('[Coding Agent]', errorMsg);
            return errorMsg;
          }
        },
      }),

      // Create or update files
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
          console.log('[Coding Agent] createOrUpdateFiles:', files.map(f => f.path));
          onProgress?.(`Writing ${files.length} file(s)`);

          try {
            for (const file of files) {
              await sandbox.files.write(file.path, file.content);
            }
            return `Files created/updated: ${files.map(f => f.path).join(', ')}`;
          } catch (error) {
            const errorMsg = `File operation failed: ${error}`;
            console.error('[Coding Agent]', errorMsg);
            return errorMsg;
          }
        },
      }),

      // Read files
      createTool({
        name: 'readFiles',
        description: 'Read contents of multiple files from the sandbox',
        parameters: z.object({
          files: z.array(z.string()).describe('Array of file paths to read'),
        }),
        handler: async ({ files }) => {
          console.log('[Coding Agent] readFiles:', files);
          onProgress?.(`Reading ${files.length} file(s)`);

          try {
            const contents = [];
            for (const filePath of files) {
              const content = await sandbox.files.read(filePath);
              contents.push({ path: filePath, content });
            }
            return JSON.stringify(contents, null, 2);
          } catch (error) {
            const errorMsg = `File read failed: ${error}`;
            console.error('[Coding Agent]', errorMsg);
            return errorMsg;
          }
        },
      }),

      // Run code in sandbox (Python/JS)
      createTool({
        name: 'runCode',
        description: 'Execute Python or JavaScript code in the sandbox',
        parameters: z.object({
          code: z.string().describe('Code to execute'),
          language: z.enum(['python', 'javascript']).optional().describe('Programming language (default: python)'),
        }),
        handler: async ({ code, language = 'python' }) => {
          console.log('[Coding Agent] runCode:', language);
          onProgress?.(`Executing ${language} code`);

          try {
            if (language === 'python') {
              // @ts-ignore - E2B has runCode for Python
              const result = await sandbox.runCode(code);
              return result.logs.stdout.join('\n') || result.logs.stderr.join('\n');
            } else {
              // For JS, run via node
              const result = await sandbox.commands.run(`node -e "${code.replace(/"/g, '\\"')}"`);
              return result.stdout || result.stderr;
            }
          } catch (error) {
            const errorMsg = `Code execution failed: ${error}`;
            console.error('[Coding Agent]', errorMsg);
            return errorMsg;
          }
        },
      }),
    ],
    lifecycle: {
      onResponse: async ({ result, network }) => {
        // Check if task is complete
        const lastMessage = result.output[result.output.length - 1];
        if (lastMessage?.type === 'text' && typeof lastMessage.content === 'string') {
          if (lastMessage.content.includes('<task_summary>')) {
            network?.state.kv.set('task_summary', lastMessage.content);
          }
        }
        return result;
      },
    },
  });

  const network = createNetwork({
    name: 'coding-agent-network',
    agents: [agent],
    maxIter: maxIterations,
    defaultRouter: ({ network, callCount }) => {
      console.log(`[Coding Agent] Iteration #${callCount}`);
      onProgress?.(`Iteration ${callCount}`);

      if (network?.state.kv.has('task_summary')) {
        return; // Stop execution
      }
      return agent;
    },
  });

  return network;
}

/**
 * Run a coding task using the agent
 */
export async function runCodingTask(
  prompt: string,
  config: CodingAgentConfig
): Promise<CodingAgentResult> {
  try {
    const network = await createCodingAgent(config);
    const result = await network.run(prompt);

    const summary = result.state.kv.get('task_summary') as string | undefined;

    return {
      success: true,
      output: summary || 'Task completed',
    };
  } catch (error) {
    console.error('[Coding Agent] Task failed:', error);
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
