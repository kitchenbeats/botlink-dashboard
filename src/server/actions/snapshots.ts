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

    // Get active sandbox
    const sandbox = await getSandboxByProjectId(projectId);
    if (!sandbox || sandbox.status !== 'ready') {
      throw new ActionError('No active sandbox found for this project');
    }

    // Get team API key for E2B
    const teamApiKey = await TeamApiKeyService.getTeamApiKey(
      project.team_id,
      supabase
    );

    // Get the E2B sandbox instance
    const e2bSandbox = await E2BService.connectToSandbox(
      sandbox.e2b_session_id,
      teamApiKey
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
 * Save snapshot and close sandbox (for "Close Workspace" button)
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
      // No active sandbox, nothing to save
      return {
        success: true,
        saved: false,
        message: 'No active sandbox to save'
      };
    }

    // Get team API key
    const teamApiKey = await TeamApiKeyService.getTeamApiKey(
      project.team_id,
      supabase
    );

    // Connect to E2B sandbox
    const e2bSandbox = await E2BService.connectToSandbox(
      sandbox.e2b_session_id,
      teamApiKey
    );

    // Auto-save snapshot (pause the sandbox)
    const snapshotId = await SnapshotService.autoSave(e2bSandbox, projectId, teamApiKey);

    // Kill sandbox
    await E2BService.killSandbox(sandbox.id, e2bSandbox);

    return {
      success: true,
      saved: !!snapshotId,
      snapshotId,
      message: snapshotId
        ? 'Workspace saved and closed'
        : 'Workspace closed (no changes to save)'
    };
  });
