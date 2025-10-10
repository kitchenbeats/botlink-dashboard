import { Sandbox } from 'e2b';
import { createSandbox, updateSandbox, getActiveSandbox } from '../db/sandboxes';
import { getProject } from '../db/projects';
import { TeamApiKeyService } from './team-api-key-service';
import type { InsertSandboxSession } from '../types/database';

const E2B_DOMAIN = process.env.E2B_DOMAIN; // ledgai.com

export class E2BService {
  /**
   * Create or get active sandbox for a project
   */
  static async getOrCreateSandbox(projectId: string) {
    // Get the project to find the team_id and template
    const project = await getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Get the team's encrypted API key
    const teamApiKey = await TeamApiKeyService.getTeamApiKey(project.team_id);

    // Use project template directly (simple_site -> simple-html, nextjs -> nextjs)
    const template = project.template === 'nextjs' ? 'nextjs' : 'simple-html';

    // Check for existing active sandbox
    const activeSandbox = await getActiveSandbox(projectId);

    if (activeSandbox && activeSandbox.e2b_session_id) {
      try {
        // Try to connect to existing sandbox
        const sandbox = await Sandbox.connect(activeSandbox.e2b_session_id, {
          apiKey: teamApiKey,
          ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
        });

        return {
          sandbox,
          session: activeSandbox,
        };
      } catch (error) {
        console.error('[E2B] Failed to connect to existing sandbox:', error);
        // Mark as stopped and create new one
        await updateSandbox(activeSandbox.id, { status: 'stopped' });
      }
    }

    // Create new sandbox using project's template
    const sandbox = await Sandbox.create(template, {
      apiKey: teamApiKey,
      ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
      timeoutMs: 300000, // 5 minutes
    });

    // Save to database
    const sandboxData: InsertSandboxSession = {
      project_id: projectId,
      e2b_session_id: sandbox.sandboxId,
      template: template,
      status: 'ready',
      url: null,
      metadata: {},
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };

    const session = await createSandbox(sandboxData);

    return {
      sandbox,
      session,
    };
  }

  /**
   * Write files to sandbox
   */
  static async writeFiles(
    sandbox: Sandbox,
    files: Array<{ path: string; content: string }>
  ) {
    for (const file of files) {
      await sandbox.files.write(file.path, file.content);
    }
  }

  /**
   * Install dependencies
   */
  static async installDependencies(
    sandbox: Sandbox,
    packageManager: 'npm' | 'pnpm' | 'yarn' = 'npm'
  ) {
    const installCmd = packageManager === 'npm' ? 'npm install' : `${packageManager} install`;
    const result = await sandbox.commands.run(installCmd);
    return result;
  }

  /**
   * Start dev server
   */
  static async startDevServer(
    sandbox: Sandbox,
    command: string = 'npm run dev'
  ) {
    // Run in background returns CommandHandle
    const proc = await sandbox.commands.run(command, {
      background: true,
      stdin: false,
      envs: {
        PORT: '3000',
      },
    } as { background: true; stdin: boolean; envs: Record<string, string> });

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
  static async executeCommand(sandbox: Sandbox, command: string) {
    const result = await sandbox.commands.run(command);
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    };
  }

  /**
   * Stop sandbox
   */
  static async stopSandbox(sandbox: Sandbox, sessionId: string) {
    await sandbox.kill();
    await updateSandbox(sessionId, {
      status: 'stopped',
      stopped_at: new Date().toISOString()
    });
  }
}
