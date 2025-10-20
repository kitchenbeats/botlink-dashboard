/**
 * Open PTY bash shell for Claude Code
 * Called on workspace mount to prepare the PTY session
 */

import { createClient } from '@/lib/clients/supabase/server'
import { getProject } from '@/lib/db/projects'
import { getActiveSandbox } from '@/lib/db/sandboxes'
import { E2BService } from '@/lib/services/e2b-service'
import { TeamApiKeyService } from '@/lib/services/team-api-key-service'
import { startClaudeSession } from '@/lib/services/claude-session-manager'
import { E2B_DOMAIN } from '@/configs/e2b'
import { Sandbox } from 'e2b'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(
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

    console.log('[Claude PTY] Opening bash shell (not starting Claude yet)...')

    // Create settings file to force claudeai login method
    await sandbox.commands.run(`
      cd ${workDir}
      mkdir -p .claude
      cat > .claude/settings.json << 'EOF'
{
  "forceLoginMethod": "claudeai"
}
EOF
    `)

    // Start PTY bash shell but DON'T send claude command yet
    const session = await startClaudeSession({
      sandbox,
      projectId,
      workDir,
    })

    console.log('[Claude PTY] Bash shell opened:', session.id)
    console.log('[Claude PTY] Ready for claude command')

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      message: 'PTY bash shell ready. Use /claude/start to send claude command.',
    })
  } catch (error) {
    console.error('[Claude PTY] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open PTY',
      },
      { status: 500 }
    )
  }
}
