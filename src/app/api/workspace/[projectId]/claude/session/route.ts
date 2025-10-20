/**
 * Claude Session API
 *
 * Manages Claude Code interactive sessions for workspace projects.
 * Provides endpoints to start, send messages, and stop sessions.
 */

import { E2B_DOMAIN } from '@/configs/e2b'
import { createClient } from '@/lib/clients/supabase/server'
import { getProject } from '@/lib/db/projects'
import { getActiveSandbox } from '@/lib/db/sandboxes'
import {
  getClaudeSession,
  restartClaudeSession,
  sendToClaudeSession,
  startClaudeSession,
  stopClaudeSession,
} from '@/lib/services/claude-session-manager'
import { E2BService } from '@/lib/services/e2b-service'
import { TeamApiKeyService } from '@/lib/services/team-api-key-service'
import { Sandbox } from 'e2b'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * POST - Start a new Claude session or send a message to existing session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const body = await request.json()
    const { action, message, contextSummary } = body

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
        { error: 'No active sandbox found. Please start the workspace first.' },
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

    const workDir = E2BService.getTemplateWorkDir(project.template)

    // Handle different actions
    if (action === 'start') {
      // Start a new Claude session
      const session = await startClaudeSession({
        sandbox,
        projectId,
        workDir,
      })

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        message: 'Claude session started',
      })
    } else if (action === 'send') {
      // Send message to existing session
      if (!message) {
        return NextResponse.json(
          { error: 'Message is required' },
          { status: 400 }
        )
      }

      // Check if session exists, if not start it
      let session = getClaudeSession(projectId)
      if (!session) {
        console.log('[Claude Session API] No session found, starting new one')
        session = await startClaudeSession({
          sandbox,
          projectId,
          workDir,
        })
      }

      // Send the message
      await sendToClaudeSession(sandbox, projectId, message)

      return NextResponse.json({
        success: true,
        message: 'Message sent to Claude',
      })
    } else if (action === 'restart') {
      // Restart session with optional context
      const session = await restartClaudeSession(
        {
          sandbox,
          projectId,
          workDir,
        },
        contextSummary
      )

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        message: 'Claude session restarted',
      })
    } else if (action === 'stop') {
      // Stop the session
      await stopClaudeSession(sandbox, projectId)

      return NextResponse.json({
        success: true,
        message: 'Claude session stopped',
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be: start, send, restart, or stop' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[Claude Session API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Get session status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    // Auth check
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = getClaudeSession(projectId)

    if (!session) {
      return NextResponse.json({
        exists: false,
        message: 'No active session',
      })
    }

    return NextResponse.json({
      exists: true,
      sessionId: session.id,
      isRunning: session.isRunning,
      startedAt: session.startedAt,
      lastActivityAt: session.lastActivityAt,
    })
  } catch (error) {
    console.error('[Claude Session API] Error getting status:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Stop session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

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

    await stopClaudeSession(sandbox, projectId)

    return NextResponse.json({
      success: true,
      message: 'Session stopped',
    })
  } catch (error) {
    console.error('[Claude Session API] Error stopping session:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
