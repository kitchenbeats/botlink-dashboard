import { Sandbox } from 'e2b';
import { createSandbox, updateSandbox, getActiveSandbox } from '../db/sandboxes';
import { getProject } from '../db/projects';
import { TeamApiKeyService } from './team-api-key-service';
import type { InsertSandboxSession } from '../types/database';
import { getE2BTemplateId, getTemplateWorkDir as getTemplateWorkDirConfig } from '@/configs/templates';
import {
  E2B_DOMAIN,
  SANDBOX_TIMEOUT_MS,
  SANDBOX_EXPIRATION_HOURS,
  ENABLE_AUTO_RESTORE,
  getSandboxExpirationDate,
} from '@/configs/e2b';
import { createClient } from '@/lib/clients/supabase/server';
import type { Tables } from '@/types/database.types';

export class E2BService {
  /**
   * Create or get active sandbox for a project (authenticated user)
   * @param supabase Authenticated Supabase client (for team API key access)
   */
  static async getOrCreateSandbox(projectId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
    // Get the project to find the team_id and template
    const project = await getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Get the team's encrypted API key using authenticated client
    const teamApiKey = await TeamApiKeyService.getTeamApiKey(project.team_id, supabase);

    return this._createSandbox(projectId, project, teamApiKey);
  }

  /**
   * Create or get active sandbox for a project (service role for Inngest)
   * @param projectId Project ID
   */
  static async getOrCreateSandboxServiceRole(projectId: string) {
    // Get the project to find the team_id and template
    const project = await getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Get the team's encrypted API key using service role
    const teamApiKey = await TeamApiKeyService.getTeamApiKeyServiceRole(project.team_id);

    return this._createSandbox(projectId, project, teamApiKey);
  }

  /**
   * Get the working directory path for a template
   */
  static getTemplateWorkDir(template: string): string {
    return getTemplateWorkDirConfig(template);
  }

