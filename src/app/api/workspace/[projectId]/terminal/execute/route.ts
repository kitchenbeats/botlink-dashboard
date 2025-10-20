/**
 * Terminal Execute API
 *
 * Executes a command in the E2B sandbox and returns the output.
 * Simple command-response model (not interactive PTY).
 */

import { E2B_DOMAIN } from '@/configs/e2b'
import { createClient } from '@/lib/clients/supabase/server'
import { getProject } from '@/lib/db/projects'
import { getActiveSandbox } from '@/lib/db/sandboxes'
import { E2BService } from '@/lib/services/e2b-service'
import { TeamApiKeyService } from '@/lib/services/team-api-key-service'
import { Sandbox } from 'e2b'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for long-running commands

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const body = await request.json()
    const { command } = body

    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      )
    }

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

    // Get working directory for this template
    const workDir = E2BService.getTemplateWorkDir(project.template)

    // Execute command in sandbox
    console.log('[Terminal Execute]', command)
    const result = await sandbox.commands.run(`cd ${workDir} && ${command}`, {
      timeoutMs: 300000, // 5 min timeout
    })

    return NextResponse.json({
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.exitCode,
      success: result.exitCode === 0,
    })
  } catch (error) {
    console.error('[Terminal Execute] Error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Command execution failed',
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        exitCode: 1,
        success: false,
      },
      { status: 500 }
    )
  }
}
