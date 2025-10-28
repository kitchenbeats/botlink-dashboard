import { Sandbox } from 'e2b';
import { createSandbox as createSandboxDB, updateSandbox, getActiveSandbox } from '../db/sandboxes';
import { getProject } from '../db/projects';
import { TeamApiKeyService } from './team-api-key-service';
import type { InsertSandboxSession } from '../types/database';
import { getE2BTemplateId, getTemplateWorkDir as getTemplateWorkDirConfig } from '@/configs/templates';
import {
  E2B_DOMAIN,
  E2B_API_URL,
  SANDBOX_TIMEOUT_MS,
  getSandboxExpirationDate,
} from '@/configs/e2b';
import { createClient } from '@/lib/clients/supabase/server';

export class E2BService {
  /**
   * Get the working directory path for a template
   */
  static getTemplateWorkDir(template: string): string {
    return getTemplateWorkDirConfig(template);
  }

  /**
   * Get or create sandbox - simplified helper that checks DB, resumes if exists, creates if not
   * This replaces the old getOrCreateSandboxWithSnapshot pattern
   */
  static async getOrCreate(projectId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
    const { getActiveSandbox } = await import('@/lib/db/sandboxes');
    const existingSandbox = await getActiveSandbox(projectId);

    let result;
    if (existingSandbox) {
      result = await this.resumeSandbox(projectId, supabase);
      if (!result) {
        result = await this.createSandbox(projectId, supabase);
      }
    } else {
      result = await this.createSandbox(projectId, supabase);
    }

    return result;
  }

  /**
   * Create a NEW sandbox for a project
   * Templates come with dev servers already running (via -c flag in template build)
   */
  static async createSandbox(projectId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
    const project = await getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const teamApiKey = await TeamApiKeyService.getTeamApiKey(project.team_id, supabase);
    const template = getE2BTemplateId(project.template);

    console.log('[E2B] Creating new sandbox for project:', projectId);

    // Create new sandbox with 10-min auto-pause timeout
    // Include team_id in metadata so sandboxes are associated with teams in E2B infrastructure
    const sandbox = await Sandbox.create(template, {
      apiKey: teamApiKey,
      ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
      timeoutMs: SANDBOX_TIMEOUT_MS,
      allowInternetAccess: true,
      metadata: {
        team_id: project.team_id,
        project_id: projectId,
        template: project.template,
      },
    });

    // Save to database
    const sandboxData: InsertSandboxSession = {
      project_id: projectId,
      e2b_session_id: sandbox.sandboxId,
      template: template,
      status: 'ready',
      url: null,
      metadata: {} as never,
      expires_at: getSandboxExpirationDate(),
    };

    const session = await createSandboxDB(sandboxData as never);

    console.log('[E2B] Created new sandbox:', sandbox.sandboxId);

    return {
      sandbox,
      session,
    };
  }

  /**
   * Resume a paused sandbox
   * Returns null if sandbox doesn't exist or can't be resumed
   */
  static async resumeSandbox(projectId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
    const project = await getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const teamApiKey = await TeamApiKeyService.getTeamApiKey(project.team_id, supabase);
    const existingSandbox = await getActiveSandbox(projectId);

    if (!existingSandbox?.e2b_session_id) {
      console.log('[E2B] No existing sandbox to resume');
      return null;
    }

    console.log('[E2B] Attempting to resume sandbox:', existingSandbox.e2b_session_id);

    try {
      // Try to resume the auto-paused sandbox
      const response = await fetch(
        `${E2B_API_URL}/sandboxes/${existingSandbox.e2b_session_id}/resume`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': teamApiKey,
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        console.log('[E2B] Resume failed (sandbox expired or not found)');
        await updateSandbox(existingSandbox.id, { status: 'stopped' });
        return null;
      }

      console.log('[E2B] ✅ Successfully resumed sandbox');

      // Reconnect to the resumed sandbox
      const sandbox = await Sandbox.connect(existingSandbox.e2b_session_id, {
        apiKey: teamApiKey,
        ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
      });

      return {
        sandbox,
        session: existingSandbox,
      };
    } catch (error) {
      console.error('[E2B] Error resuming sandbox:', error);
      await updateSandbox(existingSandbox.id, { status: 'stopped' });
      return null;
    }
  }

  /**
   * Get active sandbox (connect to existing running sandbox)
   * Returns null if no active sandbox exists
   */
  static async getSandbox(projectId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
    const project = await getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const teamApiKey = await TeamApiKeyService.getTeamApiKey(project.team_id, supabase);
    const activeSandbox = await getActiveSandbox(projectId);

    if (!activeSandbox?.e2b_session_id) {
      return null;
    }

    try {
      const sandbox = await Sandbox.connect(activeSandbox.e2b_session_id, {
        apiKey: teamApiKey,
        ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
      });

      console.log('[E2B] Connected to existing sandbox:', activeSandbox.e2b_session_id);

      return {
        sandbox,
        session: activeSandbox,
      };
    } catch (error) {
      console.error('[E2B] Failed to connect to sandbox:', error);
      await updateSandbox(activeSandbox.id, { status: 'stopped' });
      return null;
    }
  }

  /**
   * Delete/kill a sandbox
   */
  static async deleteSandbox(sandboxId: string, dbSessionId: string, teamApiKey: string) {
    try {
      const sandbox = await Sandbox.connect(sandboxId, {
        apiKey: teamApiKey,
        ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
      });

      await sandbox.kill();
      await updateSandbox(dbSessionId, {
        status: 'stopped',
        stopped_at: new Date().toISOString()
      });

      console.log('[E2B] Deleted sandbox:', sandboxId);
    } catch (error) {
      console.error('[E2B] Error deleting sandbox:', error);
      // Still mark as stopped in DB even if kill fails
      await updateSandbox(dbSessionId, {
        status: 'stopped',
        stopped_at: new Date().toISOString()
      });
    }
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
   * Get sandbox preview URL
   */
  static getPreviewUrl(sandbox: Sandbox, port: number = 3000): string {
    const hostname = sandbox.getHost(port);
    return `https://${hostname}`;
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
}
