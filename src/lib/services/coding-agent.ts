/**
 * CODING AGENT - Inngest Agent-Kit Pattern
 *
 * Based on: https://github.com/inngest/agent-kit/tree/main/examples/e2b-coding-agent
 *
 * Single AI agent with E2B sandbox tools for direct code editing.
 * Used in "Simple Agent" mode in workspace.
 */

import {
  anthropic,
  createAgent,
  createNetwork,
  createTool,
  openai,
} from '@inngest/agent-kit'
import type { Sandbox } from 'e2b'
import { z } from 'zod'

export interface CodingAgentConfig {
  sandbox: Sandbox
  projectId: string
  workDir?: string
  model?: 'claude' | 'gpt'
  maxIterations?: number
  onProgress?: (message: string) => void
}

export interface CodingAgentResult {
  success: boolean
  output: string
  error?: string
}

/**
 * Detect programming language from file path
 */
function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
    sh: 'shell',
    bash: 'shell',
    mjs: 'javascript',
  }
  return langMap[ext || ''] || 'plaintext'
}

/**
 * Check if file is binary (should not be stored in database)
 */
function isBinaryFile(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase()
  const binaryExtensions = new Set([
    'ico', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp',
    'woff', 'woff2', 'ttf', 'eot', 'otf',
    'pdf', 'zip', 'tar', 'gz',
  ])
  return ext ? binaryExtensions.has(ext) : false
}

/**
 * Create a coding agent that can execute code in an E2B sandbox
 */
