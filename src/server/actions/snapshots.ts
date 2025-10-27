'use server';

import { authActionClient } from '@/lib/clients/action';
import { z } from 'zod';
import { ActionError } from '@/lib/utils/action';
import { getProject } from '@/lib/db/projects';
import { getSandboxByProjectId } from '@/lib/db/sandboxes';
import { SnapshotService } from '@/lib/services/snapshot-service';
import { E2BService } from '@/lib/services/e2b-service';
import { TeamApiKeyService } from '@/lib/services/team-api-key-service';

const createSnapshotSchema = z.object({
  projectId: z.string().uuid(),
  description: z.string().optional(),
});

/**
 * Create a manual snapshot of the current sandbox state
 */
export const createProjectSnapshot = authActionClient
  .schema(createSnapshotSchema)
  .metadata({ actionName: 'createProjectSnapshot' })
  .action(async ({ parsedInput, ctx }) => {
    const { projectId, description } = parsedInput;
    const { supabase } = ctx;

    // Get project and verify access
    const project = await getProject(projectId);
    if (!project) {
      throw new ActionError('Project not found');
    }

    // Get active sandbox and connect
    const result = await E2BService.getSandbox(projectId, supabase);
    if (!result) {
      throw new ActionError('No active sandbox found for this project');
    }
    const e2bSandbox = result.sandbox;

    // Get team API key for snapshot service
    const teamApiKey = await TeamApiKeyService.getTeamApiKey(
      project.team_id,
      supabase
    );

    // Create snapshot (pause the sandbox)
    const snapshotId = await SnapshotService.createSnapshot(
      e2bSandbox,
      projectId,
      description || 'Manual snapshot',
      teamApiKey
    );

    return {
      success: true,
      snapshotId,
      message: 'Snapshot created successfully'
    };
  });

const listSnapshotsSchema = z.object({
  projectId: z.string().uuid(),
});

/**
 * List all snapshots for a project
 */
export const listProjectSnapshots = authActionClient
  .schema(listSnapshotsSchema)
  .metadata({ actionName: 'listProjectSnapshots' })
  .action(async ({ parsedInput }) => {
    const { projectId } = parsedInput;

    const snapshots = await SnapshotService.getProjectSnapshots(projectId);

    return { snapshots };
  });

const deleteSnapshotSchema = z.object({
  snapshotId: z.string(),
});

/**
 * Delete a snapshot
 */
export const deleteProjectSnapshot = authActionClient
  .schema(deleteSnapshotSchema)
  .metadata({ actionName: 'deleteProjectSnapshot' })
  .action(async ({ parsedInput }) => {
    const { snapshotId } = parsedInput;

    await SnapshotService.deleteSnapshot(snapshotId);

    return {
      success: true,
      message: 'Snapshot deleted successfully'
    };
  });

const saveAndCloseSandboxSchema = z.object({
  projectId: z.string().uuid(),
});

/**
 * Close workspace (for "Close Workspace" button)
 * Simply lets E2B auto-pause the sandbox - no manual snapshots needed
 */
export const saveAndCloseSandbox = authActionClient
  .schema(saveAndCloseSandboxSchema)
  .metadata({ actionName: 'saveAndCloseSandbox' })
  .action(async ({ parsedInput, ctx }) => {
    const { projectId } = parsedInput;
    const { supabase } = ctx;

    // Get project
    const project = await getProject(projectId);
    if (!project) {
      throw new ActionError('Project not found');
    }

    // Get active sandbox
    const sandbox = await getSandboxByProjectId(projectId);
    if (!sandbox || sandbox.status !== 'ready') {
      // No active sandbox, nothing to do
      return {
        success: true,
        message: 'No active sandbox to close'
      };
    }

    // Get team API key
    const teamApiKey = await TeamApiKeyService.getTeamApiKey(
      project.team_id,
      supabase
    );

    // Pause the sandbox using E2B's pause API (preserves state for resume)
    const { E2B_API_URL } = await import('@/configs/e2b');

    try {
      const response = await fetch(
        `${E2B_API_URL}/sandboxes/${sandbox.e2b_session_id}/pause`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': teamApiKey,
          },
          body: JSON.stringify({}),
        }
      );

      if (response.ok) {
        console.log('[Save & Close] Successfully paused sandbox:', sandbox.e2b_session_id);

        // Keep sandbox record as 'ready' so it can be resumed later
        // E2B will auto-pause and create internal snapshot
        return {
          success: true,
          message: 'Workspace closed (will auto-pause)'
        };
      } else {
        console.warn('[Save & Close] Pause failed, letting auto-pause handle it');
      }
    } catch (error) {
      console.error('[Save & Close] Error pausing sandbox:', error);
      // Don't throw - just let auto-pause handle it
    }

    // If pause fails, just let E2B auto-pause after timeout
    return {
      success: true,
      message: 'Workspace closed (will auto-pause)'
    };
  });