  /**
   * Internal method to create or connect to sandbox
   * ENSURES ONLY ONE SANDBOX PER PROJECT
   */
  private static async _createSandbox(projectId: string, project: Tables<'projects'>, teamApiKey: string) {

    // Map project template to E2B template ID using centralized config
    const template = getE2BTemplateId(project.template);

    // Check for existing active sandbox FIRST
    const activeSandbox = await getActiveSandbox(projectId);

    if (activeSandbox && activeSandbox.e2b_session_id) {
      try {
        // Try to connect to existing sandbox
        const sandbox = await Sandbox.connect(activeSandbox.e2b_session_id, {
          apiKey: teamApiKey,
          ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
        });

        console.log('[E2B] Reconnected to existing sandbox:', activeSandbox.e2b_session_id);

        // Clean up any OLD stopped sandboxes (but keep this active one!)
        const { getAllProjectSandboxes } = await import('../db/sandboxes');
        const allSandboxes = await getAllProjectSandboxes(projectId);

        for (const oldSandbox of allSandboxes) {
          // Skip the active one we just connected to
          if (oldSandbox.id === activeSandbox.id) continue;

          // Kill old stopped sandboxes
          if (oldSandbox.e2b_session_id) {
            try {
              const sb = await Sandbox.connect(oldSandbox.e2b_session_id, {
                apiKey: teamApiKey,
                ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
              });
              await sb.kill();
              console.log('[E2B] Cleaned up old sandbox:', oldSandbox.e2b_session_id);
            } catch (error) {
              // Already dead, ignore
            }
            await updateSandbox(oldSandbox.id, { status: 'stopped' });
          }
        }

        return {
          sandbox,
          session: activeSandbox,
        };
      } catch (error) {
        console.error('[E2B] Failed to connect to existing sandbox:', error);
        // Mark as removed - we'll create a new one below
        await updateSandbox(activeSandbox.id, { status: 'stopped' });
      }
    }

    // ALWAYS kill ALL old sandboxes before creating new one
    // This ensures cleanup even if validation failed or connection was lost
    const { getAllProjectSandboxes } = await import('../db/sandboxes');
    const allOldSandboxes = await getAllProjectSandboxes(projectId);

    // Check for existing snapshots to avoid trying to kill paused sandboxes
    const { SnapshotService } = await import('./snapshot-service');
    const existingSnapshots = await SnapshotService.getProjectSnapshots(projectId);
    const snapshotIds = new Set(existingSnapshots.map(s => s.snapshot_id));

    console.log(`[E2B] Killing ${allOldSandboxes.length} old sandbox(es) before creating new one`);
    for (const oldSandbox of allOldSandboxes) {
      if (oldSandbox.e2b_session_id) {
        // Skip if this sandbox has been converted to a snapshot
        if (snapshotIds.has(oldSandbox.e2b_session_id)) {
          console.log('[E2B] Skipping sandbox (already a snapshot):', oldSandbox.e2b_session_id);
          await updateSandbox(oldSandbox.id, { status: 'stopped' });
          continue;
        }

        try {
          const sb = await Sandbox.connect(oldSandbox.e2b_session_id, {
            apiKey: teamApiKey,
            ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
          });
          await sb.kill();
          console.log('[E2B] Killed old sandbox:', oldSandbox.e2b_session_id);
        } catch (error) {
          // Already dead or can't connect, ignore
          console.log('[E2B] Could not kill sandbox (may already be dead):', oldSandbox.e2b_session_id, error);
        }
        // Always update database status to stopped
        await updateSandbox(oldSandbox.id, { status: 'stopped' });
      }
    }

    // Create new sandbox using project's template with 10-min auto-stop timeout
    console.log('[E2B] Creating new sandbox for project:', projectId);
    const sandbox = await Sandbox.create(template, {
      apiKey: teamApiKey,
      ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
      timeoutMs: SANDBOX_TIMEOUT_MS, // 10 minutes - will be extended on activity
      allowInternetAccess: true, // Required for claude login browser auth & npm installs
    });

    // Get template working directory
    const workDir = getTemplateWorkDirConfig(project.template);

    // TODO: GitHub integration feature - requires database schema changes
    // Add github_repo_url and last_commit_hash columns to projects table
    // Then uncomment this code:
    //
    // if (project.github_repo_url && project.last_commit_hash) {
    //   console.log('[E2B] Restoring from GitHub:', project.github_repo_url);
    //   console.log('[E2B] Checking out commit:', project.last_commit_hash);
    //
    //   const { GitService } = await import('./git-service');
    //
    //   // Clone the GitHub repo into the working directory
    //   const cloneResult = await GitService.cloneFromGitHub(sandbox, workDir, projectId);
    //
    //   if (cloneResult.success) {
    //     // Checkout the specific commit hash
    //     await sandbox.commands.run(`cd ${workDir} && git checkout ${project.last_commit_hash}`);
    //     console.log('[E2B] Restored project from GitHub at commit:', project.last_commit_hash);
    //   } else {
    //     console.warn('[E2B] Failed to clone from GitHub, using template defaults:', cloneResult.error);
    //     // Continue with template files as fallback
    //   }
    // } else {
    //   console.log('[E2B] No GitHub repo yet, using template files');
    //   // Template files are already in the sandbox from the Docker image
    // }

    console.log('[E2B] Using template files from Docker image');

    // Save to database
    const sandboxData: InsertSandboxSession = {
      project_id: projectId,
      e2b_session_id: sandbox.sandboxId,
      template: template,
      status: 'ready',
      url: null,
      metadata: {} as never, // Cast to satisfy Supabase Json type
      expires_at: getSandboxExpirationDate(),
    };

    const session = await createSandbox(sandboxData as never);

    console.log('[E2B] Created new sandbox:', sandbox.sandboxId);
    return {
      sandbox,
      session,
    };
  }

  /**
   * Write files to sandbox (relative to template directory)
   */
  static async writeFiles(
    sandbox: Sandbox,
    files: Array<{ path: string; content: string }>,
    workDir?: string
  ) {
    for (const file of files) {
      const filePath = workDir ? `${workDir}/${file.path}` : file.path;
      await sandbox.files.write(filePath, file.content);
    }
  }

  /**
   * Read file from sandbox (relative to template directory)
   */
  static async readFile(
    sandbox: Sandbox,
    path: string,
    workDir?: string
  ): Promise<string> {
    const filePath = workDir ? `${workDir}/${path}` : path;
    return await sandbox.files.read(filePath);
  }

  /**
   * List files in sandbox directory
   */
  static async listFiles(
    sandbox: Sandbox,
    dir: string = '.'
  ): Promise<string[]> {
    const result = await sandbox.commands.run(`find ${dir} -type f`);
    return result.stdout.split('\n').filter(f => f.trim());
  }

  /**
   * Install dependencies
   */
  static async installDependencies(
    sandbox: Sandbox,
    packageManager: 'npm' | 'pnpm' | 'yarn' = 'npm',
    workDir?: string
  ) {
    const installCmd = packageManager === 'npm' ? 'npm install' : `${packageManager} install`;
    const cmd = workDir ? `cd ${workDir} && ${installCmd}` : installCmd;
    const result = await sandbox.commands.run(cmd);
    return result;
  }

  /**
   * Start dev server
   */
  static async startDevServer(
    sandbox: Sandbox,
    command: string = 'npm run dev',
    workDir?: string
  ) {
    // Run in background returns CommandHandle
    const cmd = workDir ? `cd ${workDir} && ${command}` : command;
    const proc = await sandbox.commands.run(cmd, {
      background: true,
      envs: {
        PORT: '3000',
      },
    });

    return proc;
  }

