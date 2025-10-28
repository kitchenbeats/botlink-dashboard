/**
 * SIMPLE AGENT - Conversational AI with Tools
 *
 * Direct user interaction with AI powered by Inngest Agent-Kit
 * Uses Inngest's createAgent/createTool for proper typing
 * Streams messages in real-time to the UI via Redis
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
import { publishWorkspaceMessage } from './redis-realtime'
import { simpleAgentPrompt } from '@/configs/prompts/simple-agent'

export interface SimpleAgentConfig {
  sandbox: Sandbox
  projectId: string
  model?: 'claude' | 'gpt'
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}

/**
 * Run the simple conversational agent with Inngest Agent-Kit
 */
export async function runSimpleAgent(
  userMessage: string,
  config: SimpleAgentConfig
) {
  const {
    sandbox,
    projectId,
    model = 'claude',
    conversationHistory = [],
  } = config

  // Get the sandbox URL for Next.js MCP endpoint
  const sandboxUrl = sandbox.getHost(3000)
  const nextjsMcpUrl = `https://${sandboxUrl}/_next/mcp`

  // Create conversational agent with Inngest tools
  const agent = createAgent({
    name: simpleAgentPrompt.name,
    description: simpleAgentPrompt.description,
    system: simpleAgentPrompt.systemPrompt,
    model:
      model === 'claude'
        ? anthropic({
            model: 'claude-sonnet-4-5-20250929',
            defaultParameters: {
              max_tokens: 4096,
            },
          })
        : openai({
            model: 'gpt-4o',
            defaultParameters: {
              max_completion_tokens: 4096,
            },
          }),
    tools: [
      // Read file tool
      createTool({
        name: 'read_file',
        description: 'Read the complete contents of a file in the project',
        parameters: z.object({
          path: z.string().describe('Path to the file relative to project root (e.g., "src/App.tsx")'),
        }),
        handler: async ({ path }) => {
          // Publish status update
          await publishWorkspaceMessage(projectId, 'status', {
            status: 'reading',
            message: `Reading file: ${path}`,
            timestamp: Date.now(),
          })

          try {
            const content = await sandbox.files.read(path)
            return { path, content }
          } catch (error) {
            return `Error reading file: ${error}`
          }
        },
      }),

      // Write file tool
      createTool({
        name: 'write_file',
        description: 'Create a new file or completely overwrite an existing file with new content',
        parameters: z.object({
          path: z.string().describe('Path where the file should be created/updated'),
          content: z.string().describe('Complete content to write to the file'),
        }),
        handler: async ({ path, content }) => {
          // Publish status update
          await publishWorkspaceMessage(projectId, 'status', {
            status: 'writing',
            message: `Writing file: ${path}`,
            timestamp: Date.now(),
          })

          try {
            await sandbox.files.write(path, content)

            // Publish file change event for real-time UI updates
            await publishWorkspaceMessage(projectId, 'file-changes', {
              path,
              action: 'updated',
              timestamp: Date.now(),
            })

            return `File written successfully: ${path}`
          } catch (error) {
            return `Error writing file: ${error}`
          }
        },
      }),

      // Delete file tool
      createTool({
        name: 'delete_file',
        description: 'Delete a file from the project',
        parameters: z.object({
          path: z.string().describe('Path to the file to delete'),
        }),
        handler: async ({ path }) => {
          // Publish status update
          await publishWorkspaceMessage(projectId, 'status', {
            status: 'deleting',
            message: `Deleting file: ${path}`,
            timestamp: Date.now(),
          })

          try {
            await sandbox.files.remove(path)

            // Publish file change event
            await publishWorkspaceMessage(projectId, 'file-changes', {
              path,
              action: 'deleted',
              timestamp: Date.now(),
            })

            return `File deleted successfully: ${path}`
          } catch (error) {
            return `Error deleting file: ${error}`
          }
        },
      }),

      // List files tool
      createTool({
        name: 'list_files',
        description: 'Get a list of all files in the project directory',
        parameters: z.object({
          directory: z.string().optional().describe('Directory to list (defaults to project root)'),
        }),
        handler: async ({ directory = '/home/user' }) => {
          // Publish status update
          await publishWorkspaceMessage(projectId, 'status', {
            status: 'listing',
            message: `Listing files in: ${directory}`,
            timestamp: Date.now(),
          })

          try {
            const files = await sandbox.files.list(directory)
            return JSON.stringify(files.map(f => ({ path: f.path, type: f.type })), null, 2)
          } catch (error) {
            return `Error listing files: ${error}`
          }
        },
      }),

      // Execute command tool
      createTool({
        name: 'execute_command',
        description: 'Execute a terminal command in the sandbox',
        parameters: z.object({
          command: z.string().describe('The command to execute'),
        }),
        handler: async ({ command }) => {
          // Publish status update
          await publishWorkspaceMessage(projectId, 'status', {
            status: 'executing',
            message: `Executing command: ${command}`,
            timestamp: Date.now(),
          })

          // Publish terminal event
          await publishWorkspaceMessage(projectId, 'terminal', {
            command,
            timestamp: Date.now(),
          })

          try {
            const result = await sandbox.commands.run(command)

            // Publish command output
            await publishWorkspaceMessage(projectId, 'terminal', {
              command,
              output: result.stdout || result.stderr,
              timestamp: Date.now(),
            })

            return result.stdout || result.stderr || 'Command completed'
          } catch (error) {
            return `Command failed: ${error}`
          }
        },
      }),

      // Install package tool
      createTool({
        name: 'install_package',
        description: 'Install an npm package in the project',
        parameters: z.object({
          package: z.string().describe('Package name to install (e.g., "react", "lodash")'),
          dev: z.boolean().optional().describe('Install as dev dependency'),
        }),
        handler: async ({ package: packageName, dev = false }) => {
          // Publish status update
          await publishWorkspaceMessage(projectId, 'status', {
            status: 'installing',
            message: `Installing package: ${packageName}${dev ? ' (dev)' : ''}`,
            timestamp: Date.now(),
          })

          const command = dev ? `npm install -D ${packageName}` : `npm install ${packageName}`

          try {
            const result = await sandbox.commands.run(command)
            return `Package installed: ${packageName}`
          } catch (error) {
            return `Failed to install package: ${error}`
          }
        },
      }),
    ],
    mcpServers: [
      {
        name: 'nextjs',
        transport: {
          type: 'sse',
          url: nextjsMcpUrl,
        },
      },
      {
        name: 'vercel',
        transport: {
          type: 'streamable-http',
          url: 'https://mcp.vercel.com/',
        },
      },
      {
        name: 'supabase',
        transport: {
          type: 'streamable-http',
          url: 'https://mcp.supabase.com/mcp',
        },
      },
    ],
    // Note: We don't use onResponse lifecycle hook here because it would publish
    // every intermediate response during agent execution, causing duplicate messages.
    // Instead, we return the final response and let sendChatMessage() save it to the database.
  })

  // Create network with the agent
  const network = createNetwork({
    name: 'simple-chat-network',
    agents: [agent],
    maxIter: 10, // Max 10 tool calls
    defaultRouter: ({ network, callCount, lastResult }) => {
      // Stop if we've already marked as complete
      if (network?.state.kv.has('final_response')) {
        return // Stop execution
      }

      // After first agent response, check if we should stop
      if (lastResult) {
        const lastText = lastResult.output.find(msg => msg.type === 'text')
        const hasToolCalls = lastResult.output.some(msg => msg.type === 'tool_call')

        // Track if any tools were used during this execution
        if (hasToolCalls) {
          network?.state.kv.set('used_tools', true)
        }

        if (lastText && lastText.type === 'text') {
          const content = typeof lastText.content === 'string' ? lastText.content : ''

          // Stop if response tag found (explicit completion)
          if (content.includes('<response>')) {
            network?.state.kv.set('final_response', content)
            return // Stop execution
          }

          // Stop if agent responded without tool calls (like a greeting)
          // This prevents infinite looping on simple conversational messages
          if (!hasToolCalls && callCount >= 1) {
            network?.state.kv.set('final_response', content)
            return // Stop execution
          }
        }

        // Stop if we have tool results but no new text response
        // This means the agent is done processing
        if (!lastText && callCount > 1) {
          return // Stop execution
        }
      }

      // Continue to next iteration
      return agent
    },
  })

  // Build prompt with conversation history
  const historyText = conversationHistory.length > 0
    ? conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')
    : ''

  const fullPrompt = historyText
    ? `${historyText}\n\nuser: ${userMessage}`
    : userMessage

  // Run the agent
  try {
    // Publish initial status
    await publishWorkspaceMessage(projectId, 'status', {
      status: 'thinking',
      message: 'Agent is thinking...',
      timestamp: Date.now(),
    })

    const result = await network.run(fullPrompt)
    const finalResponse = result.state.kv.get('final_response') as string | undefined
    const usedTools = result.state.kv.get('used_tools') as boolean | undefined

    // Extract clean response (remove tags if present)
    let content = finalResponse || 'Task completed'
    const match = content.match(/<response>([\s\S]*?)<\/response>/)
    if (match && match[1]) {
      content = match[1].trim()
    }

    // Only publish completion status if tools were used (actual task work)
    // For simple chat (no tools), don't show "task completed" message
    if (usedTools) {
      await publishWorkspaceMessage(projectId, 'status', {
        status: 'completed',
        message: 'Task completed',
        timestamp: Date.now(),
      })
    }

    return {
      success: true,
      content,
      usedTools: usedTools || false,
    }
  } catch (error) {
    console.error('[Simple Agent] Error:', error)

    // Publish error status
    await publishWorkspaceMessage(projectId, 'status', {
      status: 'error',
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: Date.now(),
    })

    return {
      success: false,
      content: `Error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
