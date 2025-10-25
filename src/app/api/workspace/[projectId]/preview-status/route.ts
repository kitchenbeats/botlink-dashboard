import { kv } from '@/lib/clients/kv'
import { createClient } from '@/lib/clients/supabase/server'
import { getProject } from '@/lib/db/projects'
import { getActiveSandbox } from '@/lib/db/sandboxes'
import { TeamApiKeyService } from '@/lib/services/team-api-key-service'
import { Sandbox } from 'e2b'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/workspace/[projectId]/preview-status
 *
 * Returns the current status of the dev server preview:
 * - 'ready': Dev server is running and responding
 * - 'compiling': Next.js is compiling (PM2 started but port not ready)
 * - 'starting': HTTP server is starting
 * - 'error': Failed to start or not found
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params

    // Check Redis cache first
    const cachedStatus = await kv.get<string>(`workspace:preview:${projectId}`)
    if (cachedStatus) {
      console.log(
        `[PreviewStatus] Cached status for ${projectId}:`,
        cachedStatus
      )
      return NextResponse.json({ status: cachedStatus })
    }

    // No cached status - check live
    const project = await getProject(projectId)
    if (!project) {
      return NextResponse.json(
        { status: 'error', error: 'Project not found' },
        { status: 404 }
      )
    }

    const activeSandbox = await getActiveSandbox(projectId)
    if (!activeSandbox?.e2b_session_id) {
      return NextResponse.json({ status: 'error', error: 'No active sandbox' })
    }

    // Connect to sandbox and check port 3000
    const teamApiKey = await TeamApiKeyService.getTeamApiKey(
      project.team_id,
      supabase
    )
    const E2B_DOMAIN = process.env.E2B_DOMAIN

    const sandbox = await Sandbox.connect(activeSandbox.e2b_session_id, {
      apiKey: teamApiKey,
      ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
    })

    try {
      // Quick port check (2 second timeout)
      const check = await sandbox.commands.run(
        `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 2 || echo "000"`,
        { timeoutMs: 3000 }
      )

      const httpCode = check.stdout.trim()
      const isReady = httpCode && httpCode.match(/^[1-5]\d{2}$/)

      const status = isReady ? 'ready' : 'compiling'

      // Cache result for 10 seconds
      await kv.set(`workspace:preview:${projectId}`, status, { ex: 10 })

      return NextResponse.json({ status })
    } catch (error) {
      console.error('[PreviewStatus] Port check failed:', error)
      return NextResponse.json({ status: 'compiling' })
    }
  } catch (error) {
    console.error('[PreviewStatus] Error:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
