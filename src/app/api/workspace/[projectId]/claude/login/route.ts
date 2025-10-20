/**
 * Claude Login API
 *
 * Starts an interactive Claude Code session for login.
 * This is just a regular Claude session - the user interacts with it normally.
 * The session manager handles all the PTY/streaming automatically.
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

    console.log('[Claude Login] Starting interactive Claude session for login...')

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

    // Just start a normal Claude session using our session manager!
    // The user will interact with it like any other Claude session
    const session = await startClaudeSession({
      sandbox,
      projectId,
      workDir,
    })

    console.log('[Claude Login] Interactive Claude session started:', session.id)
    console.log('[Claude Login] User can now interact with Claude for login')

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      message: 'Claude session started. You can now interact with it to complete login.',
    })
  } catch (error) {
    console.error('[Claude Login] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      },
      { status: 500 }
    )
  }
}
