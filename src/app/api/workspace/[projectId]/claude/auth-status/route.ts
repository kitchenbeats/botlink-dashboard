/**
 * Claude Authentication Status API
 *
 * Checks if Claude Code is authenticated in the E2B sandbox.
 * Used to show helpful UI guidance about authentication.
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
export const maxDuration = 10

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

    // Get project
    const project = await getProject(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get active sandbox
    const sandboxSession = await getActiveSandbox(projectId)
    if (!sandboxSession?.e2b_session_id) {
      return NextResponse.json(
        {
          isAuthenticated: false,
          error: 'No active sandbox',
        },
        { status: 200 }
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

    // Check if Claude Code is authenticated with USER account (not API key)
    // Claude stores user auth tokens in ~/.config/claude-code/
    // We need to check if this directory exists and has valid tokens
    const authCheck = await sandbox.commands.run(
      `test -f ~/.config/claude-code/credentials.json && echo "authenticated" || echo "not_authenticated"`,
      { timeoutMs: 5000 }
    )

    // User is authenticated if credentials file exists
    const isAuthenticated = authCheck.stdout?.trim() === 'authenticated'

    return NextResponse.json({
      isAuthenticated,
      message: isAuthenticated
        ? 'Claude Code is authenticated'
        : 'Claude Code requires authentication',
    })
  } catch (error) {
    console.error('[Claude Auth Status] Error:', error)
    return NextResponse.json(
      {
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 } // Return 200 even on error so UI can show auth prompt
    )
  }
}