  /**
   * Get sandbox URL
   */
  static async getSandboxUrl(sandbox: Sandbox, port: number = 3000) {
    const url = await sandbox.getHost(port);
    return `https://${url}`;
  }

  /**
   * Execute command in sandbox
   */
  static async executeCommand(
    sandbox: Sandbox,
    command: string,
    workDir?: string
  ) {
    const cmd = workDir ? `cd ${workDir} && ${command}` : command;
    const result = await sandbox.commands.run(cmd);
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    };
  }

  /**
   * Stop sandbox (kills/removes the VM)
   */
  static async stopSandbox(sandbox: Sandbox, sessionId: string) {
    await sandbox.kill();
    await updateSandbox(sessionId, {
      status: 'stopped',
      stopped_at: new Date().toISOString()
    });
  }

  /**
   * Extend sandbox timeout (resets the 10-min countdown)
   * Call this on any user activity to keep sandbox alive
   */
  static async extendSandboxTimeout(sandboxId: string, teamApiKey: string) {
    try {
      await Sandbox.setTimeout(sandboxId, SANDBOX_TIMEOUT_MS, {
        apiKey: teamApiKey,
        ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
      });
      console.log('[E2B] Extended sandbox timeout:', sandboxId);
    } catch (error) {
      console.error('[E2B] Failed to extend sandbox timeout:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Connect to an existing sandbox by session ID
   */
  static async connectToSandbox(sessionId: string, teamApiKey: string): Promise<Sandbox> {
    return await Sandbox.connect(sessionId, {
      apiKey: teamApiKey,
      ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
    });
  }

  /**
   * Kill a sandbox and update database
   */
  static async killSandbox(dbSessionId: string, sandbox: Sandbox) {
    await sandbox.kill();
    await updateSandbox(dbSessionId, {
      status: 'stopped',
      stopped_at: new Date().toISOString()
    });
  }

  /**
   * Create or restore sandbox from snapshot (snapshot-aware version)
   * Checks for latest snapshot first, falls back to template if no snapshot exists
   */
  static async getOrCreateSandboxWithSnapshot(projectId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
    const { SnapshotService } = await import('./snapshot-service');

    // Get the project
    const project = await getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Get team API key
    const teamApiKey = await TeamApiKeyService.getTeamApiKey(project.team_id, supabase);

    // Check for existing active sandbox FIRST
    const activeSandbox = await getActiveSandbox(projectId);

    if (activeSandbox && activeSandbox.e2b_session_id) {
      try {
        // Try to connect to existing sandbox
        const sandbox = await Sandbox.connect(activeSandbox.e2b_session_id, {
          apiKey: teamApiKey,
          ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
        });

        console.log('[E2B] Reconnected to existing sandbox:', activeSandbox.e2b_session_id);
        return {
          sandbox,
          session: activeSandbox,
          restoredFromSnapshot: false,
        };
      } catch (error) {
        console.error('[E2B] Failed to connect to existing sandbox:', error);
        // Mark as removed - we'll create a new one below
        await updateSandbox(activeSandbox.id, { status: 'stopped' });
      }
    }

    // Check for latest snapshot
    const latestSnapshot = await SnapshotService.getLatestSnapshot(projectId);

    if (latestSnapshot) {
      console.log('[E2B] Restoring from snapshot:', latestSnapshot.snapshot_id);
      try {
        // Restore from snapshot using E2B resume API
        const sandbox = await SnapshotService.restoreFromSnapshot(
          latestSnapshot.snapshot_id,
          teamApiKey,
          SANDBOX_TIMEOUT_MS
        );

        // Save to database
        const sandboxData: InsertSandboxSession = {
          project_id: projectId,
          e2b_session_id: sandbox.sandboxId,
          template: getE2BTemplateId(project.template),
          status: 'ready',
          url: null,
          metadata: { restored_from_snapshot: latestSnapshot.snapshot_id } as never,
          expires_at: getSandboxExpirationDate(),
        };

        const session = await createSandbox(sandboxData as never);

        console.log('[E2B] Restored sandbox from snapshot:', latestSnapshot.snapshot_id);
        return {
          sandbox,
          session,
          restoredFromSnapshot: true,
        };
      } catch (error) {
        console.error('[E2B] Failed to restore from snapshot, falling back to template:', error);
        // Fall through to template creation
      }
    }

    // No snapshot or restore failed - use regular creation
    console.log('[E2B] No snapshot available, creating from template');
    const result = await this._createSandbox(projectId, project, teamApiKey);
    return {
      ...result,
      restoredFromSnapshot: false,
    };
  }
}
