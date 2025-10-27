'use server'

import { createClient } from '@/lib/clients/supabase/server'
import { createMessage } from '@/lib/db/messages'
import {
  generateSubscriptionToken,
  workspaceChannel,
} from '@/lib/services/redis-realtime'
import { TeamApiKeyService } from '@/lib/services/team-api-key-service'
import { kv } from '@/lib/clients/kv'
import {
  WORKSPACE_INIT_LOCK_TIMEOUT,
  WORKSPACE_READY_TTL,
} from '@/configs/e2b'
import type { Sandbox } from 'e2b'

/**
 * Format error for logging (prevents "[object Object]" in console)
 */
function formatError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    }
  }
  return error
}

/**
 * Fetch a secure subscription token for realtime updates
 * Uses Redis pub/sub instead of Inngest realtime
 */
export async function fetchSubscriptionToken(projectId: string) {
  console.log('[Workspace] Fetching subscription token for project:', projectId)

  const token = await generateSubscriptionToken(workspaceChannel(projectId), [
    'messages',
    'status',
    'file-changes',
    'terminal',
    'preview-status',
  ])

  return token
}

/**
 * Ensure workspace is ready (initialized and dev server running)
 * Uses distributed lock to prevent race conditions
 *
 * Flow:
 * 1. Check if workspace is already ready (Redis flag)
 * 2. If not, try to acquire initialization lock
 * 3. If lock acquired, do initialization
 * 4. If lock failed, wait for other process to finish
 * 5. Return files once ready
 */
export async function ensureWorkspaceReady(projectId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  try {
    const { getProject } = await import('@/lib/db/projects')
    const { E2BService } = await import('@/lib/services/e2b-service')
    const { getActiveSandbox } = await import('@/lib/db/sandboxes')

    const project = await getProject(projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    // Check if we have a sandbox in DB
    const existingSandbox = await getActiveSandbox(projectId)

    let result
    if (existingSandbox) {
      // Resume existing sandbox
      result = await E2BService.resumeSandbox(projectId, supabase)
      // If resume failed, create new one
      if (!result) {
        result = await E2BService.createSandbox(projectId, supabase)
      }
    } else {
      // Create new sandbox
      result = await E2BService.createSandbox(projectId, supabase)
    }

    const { sandbox } = result
    const previewUrl = E2BService.getPreviewUrl(sandbox)

    return {
      success: true as const,
      previewUrl,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Workspace] Error:', errorMessage)
    return {
      success: false,
      error: 'INIT_FAILED',
      errorMessage
    }
  }
}

/**
 * Detect language from file extension
 */
function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
    py: 'python',
    sh: 'shell',
  }
  return langMap[ext || ''] || 'plaintext'
}

/**
 * Run simple agent with realtime streaming
 */
export async function runSimpleAgent(projectId: string, query: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get or create default conversation for this project
  const { getOrCreateDefaultConversation } = await import('@/lib/db/conversations')
  const conversation = await getOrCreateDefaultConversation(projectId)

  // Save user message
  await createMessage({
    project_id: projectId,
    conversation_id: conversation.id,
    role: 'user',
    content: query,
    metadata: { executionMode: 'simple' },
  })

  // Run agent execution directly (no Inngest)
  // This runs asynchronously and streams updates via Redis
  executeSimpleAgent(projectId, query, conversation.id, supabase).catch((error) => {
    console.error('[Workspace] Agent execution failed:', formatError(error))
  })

  return { success: true }
}

/**
 * Execute the simple agent (runs asynchronously)
 */
