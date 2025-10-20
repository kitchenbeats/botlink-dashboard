/**
 * Start Claude Code
 * Opens PTY if needed, then sends 'claude' command
 */

import { createClient } from '@/lib/clients/supabase/server'
import { getProject } from '@/lib/db/projects'
import { getActiveSandbox } from '@/lib/db/sandboxes'
import { E2BService } from '@/lib/services/e2b-service'
import { TeamApiKeyService } from '@/lib/services/team-api-key-service'
import { startClaudeSession, sendToClaudeSession, getClaudeSession } from '@/lib/services/claude-session-manager'
import { E2B_DOMAIN } from '@/configs/e2b'
import { Sandbox } from 'e2b'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  console.log('[SERVER API] ========== /api/workspace/[projectId]/claude/start REQUEST RECEIVED ==========')

  try {
    const { projectId } = await params
    console.log('[SERVER API] projectId:', projectId)

    // Auth check
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    console.log('[SERVER API] User:', user?.id)

    if (!user) {
      console.log('[SERVER API ERROR] ========== UNAUTHORIZED ==========')
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

    // Get working directory
    const workDir = E2BService.getTemplateWorkDir(project.template)

    // Always create a fresh session (don't reuse from memory - serverless can't maintain persistent connections)
    console.log('[Claude Start] Creating new PTY session...')

    // Check if claude is installed
    const checkClaude = await sandbox.commands.run('which claude')
    console.log('[Claude Start] Claude location:', checkClaude.stdout.trim())

    if (!checkClaude.stdout.trim()) {
      console.error('[Claude Start] Claude CLI not found in sandbox!')
      return NextResponse.json(
        { error: 'Claude CLI not installed in sandbox. Please check template setup.' },
        { status: 500 }
      )
    }

    // Start PTY session with claude running directly
    const session = await startClaudeSession({
      sandbox,
      projectId,
      workDir,
    })

    console.log('[Claude Start] Claude session started with PID:', session.pid)

    console.log('[SERVER API] Claude PTY started, output should stream to UI')
    console.log('[SERVER API] ========== SUCCESS - RETURNING 200 ==========')

    return NextResponse.json({
      success: true,
      message: 'Claude Code started. Output streaming to chat.',
    })
  } catch (error) {
    console.error('[SERVER API ERROR] ========== REQUEST FAILED ==========', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start Claude',
      },
      { status: 500 }
    )
  }
}
