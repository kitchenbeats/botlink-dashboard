/**
 * Reset Workspace Ready Flag API
 *
 * Clears the workspace ready flag from Redis to force re-initialization.
 * Used when recovering from dead sandbox scenarios.
 */

import { kv } from '@/lib/clients/kv'
import { createClient } from '@/lib/clients/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

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

    // Clear the ready flag to force re-initialization
    const readyKey = `workspace:ready:${projectId}`
    await kv.del(readyKey)

    console.log('[Reset Ready Flag] Cleared workspace ready flag for project:', projectId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Reset Ready Flag] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to reset ready flag',
      },
      { status: 500 }
    )
  }
}
