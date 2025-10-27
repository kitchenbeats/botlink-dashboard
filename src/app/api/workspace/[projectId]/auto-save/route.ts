import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/clients/supabase/server';
import { getProject } from '@/lib/db/projects';
import { getSandboxByProjectId } from '@/lib/db/sandboxes';

/**
 * Auto-save endpoint
 * No longer creates E2B snapshots - E2B handles pause/resume automatically
 * TODO: In the future, this should trigger git commits instead
 * Called by:
 * 1. beforeunload event (when user leaves page)
 * 2. Periodic auto-save interval (every 5 minutes)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get project
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get active sandbox
    const sandbox = await getSandboxByProjectId(projectId);
    if (!sandbox || sandbox.status !== 'ready') {
      console.log('[Auto-save] No active sandbox');
      return NextResponse.json({
        success: true,
        saved: false,
        message: 'No active sandbox'
      });
    }

    // E2B handles pause/resume automatically - no manual snapshots needed
    // When sandbox times out (10 min), E2B will auto-pause and create internal snapshot
    // When user returns, we just call resume API to restore state

    console.log('[Auto-save] Sandbox active, E2B will auto-pause after timeout');

    return NextResponse.json({
      success: true,
      saved: false, // No manual save needed
      message: 'E2B will auto-pause after timeout'
    });
  } catch (error) {
    console.error('[Auto-save] Error:', error);

    // Don't throw errors for auto-save - it's best-effort
    return NextResponse.json({
      success: false,
      saved: false,
      error: error instanceof Error ? error.message : 'Auto-save failed'
    }, { status: 200 }); // Return 200 to avoid console errors
  }
}
