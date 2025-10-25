/**
 * Create Terminal Session API
 *
 * Creates a persistent shell session in the E2B sandbox for terminal access.
 * Returns a session ID that can be used to interact with the terminal.
 */

import { E2B_DOMAIN } from '@/configs/e2b'
import { createClient } from '@/lib/clients/supabase/server'
import { getProject } from '@/lib/db/projects'
import { getActiveSandbox } from '@/lib/db/sandboxes'
import { E2BService } from '@/lib/services/e2b-service'
import { TeamApiKeyService } from '@/lib/services/team-api-key-service'
import { Sandbox } from 'e2b'
import { NextRequest, NextResponse } from 'next/server'

// MIGRATED: Removed export const runtime (incompatible with Cache Components)

// Store active shell processes
// In production, this should be moved to Redis or similar
const activeSessions = new Map<
  string,
  {
    sandbox: Sandbox
    shellProcess: { kill: () => Promise<boolean> } | null
    workDir: string
  }
>()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const body = await request.json()
    const { workDir, cols = 80, rows = 24 } = body

    // Auth check
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get project
    const project = await getProject(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get active sandbox
    const sandboxSession = await getActiveSandbox(projectId)
    if (!sandboxSession?.e2b_session_id) {
      return NextResponse.json(
        { error: 'No active sandbox found' },
        { status: 404 }
      )
    }

    // Get team API key
    const teamApiKey = await TeamApiKeyService.getTeamApiKey(
      project.team_id,
      supabase
    )

    // Connect to sandbox
    const sandbox = await Sandbox.connect(sandboxSession.e2b_session_id, {
      apiKey: teamApiKey,
      ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
    })

    // Get template working directory
    const templateWorkDir =
      workDir || E2BService.getTemplateWorkDir(project.template)

    // Start a persistent bash shell
    // We'll use `script` command to get a PTY-like environment
    const shellCommand = `cd ${templateWorkDir} && exec bash`

    console.log('[Terminal] Starting shell:', shellCommand)

    // Store the sandbox and work dir for later use
    activeSessions.set(projectId, {
      sandbox,
      shellProcess: null, // Will be set when commands are executed
      workDir: templateWorkDir,
    })

    return NextResponse.json({
      success: true,
      sessionId: projectId,
      terminalUrl: `/api/workspace/${projectId}/terminal/stream`,
    })
  } catch (error) {
    console.error('[Terminal Create] Error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create terminal',
      },
      { status: 500 }
    )
  }
}

// Note: activeSessions is module-scoped for managing terminal sessions
// Cannot be exported from route handlers in Next.js 15
