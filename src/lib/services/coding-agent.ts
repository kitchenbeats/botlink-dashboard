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
import { createAgentEventEmitter } from './agent-events'
import { codingAgentPrompt, codeReviewerPrompt } from '@/configs/prompts/coding-agent'
import { generateSystemPrompt } from '@/configs/prompts'
import type { ProjectTemplate } from '@/lib/types/database'

export interface CodingAgentConfig {
  sandbox: Sandbox
  projectId: string
  template?: ProjectTemplate // Project template type (simple_site, nextjs, nextjs_saas, wordpress)
  workDir?: string
  model?: string // e.g., 'claude-haiku-4-5', 'claude-sonnet-4-5', 'gpt-5-mini', 'gpt-5'
  reviewerModel?: string // e.g., 'claude-haiku-4-5', 'claude-sonnet-4-5', 'gpt-5-mini', 'gpt-5'
  maxIterations?: number
  reviewMode?: 'limited' | 'loop' | 'off'
  maxReviewIterations?: number
  checkYourWork?: boolean // Enable rigorous documentation checking mode
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
 * Get model configuration for Inngest Agent-Kit
 */
function getModelConfig(modelName?: string) {
  // Default to Claude Haiku if not specified
  const model = modelName || 'claude-haiku-4-5'

  // Claude models
  if (model.includes('claude')) {
    const claudeModel = model === 'claude-sonnet-4-5' ? 'claude-sonnet-4-5' : 'claude-haiku-4-5'
    return anthropic({
      model: claudeModel,
      defaultParameters: {
        max_tokens: 8192,
      },
    })
  }

  // OpenAI models
  const gptModel = model === 'gpt-5' ? 'gpt-5' : 'gpt-5-mini'
  return openai({
    model: gptModel,
    defaultParameters: {
      //max_completion_tokens: 4096,
    },
  })
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
  const { sandbox, projectId, workDir = '/home/user', model = 'claude', maxIterations = 10, onProgress } = config

  // Create event emitter for Agent-Kit style events
  const events = createAgentEventEmitter(projectId)

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

  // Get template-specific system prompt if template is provided
  const systemPrompt = config.template
    ? generateSystemPrompt(config.template, projectContext, conversationHistory ?? undefined, workDir, config.checkYourWork)
    : codingAgentPrompt.systemPrompt(projectContext, conversationHistory ?? undefined, workDir);

  const agent = createAgent({
    name: codingAgentPrompt.name,
    description: codingAgentPrompt.description,
    system: systemPrompt,
    model: getModelConfig(model),
    tools: [
      // Terminal command execution
      createTool({
        name: 'terminal',
        description: `Execute commands in the sandbox terminal.

IMPORTANT DEV SERVER RULES:
- Dev server runs on port 3000 via PM2 (process name: "nextjs")
- NEVER use "pkill", "killall", or kill commands - they will break the dev server
- To restart dev server: use "pm2 restart nextjs" (not kill commands)
- To check dev server: use "pm2 status" or "pm2 logs nextjs --lines 20"
- Build commands are OK but dev server keeps running on port 3000

Safe practices:
- Clean build artifacts: "rm -rf .next || true" (|| true handles permission errors)
- Install packages: "pnpm install [package]" (dev server auto-reloads)
- Run builds: "pnpm build" (uses different process, won't affect dev server)`,
        parameters: z.object({
          command: z.string().describe('The command to execute'),
        }),
        handler: async ({ command }) => {
          console.log('[Coding Agent] terminal:', command)
          structuredData.toolsUsed.add('terminal')

          // Emit tool.called event
          await events.emitToolCalled({ name: 'terminal', args: { command } })

          // SAFETY: Intercept and fix dangerous commands
          let safeCommand = command

          // 1. Fix .next removal - add || true to handle permission errors
          if (safeCommand.includes('rm -rf .next') && !safeCommand.includes('|| true')) {
            safeCommand = safeCommand.replace(/rm -rf \.next/g, 'rm -rf .next || true')
            console.log('[Coding Agent] 🛡️ Made safer:', safeCommand)
          }

          // 2. Block dangerous kill commands that would destroy PM2
          if (
            safeCommand.includes('pkill') ||
            safeCommand.includes('killall') ||
            (safeCommand.includes('kill') && safeCommand.includes('-9'))
          ) {
            const warning = `⚠️ BLOCKED: Kill commands are not allowed as they destroy the dev server.
Use pm2DevServer(action: "restart") to restart the dev server instead.
Current dev server status: use pm2DevServer(action: "status") to check.`

            console.warn('[Coding Agent]', warning)
            await publishWorkspaceMessage(projectId, 'terminal', {
              command: safeCommand,
              output: warning,
              timestamp: Date.now(),
            })

            return warning
          }

          // 3. Guide AI to use productionBuild tool instead of running builds directly
          if (
            (safeCommand.includes('pnpm build') || safeCommand.includes('npm run build') || safeCommand.includes('next build')) &&
            !safeCommand.includes('--help')
          ) {
            const guidance = `⚠️ DETECTED: Production build command

Instead of running build commands directly, use the productionBuild tool:
  - productionBuild(action: "build") - Safely build and preview on port 3001

This ensures:
✅ Dev server on port 3000 stays running (no conflicts!)
✅ Production server runs on port 3001
✅ You get both preview URLs

Do you want to proceed with the direct build anyway? (Not recommended)
If yes, the command will run but may interfere with live preview.`

            console.warn('[Coding Agent]', guidance)
            await publishWorkspaceMessage(projectId, 'terminal', {
              command: safeCommand,
              output: guidance,
              timestamp: Date.now(),
            })

            // Actually block it - force them to use the tool
            return guidance
          }

          // 4. Detect commands that might affect dev server
          const mightAffectServer =
            safeCommand.includes('pnpm dev') ||
            safeCommand.includes('npm run dev') ||
            safeCommand.includes('next dev') ||
            safeCommand.includes('pm2 stop') ||
            safeCommand.includes('pm2 restart') ||
            safeCommand.includes('pm2 delete')

          // Run command (don't spam UI with "Running:" message)
          const progressMsg = `Running: ${safeCommand}`
          console.log('[Coding Agent]', progressMsg)
          onProgress?.(progressMsg)

          try {
            const result = await sandbox.commands.run(safeCommand)
            console.log('[Coding Agent] terminal result:', result.stdout)

            const output = result.stdout || result.stderr || 'Command completed'

            // Track command execution
            structuredData.commandsRun.push({
              command: safeCommand,
              output,
              success: result.exitCode === 0
            })

            // Publish command output to UI (this creates a terminal card)
            await publishWorkspaceMessage(projectId, 'terminal', {
              command: safeCommand,
              output,
              timestamp: Date.now(),
            })

            // SAFETY: Auto-check and restart dev server if command might have affected it
            if (mightAffectServer) {
              console.log('[Coding Agent] 🔍 Checking dev server health after command...')

              // Wait a moment for things to settle
              await new Promise(resolve => setTimeout(resolve, 2000))

              // Check if dev server is still running via PM2
              const pm2Check = await sandbox.commands.run('pm2 jlist')
              const processes = JSON.parse(pm2Check.stdout || '[]') as Array<{
                name: string
                pm2_env?: { status: string }
              }>

              const nextjsProcess = processes.find(p => p.name === 'nextjs-dev')
              const isOnline = nextjsProcess?.pm2_env?.status === 'online'

              if (!isOnline) {
                console.log('[Coding Agent] ⚠️ Dev server is down! Auto-restarting...')

                // Auto-restart with PM2
                const restartResult = await sandbox.commands.run(
                  `cd ${workDir || '/templates/nextjs-saas'} && pm2 restart nextjs-dev || pm2 start configs/ecosystem.config.js --only nextjs-dev`
                )

                const restartMsg = `🔄 Dev server was down, automatically restarted via PM2\n${restartResult.stdout}`
                console.log('[Coding Agent]', restartMsg)

                // Notify user
                await publishWorkspaceMessage(projectId, 'terminal', {
                  output: restartMsg,
                  timestamp: Date.now(),
                })

                return output + '\n\n' + restartMsg
              } else {
                console.log('[Coding Agent] ✅ Dev server still running on port 3000')
              }
            }

            // Emit tool.completed event
            await events.emitToolCompleted({ name: 'terminal', result: output })

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

            // Emit tool.failed event
            await events.emitToolFailed({ name: 'terminal', error: errorMsg })

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

          // DON'T publish progress - file-change events below will show in UI
          const progressMsg = `Writing ${files.length} file(s): ${files.map(f => f.path).join(', ')}`
          console.log('[Coding Agent]', progressMsg)
          onProgress?.(progressMsg)

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

          // DON'T publish to UI - too noisy, just log
          const progressMsg = `Reading ${files.length} file(s): ${files.join(', ')}`
          console.log('[Coding Agent]', progressMsg)
          onProgress?.(progressMsg)

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

      // Production Build & Test
      createTool({
        name: 'productionBuild',
        description: `Build and test the production version of the Next.js app.

This tool handles the complete production build workflow safely:
1. Runs "pnpm build" to create optimized production bundle
2. Starts production server on port 3001 (dev server stays on 3000)
3. Waits for production server to be ready
4. Returns the production preview URL

The dev server on port 3000 continues running - no conflicts!`,
        parameters: z.object({
          action: z.enum(['build', 'start', 'stop', 'status']).describe(
            'Action: build (build + start on 3001), start (start existing build), stop (stop prod server), status (check prod server)'
          ),
        }),
        handler: async ({ action }) => {
          console.log('[Coding Agent] productionBuild:', action)
          structuredData.toolsUsed.add('productionBuild')

          try {
            const workPath = workDir || '/templates/nextjs-saas'

            if (action === 'build') {
              // Multi-step production build process
              const steps = [
                { name: 'Build', description: 'Running pnpm build' },
                { name: 'Stop old server', description: 'Stopping PM2 nextjs-prod' },
                { name: 'Start server', description: 'Starting on port 3001' },
                { name: 'Verify', description: 'Waiting for ready' },
              ]
              const totalSteps = steps.length

              // Emit tool.called event
              await events.emitToolCalled({ name: 'productionBuild', args: { action: 'build' } })

              // Step 1: Run production build
              await events.emitStepStarted({
                toolName: 'productionBuild',
                step: 1,
                total: totalSteps,
                description: steps[0]!.description
              })

              const buildMsg = '🏗️ Building production bundle...'
              console.log('[Coding Agent]', buildMsg)
              await publishWorkspaceMessage(projectId, 'terminal', {
                output: buildMsg,
                timestamp: Date.now(),
              })

              const buildResult = await sandbox.commands.run(`cd ${workPath} && pnpm build`, {
                timeoutMs: 120000, // 2 minute timeout for builds
              })

              const buildOutput = buildResult.stdout || buildResult.stderr

              await publishWorkspaceMessage(projectId, 'terminal', {
                command: 'pnpm build',
                output: buildOutput,
                timestamp: Date.now(),
              })

              if (buildResult.exitCode !== 0) {
                const errorMsg = `❌ Production build failed:\n${buildOutput}`
                structuredData.errors.push(errorMsg)
                await events.emitStepFailed({
                  toolName: 'productionBuild',
                  step: 1,
                  total: totalSteps,
                  error: errorMsg
                })
                await events.emitToolFailed({ name: 'productionBuild', error: errorMsg })
                return errorMsg
              }

              await events.emitStepCompleted({
                toolName: 'productionBuild',
                step: 1,
                total: totalSteps,
                description: '✅ Build complete'
              })

              // Step 2: Stop existing production server if running
              await events.emitStepStarted({
                toolName: 'productionBuild',
                step: 2,
                total: totalSteps,
                description: steps[1]!.description
              })

              await sandbox.commands.run('pm2 stop nextjs-prod || true')

              await events.emitStepCompleted({
                toolName: 'productionBuild',
                step: 2,
                total: totalSteps,
                description: '✅ Server stopped'
              })

              // Step 3: Start production server on port 3001
              await events.emitStepStarted({
                toolName: 'productionBuild',
                step: 3,
                total: totalSteps,
                description: steps[2]!.description
              })

              const startMsg = '🚀 Starting production server on port 3001...'
              console.log('[Coding Agent]', startMsg)
              await publishWorkspaceMessage(projectId, 'terminal', {
                output: startMsg,
                timestamp: Date.now(),
              })

              await sandbox.commands.run(
                `cd ${workPath} && pm2 start ecosystem.config.js --only nextjs-prod`
              )

              await events.emitStepCompleted({
                toolName: 'productionBuild',
                step: 3,
                total: totalSteps,
                description: '✅ Server started'
              })

              // Step 4: Wait for port 3001 to be ready
              await events.emitStepStarted({
                toolName: 'productionBuild',
                step: 4,
                total: totalSteps,
                description: steps[3]!.description
              })

              await new Promise(resolve => setTimeout(resolve, 3000))

              await events.emitStepCompleted({
                toolName: 'productionBuild',
                step: 4,
                total: totalSteps,
                description: '✅ Server ready'
              })

              const successMsg = `✅ Production build complete!

Dev Server (PORT 3000): Running (unchanged)
Prod Server (PORT 3001): Running

Preview URLs:
- Development: http://localhost:3000
- Production: http://localhost:3001

Use pm2DevServer tool to manage dev server.
Use productionBuild(action: "stop") when done testing production.`

              await publishWorkspaceMessage(projectId, 'terminal', {
                output: successMsg,
                timestamp: Date.now(),
              })

              // Emit tool.completed event
              await events.emitToolCompleted({
                name: 'productionBuild',
                result: successMsg
              })

              return successMsg
            } else if (action === 'start') {
              // Start production server without rebuilding
              await sandbox.commands.run(
                `cd ${workPath} && pm2 start ecosystem.config.js --only nextjs-prod`
              )

              const msg = '✅ Production server started on port 3001'
              await publishWorkspaceMessage(projectId, 'terminal', {
                output: msg,
                timestamp: Date.now(),
              })
              return msg
            } else if (action === 'stop') {
              // Stop production server
              await sandbox.commands.run('pm2 stop nextjs-prod')

              const msg = '⏹️ Production server stopped (dev server still running on 3000)'
              await publishWorkspaceMessage(projectId, 'terminal', {
                output: msg,
                timestamp: Date.now(),
              })
              return msg
            } else if (action === 'status') {
              // Check production server status
              const pm2Check = await sandbox.commands.run('pm2 jlist')
              const processes = JSON.parse(pm2Check.stdout || '[]') as Array<{
                name: string
                pm2_env?: { status: string }
              }>

              const devProcess = processes.find(p => p.name === 'nextjs-dev')
              const prodProcess = processes.find(p => p.name === 'nextjs-prod')

              const statusMsg = `📊 Server Status:

Dev Server (nextjs-dev):
  Status: ${devProcess?.pm2_env?.status || 'stopped'}
  Port: 3000

Production Server (nextjs-prod):
  Status: ${prodProcess?.pm2_env?.status || 'stopped'}
  Port: 3001`

              await publishWorkspaceMessage(projectId, 'terminal', {
                output: statusMsg,
                timestamp: Date.now(),
              })
              return statusMsg
            }

            return 'Unknown action'
          } catch (error) {
            const errorMsg = `Production build failed: ${error}`
            console.error('[Coding Agent]', errorMsg)
            structuredData.errors.push(errorMsg)
            return errorMsg
          }
        },
      }),

      // PM2 Dev Server Management
      createTool({
        name: 'pm2DevServer',
        description: `Manage the Next.js dev server running via PM2.

Use this to check server status or restart it safely without killing the process.
The dev server runs on port 3000 and is named "nextjs-dev" in PM2.`,
        parameters: z.object({
          action: z.enum(['status', 'restart', 'logs']).describe(
            'Action to perform: status (check if running), restart (gracefully restart), logs (view recent logs)'
          ),
        }),
        handler: async ({ action }) => {
          console.log('[Coding Agent] pm2DevServer:', action)
          structuredData.toolsUsed.add('pm2DevServer')

          try {
            let command = ''
            let description = ''

            switch (action) {
              case 'status':
                command = 'pm2 jlist'
                description = 'Checking dev server status'
                break
              case 'restart':
                command = `cd ${workDir || '/templates/nextjs-saas'} && pm2 restart nextjs-dev`
                description = 'Restarting dev server'
                break
              case 'logs':
                command = 'pm2 logs nextjs-dev --nostream --lines 30'
                description = 'Fetching dev server logs'
                break
            }

            console.log('[Coding Agent]', description)
            const result = await sandbox.commands.run(command)

            // Parse status for friendly output
            if (action === 'status') {
              const processes = JSON.parse(result.stdout || '[]') as Array<{
                name: string
                pm2_env?: { status: string; pm_uptime: number }
              }>

              const nextjsProcess = processes.find(p => p.name === 'nextjs-dev')
              if (nextjsProcess) {
                const status = nextjsProcess.pm2_env?.status || 'unknown'
                const uptime = nextjsProcess.pm2_env?.pm_uptime
                  ? new Date(nextjsProcess.pm2_env.pm_uptime).toISOString()
                  : 'unknown'

                const statusMsg = `✅ Dev server is ${status}
Process: nextjs-dev
Status: ${status}
Started: ${uptime}
Port: 3000 (http://localhost:3000)`

                await publishWorkspaceMessage(projectId, 'terminal', {
                  output: statusMsg,
                  timestamp: Date.now(),
                })

                return statusMsg
              } else {
                const errorMsg = '⚠️ Dev server (nextjs-dev) not found in PM2. It may have been stopped.'
                await publishWorkspaceMessage(projectId, 'terminal', {
                  output: errorMsg,
                  timestamp: Date.now(),
                })
                return errorMsg
              }
            }

            // For restart and logs, return raw output
            const output = result.stdout || result.stderr || 'Command completed'

            await publishWorkspaceMessage(projectId, 'terminal', {
              command: `pm2 ${action}`,
              output,
              timestamp: Date.now(),
            })

            return output
          } catch (error) {
            const errorMsg = `Failed to ${action} dev server: ${error}`
            console.error('[Coding Agent]', errorMsg)
            structuredData.errors.push(errorMsg)
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
    maxIter: maxIterations, // Max tool calls (agent should finish early with <task_summary>)
    defaultRouter: ({ network, callCount, lastResult }) => {
      // ONLY log to console, NOT to UI (internal tool calls aren't "iterations")
      console.log(`[Coding Agent] Tool call #${callCount}/${maxIterations}`)

      // Stop if max tool calls reached
      if (callCount >= maxIterations) {
        console.log('[Coding Agent] Max tool calls reached, stopping')
        const lastText = lastResult?.output.find((msg) => 'type' in msg && msg.type === 'text')
        if (lastText && 'content' in lastText) {
          network?.state.kv.set('task_summary', lastText.content)
        }
        return // Stop execution
      }

      // Stop if task summary found (agent finished early - this is the goal!)
      if (network?.state.kv.has('task_summary')) {
        console.log('[Coding Agent] Task completed early!')
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
  const { reviewerModel = 'claude', onProgress } = config;

  return createAgent({
    name: codeReviewerPrompt.name,
    description: codeReviewerPrompt.description,
    system: codeReviewerPrompt.systemPrompt('', undefined, undefined),
    model: getModelConfig(reviewerModel),
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
    projectId,
    onProgress,
    reviewMode = 'limited',
    maxReviewIterations = 2,  // Max review loop iterations
    maxIterations = 10  // Max agent iterations per attempt
  } = config;
  const { publishWorkspaceMessage } = await import('@/lib/services/redis-realtime');

  // Create event emitter
  const events = createAgentEventEmitter(projectId);

  console.log('[Coding Agent] Config:', {
    reviewMode,
    maxReviewIterations,
    maxIterations,
    totalMaxIterations: maxIterations * (maxReviewIterations + 1)
  });

  // Emit run.started event
  await events.emitRunStarted({
    agentName: 'Coding Agent',
    prompt
  });

  const startTime = Date.now();

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

    let lastStructuredData: {
      fileChanges: FileChange[]
      commandsRun: CommandExecution[]
      toolsUsed: Set<string>
      thinkingProcess: string[]
      errors: string[]
    } | null = null;

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
      const currentRound = reviewAttempts + 1;
      const agentProgressMsg = `🤖 Editing Round ${currentRound}${maxAttempts !== Infinity ? `/${maxAttempts}` : ''}: Coding agent working...`;
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
        defaultRouter: ({ network, callCount, lastResult }) => {
          console.log(`[Review Agent] Tool call #${callCount}/2`)

          // Stop if max calls reached
          if (callCount >= 2) {
            console.log('[Review Agent] Max tool calls reached, stopping')
            return
          }

          // Stop if review decision found
          if (network?.state.kv.has('review_decision')) {
            console.log('[Review Agent] Review decision made, stopping')
            return
          }

          return reviewer
        },
      });

      const reviewResult = await reviewNetwork.run(
        `Review the code changes that were just made for this task: ${prompt}\n\nSummary of changes: ${finalSummary}`
      );

      // Get review output from state
      const reviewOutput = (reviewResult.state.kv.get('review_decision') as string) || '';

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
        const modeText = shouldLoopTillFixed ? ` (attempt ${reviewAttempts + 1})` : ` (${reviewAttempts}/${maxAttempts})`;
        console.log(`[Coding Agent] Review found issues, attempting fix${modeText}`);
        const retryMsg = `🔧 Reviewer found issues, fixing...${modeText}`;
        onProgress?.(retryMsg);
        await publishWorkspaceMessage(config.projectId, 'terminal', {
          output: retryMsg,
          timestamp: Date.now(),
        });
        currentPrompt = `The previous implementation had issues. Please fix them:\n\n${reviewOutput}\n\nOriginal task: ${prompt}`;
      } else {
        console.log('[Coding Agent] Max review attempts reached');
        const maxAttemptsMsg = `⚠️ Max review iterations (${maxAttempts}) reached - completing with feedback`;
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

    const result = {
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

    // Emit run.completed event
    const duration = Date.now() - startTime;
    await events.emitRunCompleted({
      agentName: 'Coding Agent',
      output: result.output,
      duration
    });

    return result;
  } catch (error) {
    console.error('[Coding Agent] Task failed:', error);

    const errorMsg = error instanceof Error ? error.message : String(error);

    // Emit run.failed event
    await events.emitRunFailed({
      agentName: 'Coding Agent',
      error: errorMsg
    });

    return {
      success: false,
      output: '',
      error: errorMsg,
    };
  }
}
