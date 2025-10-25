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
import { publishWorkspaceMessage } from './redis-realtime'
import { kv } from '@/lib/clients/kv'

export interface CodingAgentConfig {
  sandbox: Sandbox
  projectId: string
  workDir?: string
  model?: 'claude' | 'gpt'
  maxIterations?: number
  reviewMode?: 'limited' | 'loop' | 'off'
  maxReviewIterations?: number
  onProgress?: (message: string) => void
}

export interface FileChange {
  path: string
  action: 'created' | 'updated' | 'deleted'
  language?: string
}

export interface CommandExecution {
  command: string
  output: string
  success: boolean
}

export interface CodingAgentResult {
  success: boolean
  output: string // Human-readable summary
  error?: string

  // Structured data for UI
  structured?: {
    summary: string
    fileChanges: FileChange[]
    commandsRun: CommandExecution[]
    toolsUsed: string[]
    thinkingProcess?: string
    errors: string[]
  }
}

/**
 * Parse agent's JSON response from <task_summary> tags
 */
function parseAgentResponse(summary: string): {
  message: string
  summary?: string
  nextSteps?: string[]
  notes?: string[]
} {
  try {
    // Extract JSON from <task_summary>...</task_summary>
    const match = summary.match(/<task_summary>\s*({[\s\S]*?})\s*<\/task_summary>/);

    if (match && match[1]) {
      const parsed = JSON.parse(match[1]);
      return {
        message: parsed.message || summary,
        summary: parsed.summary,
        nextSteps: parsed.nextSteps,
        notes: parsed.notes
      };
    }
  } catch (error) {
    console.error('[Coding Agent] Failed to parse JSON response:', error);
  }

  // Fallback: return raw summary as message
  return { message: summary };
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

  // Helper to resolve paths relative to workDir
  const resolvePath = (filePath: string): string => {
    // If path is already absolute, return as-is
    if (filePath.startsWith('/')) return filePath
    // Otherwise, prepend workDir
    return `${workDir}/${filePath}`
  }

  // Import services
  const { publishWorkspaceMessage } = await import('./redis-realtime')
  const { getOrGenerateContext } = await import('./project-context')
  const { loadConversationFromFile } = await import('./conversation-history')

  // Load project context (cached in .claude/project-context.md)
  const contextProgressMsg = 'Loading project context...';
  onProgress?.(contextProgressMsg);
  await publishWorkspaceMessage(projectId, 'terminal', {
    output: contextProgressMsg,
    timestamp: Date.now(),
  });
  const projectContext = await getOrGenerateContext(sandbox, workDir)

  // Load conversation history if available
  const conversationHistory = await loadConversationFromFile(sandbox, workDir)

  // Track structured data for UI
  const structuredData: {
    fileChanges: FileChange[]
    commandsRun: CommandExecution[]
    toolsUsed: Set<string>
    thinkingProcess: string[]
    errors: string[]
  } = {
    fileChanges: [],
    commandsRun: [],
    toolsUsed: new Set(),
    thinkingProcess: [],
    errors: []
  }

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

<project_context>
${projectContext}
</project_context>

${conversationHistory ? `<conversation_history>
Previous conversation:
${conversationHistory}
</conversation_history>

Remember to reference previous context and maintain conversation continuity.
` : ''}

When running commands:
- Always use 'cd ${workDir} &&' before your command if it's file-system related
- Keep in mind that the terminal is non-interactive, use the '-y' flag when needed
- File paths should be relative to ${workDir}

IMPORTANT:
- If the user just says hello or asks a simple question that doesn't require code changes, respond immediately without using tools.
- Only use tools when you need to read files, write code, or run commands.
- When you complete a task, wrap your final response in JSON format:

<task_summary>
{
  "message": "Your friendly response to the user explaining what you did",
  "summary": "Brief technical summary of changes",
  "nextSteps": ["Optional suggestions for next steps"],
  "notes": ["Any important notes or warnings"]
}
</task_summary>

Example:
<task_summary>
{
  "message": "I've created the login page with form validation! The page includes email and password fields with proper error handling.",
  "summary": "Created src/pages/login.tsx with React Hook Form and Zod validation",
  "nextSteps": ["Add authentication API integration", "Style the form with Tailwind"],
  "notes": ["Remember to add the login route to your router"]
}
</task_summary>
`,
    model:
      model === 'claude'
        ? anthropic({
            model: 'claude-haiku-4-5', // Haiku 4.5: 2x faster, 1/3 cost, 73.3% SWE-bench
            defaultParameters: {
              max_tokens: 8192,
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
          structuredData.toolsUsed.add('terminal')

          // Publish progress to UI
          const progressMsg = `Running: ${command}`
          onProgress?.(progressMsg)
          await publishWorkspaceMessage(projectId, 'terminal', {
            command,
            output: progressMsg,
            timestamp: Date.now(),
          })

          try {
            const result = await sandbox.commands.run(command)
            console.log('[Coding Agent] terminal result:', result.stdout)

            const output = result.stdout || result.stderr || 'Command completed'

            // Track command execution
            structuredData.commandsRun.push({
              command,
              output,
              success: result.exitCode === 0
            })

            // Publish command output
            await publishWorkspaceMessage(projectId, 'terminal', {
              command,
              output,
              timestamp: Date.now(),
            })

            return output
          } catch (error) {
            const errorMsg = `Command failed: ${error}`
            console.error('[Coding Agent]', errorMsg)

            structuredData.commandsRun.push({
              command,
              output: errorMsg,
              success: false
            })
            structuredData.errors.push(errorMsg)

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
          structuredData.toolsUsed.add('createOrUpdateFiles')

          // Publish progress to UI
          const progressMsg = `Writing ${files.length} file(s): ${files.map(f => f.path).join(', ')}`
          onProgress?.(progressMsg)
          await publishWorkspaceMessage(projectId, 'terminal', {
            output: progressMsg,
            timestamp: Date.now(),
          })

          try {
            for (const file of files) {
              const fullPath = resolvePath(file.path);

              // Check if file exists to determine action
              let action: 'created' | 'updated' = 'created'
              try {
                await sandbox.files.read(fullPath)
                action = 'updated'
              } catch {
                // File doesn't exist, it's a creation
                action = 'created'
              }

              // Write to sandbox (git will track changes)
              await sandbox.files.write(fullPath, file.content)
              console.log('[Coding Agent] Wrote file to sandbox:', fullPath)

              // Track file change
              structuredData.fileChanges.push({
                path: file.path,
                action,
                language: getLanguageFromPath(file.path)
              })

              // Publish file change to Redis for real-time UI updates
              await publishWorkspaceMessage(projectId, 'file-changes', {
                path: file.path,
                action,
                timestamp: Date.now(),
              })
            }
            return `Files created/updated: ${files.map((f) => f.path).join(', ')}`
          } catch (error) {
            const errorMsg = `File operation failed: ${error}`
            console.error('[Coding Agent]', errorMsg)
            structuredData.errors.push(errorMsg)
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

          // Publish progress to UI
          const progressMsg = `Reading ${files.length} file(s): ${files.join(', ')}`
          onProgress?.(progressMsg)
          await publishWorkspaceMessage(projectId, 'terminal', {
            output: progressMsg,
            timestamp: Date.now(),
          })

          try {
            const contents = []
            for (const filePath of files) {
              const fullPath = resolvePath(filePath);
              const content = await sandbox.files.read(fullPath)
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
          const execMsg = `Executing ${language} code`;
          onProgress?.(execMsg);
          await publishWorkspaceMessage(projectId, 'terminal', {
            output: execMsg,
            timestamp: Date.now(),
          });

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
        // Publish detailed telemetry for full transparency in UI

        // 1. Extract thinking/reasoning blocks
        const thinkingBlocks = result.output.filter((msg) =>
          'type' in msg && msg.type === 'text' &&
          typeof msg.content === 'string' &&
          (msg.content.includes('thinking') || msg.content.includes('reasoning'))
        )

        if (thinkingBlocks.length > 0) {
          for (const block of thinkingBlocks) {
            if ('content' in block && typeof block.content === 'string') {
              await publishWorkspaceMessage(projectId, 'agent-thinking', {
                content: block.content,
                timestamp: Date.now(),
              })
            }
          }
        }

        // 2. Publish tool calls with full details
        const toolCalls = result.output.filter((msg) => 'type' in msg && msg.type === 'tool_call')
        for (const toolCall of toolCalls) {
          if ('name' in toolCall && 'input' in toolCall) {
            await publishWorkspaceMessage(projectId, 'tool-use', {
              tool: toolCall.name,
              input: toolCall.input,
              id: 'tool_call_id' in toolCall ? toolCall.tool_call_id : undefined,
              timestamp: Date.now(),
            })
          }
        }

        // 3. Publish tool results
        const toolResults = result.output.filter((msg) => 'type' in msg && msg.type === 'tool_result')
        for (const toolResult of toolResults) {
          if ('tool_call_id' in toolResult && 'output' in toolResult) {
            await publishWorkspaceMessage(projectId, 'tool-result', {
              toolCallId: toolResult.tool_call_id,
              result: toolResult.output,
              timestamp: Date.now(),
            })
          }
        }

        // 4. Check if task is complete
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
      const iterMsg = `Iteration ${callCount}`;
      onProgress?.(iterMsg);
      publishWorkspaceMessage(projectId, 'terminal', {
        output: iterMsg,
        timestamp: Date.now(),
      }).catch(err => console.error('[Coding Agent] Failed to publish iteration:', err));

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

  return { network, structuredData }
}

/**
 * Create a review agent to check coding work quality
 */
async function createReviewAgent(config: CodingAgentConfig) {
  const { model = 'claude', onProgress } = config;

  return createAgent({
    name: 'Code Reviewer',
    description: 'Expert code reviewer ensuring production quality',
    system: `You are an expert senior developer conducting code reviews.

Your role is to review code changes and ensure production quality.

Review Criteria:
1. **Code Quality**: Clean, readable, maintainable code with proper naming
2. **Best Practices**: Framework best practices, error handling, security
3. **Completeness**: All requirements implemented, no missing functionality
4. **Testing**: Consider if code needs tests or validation

Output Format:
- If code is good: "APPROVED: Code looks good"
- If issues found: "ISSUES FOUND: [list specific problems]"

Be thorough but fair. Focus on critical issues that must be fixed.`,
    model:
      model === 'claude'
        ? anthropic({
            model: 'claude-haiku-4-5',
            defaultParameters: {
              max_tokens: 4096,
            },
          })
        : openai({
            model: 'gpt-5-mini',
          }),
    tools: [], // No tools needed for review, just analysis
  });
}

/**
 * Check if user has requested to stop the agent
 */
async function checkStopFlag(projectId: string): Promise<boolean> {
  try {
    const stopKey = `agent:stop:${projectId}`;
    const stopFlag = await kv.get(stopKey);

    if (stopFlag) {
      // Delete the flag so it doesn't affect future runs
      await kv.del(stopKey);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Coding Agent] Error checking stop flag:', error);
    return false;
  }
}

/**
 * Run a coding task with self-review loop
 */
export async function runCodingTask(
  prompt: string,
  config: CodingAgentConfig
): Promise<CodingAgentResult> {
  const {
    onProgress,
    reviewMode = 'limited',
    maxReviewIterations = 3  // Change this number to set max review iterations
  } = config;
  const { publishWorkspaceMessage } = await import('@/lib/services/redis-realtime');

  console.log('[Coding Agent] Config:', { reviewMode, maxReviewIterations, configValue: config.maxReviewIterations });

  try {
    let currentPrompt = prompt;
    let reviewAttempts = 0;
    let finalSummary = '';

    // Skip review entirely if reviewMode is 'off'
    if (reviewMode === 'off') {
      const progressMsg = 'Coding agent working (review disabled)...';
      onProgress?.(progressMsg);
      await publishWorkspaceMessage(config.projectId, 'terminal', {
        output: progressMsg,
        timestamp: Date.now(),
      });
      const { network, structuredData } = await createCodingAgent(config);
      const result = await network.run(currentPrompt);
      const summary = result.state.kv.get('task_summary') as string | undefined;

      // Parse JSON from summary if present
      const parsedResponse = parseAgentResponse(summary || 'Task completed');

      return {
        success: true,
        output: parsedResponse.message,
        structured: {
          summary: parsedResponse.summary || parsedResponse.message,
          fileChanges: structuredData.fileChanges,
          commandsRun: structuredData.commandsRun,
          toolsUsed: Array.from(structuredData.toolsUsed),
          thinkingProcess: structuredData.thinkingProcess.join('\n'),
          errors: structuredData.errors
        }
      };
    }

    // Determine max iterations based on mode
    const shouldLoopTillFixed = reviewMode === 'loop';
    const maxAttempts = shouldLoopTillFixed ? Infinity : maxReviewIterations;

    let lastStructuredData: typeof structuredData | null = null;

    while (reviewAttempts < maxAttempts) {
      // Check for stop signal
      const shouldStop = await checkStopFlag(config.projectId);
      if (shouldStop) {
        console.log('[Coding Agent] Stop signal received from user');
        onProgress?.('⏹️ Stopped by user');

        // Publish stopped event
        await publishWorkspaceMessage(config.projectId, 'agent-stopped', {
          reason: 'Execution stopped by user request',
          timestamp: Date.now(),
        });

        // Return current state
        const parsedResponse = parseAgentResponse(finalSummary || 'Task stopped by user');
        return {
          success: true,
          output: parsedResponse.message + '\n\n⏹️ *Stopped by user*',
          structured: lastStructuredData ? {
            summary: parsedResponse.summary || parsedResponse.message,
            fileChanges: lastStructuredData.fileChanges,
            commandsRun: lastStructuredData.commandsRun,
            toolsUsed: Array.from(lastStructuredData.toolsUsed),
            thinkingProcess: lastStructuredData.thinkingProcess.join('\n'),
            errors: lastStructuredData.errors
          } : {
            summary: parsedResponse.message,
            fileChanges: [],
            commandsRun: [],
            toolsUsed: [],
            thinkingProcess: '',
            errors: []
          }
        };
      }

      // Step 1: Run coding agent
      const agentProgressMsg = `Coding agent working...${reviewAttempts > 0 ? ` (iteration ${reviewAttempts + 1})` : ''}`;
      onProgress?.(agentProgressMsg);
      await publishWorkspaceMessage(config.projectId, 'terminal', {
        output: agentProgressMsg,
        timestamp: Date.now(),
      });
      const { network, structuredData } = await createCodingAgent(config);
      const result = await network.run(currentPrompt);
      lastStructuredData = structuredData;

      const summary = result.state.kv.get('task_summary') as string | undefined;
      finalSummary = summary || 'Task completed';

      // Step 2: Review the work (only if this is code work, not conversation)
      // Check if any tools were used by looking at structured data
      const hasToolCalls = lastStructuredData.toolsUsed.size > 0 || lastStructuredData.fileChanges.length > 0;

      if (!hasToolCalls) {
        // Pure conversation, no need to review
        console.log('[Coding Agent] No code changes, skipping review');
        break;
      }

      const reviewProgressMsg = 'Code reviewer checking work quality...';
      onProgress?.(reviewProgressMsg);
      await publishWorkspaceMessage(config.projectId, 'terminal', {
        output: reviewProgressMsg,
        timestamp: Date.now(),
      });
      const reviewer = await createReviewAgent(config);
      const reviewNetwork = createNetwork({
        name: 'review-network',
        agents: [reviewer],
        maxIter: 2,
      });

      const reviewResult = await reviewNetwork.run(
        `Review the code changes that were just made for this task: ${prompt}\n\nSummary of changes: ${finalSummary}`
      );

      const reviewOutput = reviewResult.output
        .filter((msg) => 'type' in msg && msg.type === 'text')
        .map((msg) => ('content' in msg ? msg.content : ''))
        .join('\n');

      console.log('[Coding Agent] Review result:', reviewOutput);

      if (reviewOutput.includes('APPROVED')) {
        console.log('[Coding Agent] Code approved by reviewer');
        const approvalMsg = '✅ Code approved by reviewer';
        onProgress?.(approvalMsg);

        // Show approval in terminal
        await publishWorkspaceMessage(config.projectId, 'terminal', {
          output: approvalMsg,
          timestamp: Date.now(),
        });

        // Publish approval
        await publishWorkspaceMessage(config.projectId, 'review-result', {
          approved: true,
          iteration: reviewAttempts + 1,
          feedback: reviewOutput,
          timestamp: Date.now(),
        });
        break;
      }

      // Issues found, prepare for next iteration
      reviewAttempts++;

      // Publish review feedback
      await publishWorkspaceMessage(config.projectId, 'review-result', {
        approved: false,
        iteration: reviewAttempts,
        feedback: reviewOutput,
        willRetry: reviewAttempts < maxAttempts,
        timestamp: Date.now(),
      });

      if (reviewAttempts < maxAttempts) {
        const modeText = shouldLoopTillFixed ? '' : ` (${reviewAttempts}/${maxAttempts})`;
        console.log(`[Coding Agent] Review found issues, attempting fix${modeText}`);
        const retryMsg = `Reviewer found issues, fixing...${modeText}`;
        onProgress?.(retryMsg);
        await publishWorkspaceMessage(config.projectId, 'terminal', {
          output: retryMsg,
          timestamp: Date.now(),
        });
        currentPrompt = `The previous implementation had issues. Please fix them:\n\n${reviewOutput}\n\nOriginal task: ${prompt}`;
      } else {
        console.log('[Coding Agent] Max review attempts reached');
        const maxAttemptsMsg = '⚠️ Completed with review feedback';
        onProgress?.(maxAttemptsMsg);
        await publishWorkspaceMessage(config.projectId, 'terminal', {
          output: maxAttemptsMsg,
          timestamp: Date.now(),
        });
        finalSummary += `\n\n**Reviewer Notes**: ${reviewOutput}`;
      }
    }

    // Parse JSON from final summary
    const parsedResponse = parseAgentResponse(finalSummary);

    return {
      success: true,
      output: parsedResponse.message,
      structured: lastStructuredData ? {
        summary: parsedResponse.summary || parsedResponse.message,
        fileChanges: lastStructuredData.fileChanges,
        commandsRun: lastStructuredData.commandsRun,
        toolsUsed: Array.from(lastStructuredData.toolsUsed),
        thinkingProcess: lastStructuredData.thinkingProcess.join('\n'),
        errors: lastStructuredData.errors
      } : undefined
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
