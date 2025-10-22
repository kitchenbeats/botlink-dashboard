/**
 * Claude Authentication Check API
 *
 * Checks if .claude/.token file exists in the sandbox
 */

import { createClient } from '@/lib/clients/supabase/server';
import { getProject } from '@/lib/db/projects';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * GET - Check if Claude is authenticated (token file exists)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    console.log('[Claude Check Auth] Checking authentication for project:', projectId);

    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get project
    const project = await getProject(projectId);
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get sandbox
    const { E2BService } = await import('@/lib/services/e2b-service');
    const { sandbox } = await E2BService.getOrCreateSandboxWithSnapshot(projectId, supabase);

    // Get working directory and token path
    const workDir = E2BService.getTemplateWorkDir(project.template);
    const tokenPath = `${workDir}/.claude/.token`;

    console.log('[Claude Check Auth] Checking token at:', tokenPath);

    // Try to read the token file
    try {
      const tokenContent = await sandbox.files.read(tokenPath);

      if (tokenContent && tokenContent.trim().length > 0) {
        console.log('[Claude Check Auth] ✓ Token found, authenticated');
        return Response.json({
          authenticated: true,
          tokenExists: true,
          message: 'Claude Code is authenticated'
        });
      } else {
        console.log('[Claude Check Auth] ✗ Token file empty');
        return Response.json({
          authenticated: false,
          tokenExists: false,
          message: 'Token file exists but is empty'
        });
      }
    } catch (error) {
      console.log('[Claude Check Auth] ✗ Token file not found:', error instanceof Error ? error.message : 'Unknown error');
      return Response.json({
        authenticated: false,
        tokenExists: false,
        message: 'Claude Code not authenticated - token file not found'
      });
    }

  } catch (error) {
    console.error('[Claude Check Auth] Error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Failed to check authentication',
        authenticated: false,
        tokenExists: false
      },
      { status: 500 }
    );
  }
}