export async function createCodingAgent(config: CodingAgentConfig) {
  const { sandbox, projectId, workDir = '/home/user', model = 'claude', maxIterations = 15, onProgress } = config

  // Import redis realtime service
  const { publishWorkspaceMessage } = await import('./redis-realtime')

  const agent = createAgent({
    name: 'Coding Agent',
    description:
      'An expert coding agent for building and modifying web applications',
    system: `You are a coding agent helping the user build web applications.

You have access to an E2B sandbox where you can:
- Read and write files
- Run terminal commands
- Execute code

The project is located at: ${workDir}

When running commands:
- Always use 'cd ${workDir} &&' before your command if it's file-system related
- Keep in mind that the terminal is non-interactive, use the '-y' flag when needed
- File paths should be relative to ${workDir}

IMPORTANT:
- If the user just says hello or asks a simple question that doesn't require code changes, respond immediately without using tools.
- Only use tools when you need to read files, write code, or run commands.
- When you complete a task, wrap your summary in: <task_summary>[Your summary here]</task_summary>
- For conversational messages (greetings, questions, etc.), just respond naturally and include <task_summary> immediately.
`,
    model:
      model === 'claude'
        ? anthropic({
            model: 'claude-sonnet-4-5-20250929',
            defaultParameters: {
              max_tokens: 4096,
            },
          })
        : openai({
            model: 'gpt-5-mini',
            defaultParameters: {
              //max_completion_tokens: 4096,
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
          console.log('[Coding Agent] terminal:', command)
          onProgress?.(`Running: ${command}`)

          // Publish to terminal channel
          await publishWorkspaceMessage(projectId, 'terminal', {
            command,
            timestamp: Date.now(),
          })

          try {
            const result = await sandbox.commands.run(command)
            console.log('[Coding Agent] terminal result:', result.stdout)

            // Publish command output
            await publishWorkspaceMessage(projectId, 'terminal', {
              command,
              output: result.stdout || result.stderr,
              timestamp: Date.now(),
            })

            return result.stdout || result.stderr || 'Command completed'
          } catch (error) {
            const errorMsg = `Command failed: ${error}`
            console.error('[Coding Agent]', errorMsg)
            return errorMsg
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
          console.log(
            '[Coding Agent] createOrUpdateFiles:',
            files.map((f) => f.path)
          )
          onProgress?.(`Writing ${files.length} file(s)`)

          try {
            for (const file of files) {
              // Write to sandbox (git will track changes)
              await sandbox.files.write(file.path, file.content)
              console.log('[Coding Agent] Wrote file to sandbox:', file.path)

              // Publish file change to Redis for real-time UI updates
              await publishWorkspaceMessage(projectId, 'file-changes', {
                path: file.path,
                action: 'updated',
                timestamp: Date.now(),
              })
            }
            return `Files created/updated: ${files.map((f) => f.path).join(', ')}`
          } catch (error) {
            const errorMsg = `File operation failed: ${error}`
            console.error('[Coding Agent]', errorMsg)
            return errorMsg
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
          console.log('[Coding Agent] readFiles:', files)
          onProgress?.(`Reading ${files.length} file(s)`)

          try {
            const contents = []
            for (const filePath of files) {
              const content = await sandbox.files.read(filePath)
              contents.push({ path: filePath, content })
            }
            return JSON.stringify(contents, null, 2)
          } catch (error) {
            const errorMsg = `File read failed: ${error}`
            console.error('[Coding Agent]', errorMsg)
            return errorMsg
          }
        },
      }),

      // Run code in sandbox (Python/JS)
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
          console.log('[Coding Agent] runCode:', language)
          onProgress?.(`Executing ${language} code`)

          try {
            if (language === 'python') {
              // @ts-expect-error - E2B has runCode for Python
              const result = await sandbox.runCode(code)
              return (
                result.logs.stdout.join('\n') || result.logs.stderr.join('\n')
              )
            } else {
              // For JS, run via node
              const result = await sandbox.commands.run(
                `node -e "${code.replace(/"/g, '\\"')}"`
              )
              return result.stdout || result.stderr
            }
          } catch (error) {
            const errorMsg = `Code execution failed: ${error}`
            console.error('[Coding Agent]', errorMsg)
            return errorMsg
          }
        },
      }),
    ],
    lifecycle: {
      onResponse: async ({ result, network }) => {
        // Check if task is complete
        const lastMessage = result.output[result.output.length - 1]
        if (
          lastMessage?.type === 'text' &&
          typeof lastMessage.content === 'string'
        ) {
          // Publish agent response to messages channel
          await publishWorkspaceMessage(projectId, 'messages', {
            message: lastMessage.content,
          })

          if (lastMessage.content.includes('<task_summary>')) {
            network?.state.kv.set('task_summary', lastMessage.content)
          }
        }
        return result
      },
    },
  })

  const network = createNetwork({
    name: 'coding-agent-network',
    agents: [agent],
    maxIter: maxIterations,
    defaultRouter: ({ network, callCount, lastResult }) => {
      console.log(`[Coding Agent] Iteration #${callCount}`)
      onProgress?.(`Iteration ${callCount}`)

      // Stop if task summary found
      if (network?.state.kv.has('task_summary')) {
        return // Stop execution
      }

      // Stop if the last response didn't use any tools (pure conversation)
      if (lastResult && callCount > 0) {
        const hasToolCalls = lastResult.output.some((msg) => 'type' in msg && msg.type === 'tool_call')

        // If no tool calls in this iteration, assume conversation is done
        if (!hasToolCalls) {
          console.log('[Coding Agent] No tool calls detected, stopping')
          const lastText = lastResult.output.find((msg) => 'type' in msg && msg.type === 'text')
          if (lastText && 'content' in lastText) {
            network?.state.kv.set('task_summary', lastText.content)
          }
          return // Stop execution
        }
      }

      return agent
    },
  })

  return network
}

/**
 * Run a coding task using the agent
 */
export async function runCodingTask(
  prompt: string,
  config: CodingAgentConfig
): Promise<CodingAgentResult> {
  try {
    const network = await createCodingAgent(config)
    const result = await network.run(prompt)

    const summary = result.state.kv.get('task_summary') as string | undefined

    return {
      success: true,
      output: summary || 'Task completed',
    }
  } catch (error) {
    console.error('[Coding Agent] Task failed:', error)
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
