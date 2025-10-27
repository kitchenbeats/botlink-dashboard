import { NextRequest, NextResponse } from 'next/server'
import { updateSandbox } from '@/lib/db/sandboxes'
import crypto from 'crypto'

/**
 * E2B Webhook Endpoint
 * Receives sandbox lifecycle events from E2B infrastructure
 *
 * Expected payload:
 * {
 *   "eventCategory": "sandbox",
 *   "eventLabel": "kill" | "create" | "pause" | "resume",
 *   "sandboxId": "string",
 *   "sandboxTeamId": "string",
 *   "timestamp": "ISO 8601 datetime"
 * }
 *
 * Security: Requires X-E2B-Signature header with HMAC-SHA256 signature
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text()
    const payload = JSON.parse(body)

    console.log('[E2B Webhook] Received event:', payload)

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.E2B_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = request.headers.get('x-e2b-signature')
      if (!signature) {
        console.error('[E2B Webhook] Missing signature header')
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 401 }
        )
      }

      // Verify HMAC-SHA256 signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')

      if (signature !== expectedSignature) {
        console.error('[E2B Webhook] Invalid signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }

      console.log('[E2B Webhook] Signature verified')
    }

    // Validate payload structure
    if (!payload.eventCategory || !payload.eventLabel || !payload.sandboxId) {
      console.error('[E2B Webhook] Invalid payload:', payload)
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      )
    }

    // Handle different event types
    switch (payload.eventLabel) {
      case 'kill':
        await handleSandboxKill(payload.sandboxId)
        break

      case 'pause':
        await handleSandboxPause(payload.sandboxId)
        break

      case 'create':
        console.log('[E2B Webhook] Sandbox created:', payload.sandboxId)
        // We already track this in our DB when we create it
        break

      default:
        console.log('[E2B Webhook] Unhandled event type:', payload.eventLabel)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[E2B Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle sandbox kill event
 * Verify sandbox is actually removed, then update database
 */
async function handleSandboxKill(e2bSessionId: string) {
  try {
    const { getDb } = await import('@/lib/db')
    const db = await getDb()

    // Find the sandbox session by E2B session ID
    const { data: session, error } = await db
      .from('sandbox_sessions')
      .select('*, projects!inner(team_id)')
      .eq('e2b_session_id', e2bSessionId)
      .single()

    if (error || !session) {
      console.warn('[E2B Webhook] Sandbox not found in DB:', e2bSessionId)
      return
    }

    // Verify sandbox is actually removed by attempting to connect
    const { Sandbox } = await import('e2b')
    const { TeamApiKeyService } = await import('@/lib/services/team-api-key-service')
    const E2B_DOMAIN = process.env.E2B_DOMAIN

    // Type assertion for joined data
    type SessionWithProject = {
      id: string
      e2b_session_id: string
      projects: { team_id: string }
    }
    const sessionWithProject = session as unknown as SessionWithProject

    try {
      // Get team API key to verify sandbox status
      const teamApiKey = await TeamApiKeyService.getTeamApiKeyServiceRole(
        sessionWithProject.projects.team_id
      )

      // Try to connect - this should FAIL if sandbox is actually killed/removed
      const sandbox = await Sandbox.connect(e2bSessionId, {
        apiKey: teamApiKey,
        ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
      })

      // If we got here, sandbox is STILL ALIVE - force kill it
      console.warn('[E2B Webhook] Sandbox still alive after kill event! Force killing:', e2bSessionId)
      await sandbox.kill()
      console.log('[E2B Webhook] Force killed zombie sandbox:', e2bSessionId)
    } catch (connectError) {
      // Expected - sandbox should not be connectable after kill
      const errorMessage = connectError instanceof Error ? connectError.message : String(connectError)
      if (errorMessage.includes('not found') || errorMessage.includes('Sandbox not found')) {
        console.log('[E2B Webhook] Verified sandbox is removed:', e2bSessionId)
      } else {
        console.warn('[E2B Webhook] Unexpected error verifying removal:', errorMessage)
      }
    }

    // Update status to removed (VM destroyed, no cost)
    await updateSandbox(sessionWithProject.id, {
      status: 'stopped',
      stopped_at: new Date().toISOString()
    })

    console.log('[E2B Webhook] Updated sandbox status to removed:', e2bSessionId)
  } catch (error) {
    console.error('[E2B Webhook] Error handling sandbox kill:', error)
    throw error
  }
}

/**
 * Handle sandbox pause event
 * VM still allocated but not running (still costs money)
 *
 * IMPORTANT: When E2B auto-pauses a sandbox, it creates a snapshot internally.
 * We need to track this snapshot in our database so we can restore from it later.
 */
async function handleSandboxPause(e2bSessionId: string) {
  try {
    const { getDb } = await import('@/lib/db')
    const db = await getDb()

    // Find the sandbox session with project info
    const { data: session, error } = await db
      .from('sandbox_sessions')
      .select('*, projects!inner(id, team_id)')
      .eq('e2b_session_id', e2bSessionId)
      .single()

    if (error || !session) {
      console.warn('[E2B Webhook] Sandbox not found in DB:', e2bSessionId)
      return
    }

    // Type assertion for session with project
    type SessionWithProject = {
      id: string
      e2b_session_id: string
      projects: { id: string; team_id: string }
    }
    const typedSession = session as unknown as SessionWithProject

    // Track the auto-pause snapshot using SnapshotService
    // When E2B pauses, the snapshot ID is the same as the sandbox ID
    try {
      const { SnapshotService } = await import('@/lib/services/snapshot-service')
      await SnapshotService.trackExistingSnapshot(
        typedSession.projects.id,
        e2bSessionId,
        'Auto-saved by E2B (idle timeout)'
      )
    } catch (snapshotError) {
      console.error('[E2B Webhook] Failed to track snapshot:', snapshotError)
      // Continue even if snapshot tracking fails
    }

    // Update sandbox status to stopped (VM deallocated/paused, snapshot saved)
    await updateSandbox(typedSession.id, {
      status: 'stopped',
    })

    console.log('[E2B Webhook] Updated sandbox status to stopped (paused):', e2bSessionId)
  } catch (error) {
    console.error('[E2B Webhook] Error handling sandbox pause:', error)
    throw error
  }
}