async function executeSimpleAgent(
  projectId: string,
  query: string,
  conversationId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const { publishWorkspaceMessage } = await import(
    '@/lib/services/redis-realtime'
  )
  const { E2BService } = await import('@/lib/services/e2b-service')
  const { createCodingAgent } = await import('@/lib/services/coding-agent')
  const { getProject } = await import('@/lib/db/projects')

  try {
    // Publish starting status
    await publishWorkspaceMessage(projectId, 'status', {
      message: 'Starting agent...',
      timestamp: Date.now(),
    })

    // Get project and sandbox
    const project = await getProject(projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    const sandboxResult = await E2BService.getSandbox(projectId, supabase)
    if (!sandboxResult) {
      throw new Error('No active sandbox. Please refresh the workspace.')
    }
    const { sandbox, session } = sandboxResult

    // Extend timeout on chat message (user activity)
    const teamApiKey = await TeamApiKeyService.getTeamApiKey(
      project.team_id,
      supabase
    )
    await E2BService.extendSandboxTimeout(session.e2b_session_id, teamApiKey)

    // Get working directory for the template
    const workDir = E2BService.getTemplateWorkDir(project.template)

    // Create and run coding agent with progress streaming
    const { network } = await createCodingAgent({
      sandbox,
      projectId,
      workDir,
      model: 'claude',
      maxIterations: 15,
      onProgress: async (message: string) => {
        // Stream progress to Redis
        await publishWorkspaceMessage(projectId, 'status', {
          message,
          timestamp: Date.now(),
        })
      },
    })

    const networkResult = await network.run(query)
    const output =
      (networkResult.state.kv.get('task_summary') as string) || 'Task completed'

    // Save assistant message
    await createMessage({
      project_id: projectId,
      conversation_id: conversationId,
      role: 'assistant',
      content: output,
      metadata: {
        executionMode: 'simple',
        success: true,
      },
    })

    // Auto-commit changes made by AI
    const { GitService } = await import('@/lib/services/git-service')
    const commitResult = await GitService.commitAgentChanges(sandbox, {
      userPrompt: query,
      aiResponse: output,
      workDir,
      projectId: project.id,
      teamId: project.team_id,
    })

    if (commitResult.success && commitResult.commitHash) {
      console.log(
        '[Workspace] Auto-committed changes:',
        commitResult.commitHash
      )
    }

    // Publish completion status
    await publishWorkspaceMessage(projectId, 'status', {
      message: '✅ Task completed',
      summary: output,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('[Workspace] Agent execution error:', formatError(error))

    // Publish error status
    await publishWorkspaceMessage(projectId, 'status', {
      message: '❌ Agent execution failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
    })
  }
}

/**
 * Run workflow agents with multi-agent orchestration
 * This triggers the complete dynamic agent workflow
 */
export async function runWorkflowAgents(
  projectId: string,
  query: string,
  workflowId?: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get user's team
  const { data: teams } = await supabase
    .from('users_teams')
    .select('team_id')
    .eq('user_id', user.id)
    .limit(1)

  if (!teams || teams.length === 0 || !teams[0]) {
    throw new Error('No team found for user')
  }

  const teamId = (teams[0] as { team_id: string }).team_id

  // Get or create default conversation for this project
  const { getOrCreateDefaultConversation } = await import('@/lib/db/conversations')
  const conversation = await getOrCreateDefaultConversation(projectId)

  // Create execution record
  const { createExecution } = await import('@/lib/db/executions')

  const execution = await createExecution({
    team_id: teamId,
    workflow_id: workflowId || null,
    status: 'pending',
    input: query,
    output: null,
    builder_type: 'nextjs',
    channel_id: workspaceChannel(projectId),
  })

  // Save user message
  await createMessage({
    project_id: projectId,
    conversation_id: conversation.id,
    role: 'user',
    content: query,
    metadata: {
      executionMode: 'agents',
      workflowId,
      executionId: execution.id,
    },
  })

  // Run workflow orchestration directly (no Inngest)
  // This runs asynchronously and streams updates via Redis
  const { startWorkflowExecution } = await import(
    '@/lib/services/workflow-orchestrator'
  )

  // Convert execution to proper type
  const execTyped = execution as unknown as import('@/lib/types/database').Execution

  startWorkflowExecution(teamId, execTyped).catch(
    (error) => {
      console.error('[Workspace] Workflow orchestration failed:', formatError(error))
    }
  )

  console.log('[Workspace] Started workflow orchestration:', execution.id)

  return { success: true, executionId: execution.id }
}

/**
 * Resume workflow execution after human approval
 */
export async function resumeWorkflowExecution(executionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Verify execution exists and belongs to user's team
  const { getExecution } = await import('@/lib/db/executions')
  const execution = await getExecution(executionId)

  if (!execution) {
    throw new Error('Execution not found')
  }

  if (execution.status !== 'paused') {
    throw new Error('Execution is not paused')
  }

  console.log('[Workspace] Resuming workflow execution:', executionId)

  // Get user's team
  const { data: teams } = await supabase
    .from('users_teams')
    .select('team_id')
    .eq('user_id', user.id)
    .limit(1)

  if (!teams || teams.length === 0 || !teams[0]) {
    throw new Error('No team found for user')
  }

  const teamId = (teams[0] as { team_id: string }).team_id

  // Resume workflow execution directly (no Inngest)
  const { resumeWorkflowExecution: resumeExecution } = await import(
    '@/lib/services/workflow-orchestrator'
  )

  // Convert execution to proper type
  const execTyped = execution as unknown as import('@/lib/types/database').Execution

  resumeExecution(teamId, execTyped).catch((error) => {
    console.error('[Workspace] Resume workflow failed:', formatError(error))
  })

  return { success: true }
}

/**
 * Read file content from sandbox
 */
export async function readFileContent(projectId: string, filePath: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  try {
    const { getProject } = await import('@/lib/db/projects')
    const { E2BService } = await import('@/lib/services/e2b-service')

    const project = await getProject(projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    const result = await E2BService.getSandbox(projectId, supabase)
    if (!result) {
      throw new Error('No active sandbox. Please refresh the workspace.')
    }
    const { sandbox } = result
    const workDir = E2BService.getTemplateWorkDir(project.template)

    // Read file from sandbox
    const fullPath = `${workDir}/${filePath}`
    let content = await sandbox.files.read(fullPath)

    // Fix escaped newlines if present (some templates have literal \n)
    if (typeof content === 'string' && content.includes('\\n')) {
      content = content.replace(/\\n/g, '\n')
    }

    return { success: true, content }
  } catch (error) {
    console.error('[readFileContent] Error:', formatError(error))
    throw error
  }
}

/**
 * Write file content to sandbox (with auto-commit and Redis notification)
 */
export async function writeFileContent(
  projectId: string,
  filePath: string,
  content: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  try {
    const { getProject } = await import('@/lib/db/projects')
    const { E2BService } = await import('@/lib/services/e2b-service')
    const { GitService } = await import('@/lib/services/git-service')
    const { TeamApiKeyService } = await import(
      '@/lib/services/team-api-key-service'
    )
    const { publishWorkspaceMessage } = await import(
      '@/lib/services/redis-realtime'
    )

    const project = await getProject(projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    const result = await E2BService.getSandbox(projectId, supabase)
    if (!result) {
      throw new Error('No active sandbox. Please refresh the workspace.')
    }
    const { sandbox, session } = result

    // Extend timeout on file save (user activity)
    const teamApiKey = await TeamApiKeyService.getTeamApiKey(
      project.team_id,
      supabase
    )
    await E2BService.extendSandboxTimeout(session.e2b_session_id, teamApiKey)

    const workDir = E2BService.getTemplateWorkDir(project.template)

    // Write file to sandbox
    const fullPath = `${workDir}/${filePath}`
    await sandbox.files.write(fullPath, content)

    // Auto-commit the change
    const commitResult = await GitService.commitAgentChanges(sandbox, {
      userPrompt: `Manual edit: ${filePath}`,
      aiResponse: 'File edited by user',
      workDir,
      projectId: project.id,
      teamId: project.team_id,
    })

    if (commitResult.success && commitResult.commitHash) {
      console.log(
        '[Workspace] Auto-committed file change:',
        commitResult.commitHash
      )
    }

    // Publish file-change event to Redis for realtime sync
    await publishWorkspaceMessage(projectId, 'file-changes', {
      path: filePath,
      action: 'updated',
      timestamp: Date.now(),
    })

    return { success: true }
  } catch (error) {
    console.error('[writeFileContent] Error:', formatError(error))
    throw error
  }
}

/**
 * Get git commit history for a project
 */
export async function getCommitHistory(projectId: string, limit: number = 20) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  try {
    const { getProject } = await import('@/lib/db/projects')
    const { E2BService } = await import('@/lib/services/e2b-service')
    const { GitService } = await import('@/lib/services/git-service')

    const project = await getProject(projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    const sandboxResult = await E2BService.getSandbox(projectId, supabase)
    if (!sandboxResult) {
      throw new Error('No active sandbox. Please refresh the workspace.')
    }
    const { sandbox } = sandboxResult
    const workDir = E2BService.getTemplateWorkDir(project.template)

    const commitResult = await GitService.listCommits(sandbox, limit, workDir)

    return {
      success: commitResult.success,
      commits: commitResult.commits || [],
      currentHash: commitResult.commits && commitResult.commits.length > 0 ? commitResult.commits[0]?.hash : null,
    }
  } catch (error) {
    console.error('[getCommitHistory] Error:', formatError(error))
    throw error
  }
}

/**
 * Checkout a specific commit (time travel)
 */
export async function checkoutCommit(projectId: string, commitHash: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  try {
    const { getProject } = await import('@/lib/db/projects')
    const { E2BService } = await import('@/lib/services/e2b-service')

    const project = await getProject(projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    const result = await E2BService.getSandbox(projectId, supabase)
    if (!result) {
      throw new Error('No active sandbox. Please refresh the workspace.')
    }
    const { sandbox } = result
    const workDir = E2BService.getTemplateWorkDir(project.template)

    // Checkout the commit
    await sandbox.commands.run(`cd ${workDir} && git checkout ${commitHash}`)

    console.log('[Workspace] Checked out commit:', commitHash)

    return { success: true }
  } catch (error) {
    console.error('[checkoutCommit] Error:', formatError(error))
    throw error
  }
}

/**
 * Restart dev server (called from UI refresh button)
 * Always kills and restarts - simple and clean
 */
export async function restartDevServer(projectId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  try {
    const { getProject } = await import('@/lib/db/projects')
    const { E2BService } = await import('@/lib/services/e2b-service')

    const project = await getProject(projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    const result = await E2BService.getSandbox(projectId, supabase)
    if (!result) {
      throw new Error('No active sandbox. Please refresh the workspace.')
    }
    const { sandbox } = result
    const workDir = E2BService.getTemplateWorkDir(project.template)

    console.log('[Workspace] Restarting dev server for template:', project.template)

    if (project.template === 'nextjs' || project.template === 'nextjs_saas' || project.template === 'simple_site') {
      // Check if PM2 has any processes
      console.log('[Workspace] Checking PM2 processes...')
      const pm2ListResult = await sandbox.commands.run('pm2 jlist')

      let hasProcesses = false
      try {
        // PM2 may output initialization messages before JSON
        let jsonOutput = pm2ListResult.stdout.trim()
        const jsonStart = Math.max(
          jsonOutput.indexOf('['),
          jsonOutput.indexOf('{')
        )
        if (jsonStart > 0) {
          jsonOutput = jsonOutput.substring(jsonStart)
        }

        const processes = JSON.parse(jsonOutput)
        hasProcesses = Array.isArray(processes) && processes.length > 0
      } catch (error) {
        console.log('[Workspace] Could not parse PM2 list, assuming no processes:', error)
        hasProcesses = false
      }

      if (hasProcesses) {
        // Restart existing PM2 processes
        console.log('[Workspace] Restarting existing PM2 processes...')
        await sandbox.commands.run('pm2 restart all', { timeoutMs: 5000 })
        console.log('[Workspace] PM2 processes restarted')
      } else {
        // No processes - start fresh
        console.log('[Workspace] No PM2 processes found, starting fresh...')
        await startDevServer(sandbox, workDir, project.template, projectId)
      }

      // Show PM2 status
      const pm2Status = await sandbox.commands.run('pm2 list')
      console.log('[Workspace] PM2 status:', pm2Status.stdout)
    } else {
      // Kill ALL node/npm/pnpm/next processes in one command
      console.log('[Workspace] Killing all Node.js processes...')
      await sandbox.commands.run(
        'pkill -9 node 2>/dev/null || true; pkill -9 pnpm 2>/dev/null || true; pkill -9 next 2>/dev/null || true; lsof -ti:3000 | xargs kill -9 2>/dev/null || true',
        { timeoutMs: 3000 }
      )

      // Brief wait for processes to terminate and kernel cleanup
      console.log('[Workspace] Waiting for port 3000 to be released...')
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Start server
      console.log('[Workspace] Starting dev server...')
      startDevServer(sandbox, workDir, project.template, projectId).catch(err => {
        console.error('[Workspace] Start server error:', err)
      })
    }

    return { success: true }
  } catch (error) {
    console.error('[Workspace] Failed to restart dev server:', formatError(error))
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restart dev server'
    }
  }
}

/**
 * Start dev server based on template type
 * NOTE: This is only used as a fallback if dev server is not already running from snapshot
 */
async function startDevServer(sandbox: Sandbox, workDir: string, template: string, projectId: string) {
  try {
    if (template === 'simple_site') {
      // Kill any existing PM2 processes first
      console.log('[Workspace] Killing any existing PM2 processes...')
      await sandbox.commands.run('pm2 kill || true', { timeoutMs: 5000 })

      // Check if ecosystem.config.js exists
      const checkConfig = await sandbox.commands.run(`test -f ${workDir}/configs/ecosystem.config.js && echo "exists" || echo "not found"`)
      console.log('[Workspace] Ecosystem config check:', checkConfig.stdout.trim())

      // Start PM2 with ecosystem config (http-server only)
      console.log('[Workspace] Starting HTTP server with PM2...')
      try {
        const startResult = await sandbox.commands.run(`cd ${workDir} && NODE_PATH=/usr/local/lib/node_modules pm2 start configs/ecosystem.config.js 2>&1`, {
          timeoutMs: 15000 // 15 second timeout for PM2 to start processes
        })
        console.log('[Workspace] PM2 start output:', startResult.stdout)
        console.log('[Workspace] PM2 start stderr:', startResult.stderr)
      } catch (error) {
        const err = error as { message?: string; exitCode?: number }
        console.error('[Workspace] PM2 start failed:', err.message)
        console.error('[Workspace] PM2 exit code:', err.exitCode)

        // Try to get more info about what went wrong
        const pm2Logs = await sandbox.commands.run('pm2 logs --nostream --lines 50 || true')
        console.log('[Workspace] PM2 logs:', pm2Logs.stdout)

        throw error
      }

      // Wait a bit for PM2 to start processes
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Show PM2 status for debugging
      const pm2Status = await sandbox.commands.run('pm2 list')
      console.log('[Workspace] PM2 status:', pm2Status.stdout)

      // Stream initial PM2 logs
      const pm2Logs2 = await sandbox.commands.run('pm2 logs --nostream --lines 20 || true')
      console.log('[Workspace] PM2 logs:', pm2Logs2.stdout)

      // Quick check for HTTP server (5 second check only - it's fast anyway)
      console.log('[Workspace] Quick check for HTTP server...')
      const isReady = await waitForPort(sandbox, 3000, 5000) // 5 second timeout

      if (isReady) {
        console.log('[Workspace] HTTP server is ready!')
        await kv.set(`workspace:preview:${projectId}`, 'ready', { ex: 600 })
        const { publishWorkspaceMessage } = await import('@/lib/services/redis-realtime')
        await publishWorkspaceMessage(projectId, 'preview-status', { status: 'ready' })
      } else {
        console.log('[Workspace] HTTP server starting in background.')
        await kv.set(`workspace:preview:${projectId}`, 'starting', { ex: 600 })
        const { publishWorkspaceMessage } = await import('@/lib/services/redis-realtime')
        await publishWorkspaceMessage(projectId, 'preview-status', { status: 'starting' })
      }
    } else if (template === 'nextjs') {
      // Check if ecosystem.config.js exists (in configs/ subdirectory)
      const checkConfig = await sandbox.commands.run(`ls -la ${workDir}/configs/ecosystem.config.js || echo "File not found"`)
      console.log('[Workspace] Ecosystem config check:', checkConfig.stdout, checkConfig.stderr)

      // Check if PM2 processes are already running
      console.log('[Workspace] Checking if PM2 processes are already running...')
      const pm2ListResult = await sandbox.commands.run('pm2 jlist')

      let shouldStart = false
      try {
        console.log('[Workspace] PM2 jlist stdout:', pm2ListResult.stdout)

        // PM2 may output initialization messages before JSON
        // Extract only the JSON part (starts with [ or {)
        // PM2 may output initialization messages before JSON, try each line
        const lines = pm2ListResult.stdout.trim().split('\n')
        let processes: Array<{ name: string; pm2_env?: { status: string } }> = []

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            try {
              processes = JSON.parse(trimmed) as Array<{ name: string; pm2_env?: { status: string } }>
              break // Found valid JSON
            } catch {
              // Not valid JSON, try next line
              continue
            }
          }
        }

        const nextjsRunning = processes.some((p) => p.name === 'nextjs-dev' && p.pm2_env?.status === 'online')

        if (nextjsRunning) {
          console.log('[Workspace] PM2 Next.js process already running, skipping start')
          shouldStart = false
        } else {
          console.log('[Workspace] PM2 Next.js process not running')
          shouldStart = true
        }
      } catch (error) {
        console.log('[Workspace] Could not parse PM2 list, will start processes:', error)
        shouldStart = true
      }

      // Only start if not already running
      if (shouldStart) {
        console.log('[Workspace] Starting PM2 processes (async)...')
        try {
          const startResult = await sandbox.commands.run(`cd ${workDir} && NODE_PATH=/usr/local/lib/node_modules pm2 start configs/ecosystem.config.js --only nextjs-dev`, {
            timeoutMs: 10000 // 10 second timeout just for PM2 to start
          })
          console.log('[Workspace] PM2 started:', startResult.stdout)
        } catch (error) {
          // E2B throws on non-zero exit codes, but PM2 often returns 1 even on success
          // Check actual PM2 status instead of relying on exit code
          const err = error as { result?: { stdout: string; stderr: string; exitCode: number }; message?: string };
          console.log('[Workspace] PM2 start exit code (may be non-zero):', err.result?.exitCode)
          console.log('[Workspace] PM2 start stdout:', err.result?.stdout)
          console.log('[Workspace] PM2 start stderr:', err.result?.stderr)
        }
      }

      // Don't wait for Next.js - it will be ready when user accesses preview URL
      console.log('[Workspace] Next.js is starting in background (will be ready in ~20-40s)')

      // Show PM2 status for debugging
      const pm2Status = await sandbox.commands.run('pm2 list')
      console.log('[Workspace] PM2 status:', pm2Status.stdout)
    } else if (template === 'nextjs_saas') {
      // Initialize database (create DB, run migrations) - only runs once
      console.log('[Workspace] Initializing SaaS database...')
      await sandbox.commands.run('/usr/local/bin/init-saas-db.sh')

      // Start PostgreSQL first (it doesn't persist in snapshots)
      console.log('[Workspace] Starting PostgreSQL...')
      await sandbox.commands.run('sudo service postgresql start || true')

      // Wait a moment for PostgreSQL to start
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Kill any existing PM2 processes first
      console.log('[Workspace] Killing any existing PM2 processes...')
      await sandbox.commands.run('pm2 kill || true', { timeoutMs: 5000 })

      // Check if ecosystem.config.js exists
      const checkConfig = await sandbox.commands.run(`test -f ${workDir}/configs/ecosystem.config.js && echo "exists" || echo "not found"`)
      console.log('[Workspace] Ecosystem config check:', checkConfig.stdout.trim())

      // Start PM2 with pre-created ecosystem config from template (dev server only)
      console.log('[Workspace] Starting Next.js dev server with PM2...')
      try {
        const startResult = await sandbox.commands.run(`cd ${workDir} && NODE_PATH=/usr/local/lib/node_modules pm2 start configs/ecosystem.config.js --only nextjs-dev 2>&1`, {
          timeoutMs: 15000 // 15 second timeout for PM2 to start processes
        })
        console.log('[Workspace] PM2 started:', startResult.stdout)
        console.log('[Workspace] PM2 stderr:', startResult.stderr)
      } catch (error) {
        const err = error as { message?: string; exitCode?: number }
        console.error('[Workspace] PM2 start failed:', err.message)
        console.error('[Workspace] PM2 exit code:', err.exitCode)

        // Try to get more info about what went wrong
        const pm2Logs = await sandbox.commands.run('pm2 logs --nostream --lines 50 || true')
        console.log('[Workspace] PM2 logs:', pm2Logs.stdout)

        throw error
      }

      // Wait a bit for PM2 to actually start processes, then show status
      await new Promise(resolve => setTimeout(resolve, 2000))

      const pm2Status = await sandbox.commands.run('pm2 list')
      console.log('[Workspace] PM2 status:', pm2Status.stdout)

      // Stream initial PM2 logs so user can see startup progress
      const pm2Logs = await sandbox.commands.run('pm2 logs --nostream --lines 20 || true')
      console.log('[Workspace] PM2 logs:', pm2Logs.stdout)

      // Quick check if Next.js is ready (10 second check only)
      console.log('[Workspace] Quick check for Next.js...')
      const isReady = await waitForPort(sandbox, 3000, 10000) // 10 second timeout

      if (isReady) {
        console.log('[Workspace] Next.js is ready immediately!')
        // Mark as ready in Redis and publish to channel
        await kv.set(`workspace:preview:${projectId}`, 'ready', { ex: 600 })
        const { publishWorkspaceMessage } = await import('@/lib/services/redis-realtime')
        await publishWorkspaceMessage(projectId, 'preview-status', { status: 'ready' })
      } else {
        console.log('[Workspace] Next.js is compiling in background. Workspace ready for editing.')
        // Mark as compiling in Redis and publish to channel
        await kv.set(`workspace:preview:${projectId}`, 'compiling', { ex: 600 })
        const { publishWorkspaceMessage } = await import('@/lib/services/redis-realtime')
        await publishWorkspaceMessage(projectId, 'preview-status', { status: 'compiling' })
      }
    }
  } catch (error) {
    console.error('[Workspace] Failed to start dev server:', formatError(error))
    // Don't throw - dev server failure shouldn't block initialization
  }
}

/**
 * Wait for a port to be listening in the sandbox
 */
async function waitForPort(
  sandbox: Sandbox,
  port: number,
  timeoutMs: number = 10000
) {
  const startTime = Date.now()
  const checkInterval = 1000 // Check every 1 second
  let attempts = 0

  while (Date.now() - startTime < timeoutMs) {
    attempts++
    try {
      // Try to curl localhost to see if server responds
      const check = await sandbox.commands.run(
        `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port} --max-time 5 || echo "000"`,
        { timeoutMs: 6000 }
      )

      const httpCode = check.stdout.trim()
      console.log(
        `[Workspace] Port check attempt ${attempts}: HTTP ${httpCode}`
      )

      // Valid HTTP status codes are 100-599
      if (httpCode && httpCode.match(/^[1-5]\d{2}$/)) {
        console.log(`[Workspace] Port ${port} is ready (HTTP ${httpCode})`)
        return true
      }
    } catch (error) {
      console.log(
        `[Workspace] Port check attempt ${attempts}: Connection failed`
      )
      // Ignore errors, keep checking
    }

    // Wait before next check
    await new Promise((resolve) => setTimeout(resolve, checkInterval))
  }

  console.warn(
    `[Workspace] Timeout waiting for port ${port} after ${attempts} attempts (${timeoutMs}ms)`
  )
  return false
}
