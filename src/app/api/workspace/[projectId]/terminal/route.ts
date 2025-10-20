/**
 * Terminal WebSocket API Route
 *
 * Creates E2B PTY session with Claude and returns connection info.
 * The actual WebSocket connection to PTY happens via Redis pub/sub SSE
 * (Next.js doesn't support native WebSocket upgrades in App Router)
 */

import { E2B_DOMAIN } from '@/configs/e2b'
import { createClient } from '@/lib/clients/supabase/server'
import { getProject } from '@/lib/db/projects'
import { getActiveSandbox } from '@/lib/db/sandboxes'
import { E2BService } from '@/lib/services/e2b-service'
import { TeamApiKeyService } from '@/lib/services/team-api-key-service'
import { startClaudeSession } from '@/lib/services/claude-session-manager'
import { Sandbox } from 'e2b'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Start Claude PTY session
 * GET /api/workspace/[projectId]/terminal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    // Verify user has access to this project
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Get project
    const project = await getProject(projectId)
    if (!project) {
      return new Response('Project not found', { status: 404 })
    }

    // Get active sandbox
    const sandboxSession = await getActiveSandbox(projectId)
    if (!sandboxSession?.e2b_session_id) {
      return new Response('No active sandbox found', { status: 404 })
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

    // Get working directory
    const workDir = E2BService.getTemplateWorkDir(project.template)

    // Start Claude PTY session
    // This creates the PTY and streams output via Redis pub/sub
    const session = await startClaudeSession({
      sandbox,
      projectId,
      workDir,
    })

    return Response.json({
      success: true,
      sessionId: session.id,
      pid: session.pid,
      message: 'Claude PTY started. Output streams via Redis SSE.',
    })
  } catch (error) {
    console.error('[Terminal API] Error:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    )
  }
}
