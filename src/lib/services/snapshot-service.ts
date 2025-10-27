/**
 * E2B Runtime Snapshot Service
 *
 * Manages saving and restoring sandbox snapshots for projects.
 * This allows users to pause work and resume exactly where they left off.
 *
 * E2B Snapshot Implementation:
 * - Pause API creates snapshot: POST /sandboxes/{sandboxID}/pause
 * - Resume API restores snapshot: POST /sandboxes/{sandboxID}/resume
 * - Snapshots preserve entire VM state (files, processes, env vars)
 */

import { Sandbox } from 'e2b';
import { getDb } from '@/lib/db';
import {
  E2B_DOMAIN,
  E2B_API_URL,
  SKIP_SNAPSHOT_IF_NO_CHANGES,
} from '@/configs/e2b';

export interface SnapshotMetadata {
  project_id: string;
  snapshot_id: string;
  created_at: string;
  description?: string;
  file_count?: number;
  size_mb?: number;
}

export class SnapshotService {
  /**
   * Create a snapshot of a running sandbox
   * This saves the entire VM state including:
   * - All files and directories
   * - Running processes
   * - Environment variables
   * - Network state
   */
  static async createSnapshot(
    sandbox: Sandbox,
    projectId: string,
    description?: string,
    apiKey?: string
  ): Promise<string> {
    console.log('[Snapshot] Creating snapshot via pause API for project:', projectId);

    try {
      // STEP 1: Delete all old snapshots for this project (keep only latest)
      await this.cleanupOldSnapshots(projectId);

      // STEP 2: Create new snapshot by pausing the sandbox
      // API: POST /sandboxes/{sandboxID}/pause
      const response = await fetch(`${E2B_API_URL}/sandboxes/${sandbox.sandboxId}/pause`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey || '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`E2B pause API failed: ${response.status} ${errorText}`);
      }

      // Use sandboxId as snapshotId (paused sandboxes can be resumed by ID)
      const snapshotId = sandbox.sandboxId;

      // STEP 3: Save new snapshot metadata to database
      const db = await getDb();
      // Note: project_snapshots table exists but may not be in generated types yet
      // Using type assertion since table may not be in generated Supabase types
      const query = db.from('project_snapshots') as ReturnType<typeof db.from>;
      const { error } = await query.insert({
        project_id: projectId,
        snapshot_id: snapshotId,
        description: description || 'Auto-saved snapshot',
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      console.log('[Snapshot] Created snapshot (paused):', snapshotId, '- Old snapshots cleaned up');
      return snapshotId;
    } catch (error) {
      console.error('[Snapshot] Failed to create snapshot:', error);
      throw new Error(`Failed to create snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restore a sandbox from a snapshot
   * This creates a new sandbox with the exact state from when snapshot was taken
   */
  static async restoreFromSnapshot(
    snapshotId: string,
    apiKey: string,
    timeoutMs?: number
  ): Promise<Sandbox> {
    console.log('[Snapshot] Restoring from snapshot (resume API):', snapshotId);

    try {
      // Resume the paused sandbox (E2B infrastructure restores from snapshot automatically)
      // API: POST /sandboxes/{sandboxID}/resume
      const response = await fetch(`${E2B_API_URL}/sandboxes/${snapshotId}/resume`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeout: timeoutMs ? Math.floor(timeoutMs / 1000) : 600, // Convert ms to seconds, default 10 min
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`E2B resume API failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      // Connect to the resumed sandbox
      const sandbox = await Sandbox.connect(data.sandboxID, {
        apiKey,
        ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
      });

      console.log('[Snapshot] Restored sandbox from snapshot:', snapshotId);
      return sandbox;
    } catch (error) {
      console.error('[Snapshot] Failed to restore from snapshot:', error);
      throw new Error(`Failed to restore from snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all snapshots for a project
   */
  static async getProjectSnapshots(projectId: string): Promise<SnapshotMetadata[]> {
    const db = await getDb();
    const { data, error } = await db
      .from('project_snapshots')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch snapshots: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get the latest snapshot for a project
   */
  static async getLatestSnapshot(projectId: string): Promise<SnapshotMetadata | null> {
    const db = await getDb();
    const { data, error } = await db
      .from('project_snapshots')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch latest snapshot: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a snapshot
   */
  static async deleteSnapshot(snapshotId: string): Promise<void> {
    console.log('[Snapshot] Deleting snapshot:', snapshotId);

    try {
      // Delete from E2B (if SDK supports it)
      // Note: Check E2B SDK docs for deletion API

      // Delete from database
      const db = await getDb();
      await db.from('project_snapshots').delete().eq('snapshot_id', snapshotId);

      console.log('[Snapshot] Deleted snapshot:', snapshotId);
    } catch (error) {
      console.error('[Snapshot] Failed to delete snapshot:', error);
      throw new Error(`Failed to delete snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up all old snapshots for a project (keep only latest)
   * Extracted as reusable helper for all snapshot creation paths
   */
  static async cleanupOldSnapshots(projectId: string): Promise<void> {
    console.log('[Snapshot] Cleaning up old snapshots for project:', projectId);
    const oldSnapshots = await this.getProjectSnapshots(projectId);

    for (const oldSnapshot of oldSnapshots) {
      try {
        await this.deleteSnapshot(oldSnapshot.snapshot_id);
        console.log('[Snapshot] Deleted old snapshot:', oldSnapshot.snapshot_id);
      } catch (error) {
        // Log but don't fail - old snapshot might already be gone
        console.warn('[Snapshot] Could not delete old snapshot:', oldSnapshot.snapshot_id, error);
      }
    }
  }

  /**
   * Track an existing snapshot in the database
   * Used when E2B creates a snapshot (auto-pause) and we need to record it
   * This does NOT create a new snapshot - it just tracks one that already exists
   */
  static async trackExistingSnapshot(
    projectId: string,
    snapshotId: string,
    description: string
  ): Promise<void> {
    console.log('[Snapshot] Tracking existing snapshot:', snapshotId, 'for project:', projectId);

    try {
      // Clean up old snapshots first (keep only latest)
      await this.cleanupOldSnapshots(projectId);

      // Track the new snapshot
      const db = await getDb();
      const query = db.from('project_snapshots') as ReturnType<typeof db.from>;
      const { error } = await query.insert({
        project_id: projectId,
        snapshot_id: snapshotId,
        description,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      console.log('[Snapshot] Tracked existing snapshot:', snapshotId);
    } catch (error) {
      console.error('[Snapshot] Failed to track existing snapshot:', error);
      throw new Error(`Failed to track snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Auto-save snapshot before sandbox shutdown
   * Call this before killing a sandbox to preserve user's work
   */
  static async autoSave(
    sandbox: Sandbox,
    projectId: string,
    apiKey: string
  ): Promise<string | null> {
    try {
      // Check if there are unsaved changes (if configured)
      if (SKIP_SNAPSHOT_IF_NO_CHANGES) {
        const hasChanges = await this.hasUnsavedChanges(sandbox);

        if (!hasChanges) {
          console.log('[Snapshot] No unsaved changes, skipping auto-save');
          return null;
        }
      }

      // Create auto-save snapshot (pause sandbox)
      const snapshotId = await this.createSnapshot(
        sandbox,
        projectId,
        'Auto-saved before shutdown',
        apiKey
      );

      return snapshotId;
    } catch (error) {
      console.error('[Snapshot] Auto-save failed:', error);
      // Don't throw - auto-save is best-effort
      return null;
    }
  }

  /**
   * Check if sandbox has unsaved changes
   * Compare current state with last snapshot or template
   */
  private static async hasUnsavedChanges(sandbox: Sandbox): Promise<boolean> {
    try {
      // Simple heuristic: check if git has uncommitted changes
      const result = await sandbox.commands.run('git status --porcelain');
      return result.stdout.trim().length > 0;
    } catch {
      // If git check fails, assume there are changes to be safe
      return true;
    }
  }
}
