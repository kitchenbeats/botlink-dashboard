import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/clients/supabase/server';
import { deleteProject } from '@/lib/db/projects';
import { getActiveSandbox } from '@/lib/db/sandboxes';
import { Sandbox } from 'e2b';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get the project to verify ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('team_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this team
    const { data: userTeam, error: teamError } = await supabase
      .from('users_teams')
      .select('*')
      .eq('user_id', user.id)
      .eq('team_id', (project as { team_id: string }).team_id)
      .single();

    if (teamError || !userTeam) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check for active sandboxes and stop them
    try {
      const activeSandbox = await getActiveSandbox(projectId);
      if (activeSandbox && activeSandbox.e2b_session_id) {
        try {
          // Try to kill the sandbox via E2B API
          const sandbox = await Sandbox.connect(activeSandbox.e2b_session_id);
          await sandbox.kill();
          console.log(`[DELETE /api/workspace/${projectId}] Stopped sandbox:`, activeSandbox.e2b_session_id);
        } catch (sandboxError) {
          // Sandbox might already be stopped or expired, log but continue
          console.warn(`[DELETE /api/workspace/${projectId}] Failed to stop sandbox:`, sandboxError);
        }
      }
    } catch (sandboxCheckError) {
      console.warn(`[DELETE /api/workspace/${projectId}] Error checking for active sandbox:`, sandboxCheckError);
      // Continue with deletion even if sandbox check fails
    }

    // Delete the project (cascades to files and sandbox_sessions)
    await deleteProject(projectId);

    console.log(`[DELETE /api/workspace/${projectId}] Project deleted successfully`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/workspace/:projectId] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete project',
      },
      { status: 500 }
    );
  }
}
