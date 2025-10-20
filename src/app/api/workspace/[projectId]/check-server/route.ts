/**
 * Check if dev server is responding on port 3000
 */

import { createClient } from '@/lib/clients/supabase/server'
import { getProject } from '@/lib/db/projects'
import { E2BService } from '@/lib/services/e2b-service'
import { TeamApiKeyService } from '@/lib/services/team-api-key-service'
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

    const project = await getProject(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { sandbox } = await E2BService.getOrCreateSandboxWithSnapshot(projectId, supabase)

    // Check if port 3000 is responding
    const check = await sandbox.commands.run(
      'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 2 || echo "000"',
      { timeoutMs: 3000 }
    )

    const httpCode = check.stdout.trim()
    const isReady = httpCode && httpCode.match(/^[1-5]\d{2}$/) !== null

    return NextResponse.json({
      ready: isReady,
      httpCode,
    })
  } catch (error) {
    console.error('[Check Server] Error:', error)
    return NextResponse.json(
      {
        ready: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 } // Return 200 so frontend can check ready=false
    )
  }
}
