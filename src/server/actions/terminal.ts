/**
 * Terminal Server Actions
 *
 * Handles terminal session management for E2B sandboxes.
 * Provides actions for creating PTY sessions, sending input, and managing terminal state.
 */

'use server';

import { authActionClient } from '@/lib/clients/action';
import { getProject } from '@/lib/db/projects';
import { getActiveSandbox } from '@/lib/db/sandboxes';
import { E2BService } from '@/lib/services/e2b-service';
import { TeamApiKeyService } from '@/lib/services/team-api-key-service';
import { Sandbox } from 'e2b';
import { E2B_DOMAIN } from '@/configs/e2b';
import { z } from 'zod';
import { ActionError } from '@/lib/utils/action';

// Store active terminal sessions in memory
// Key: projectId, Value: { sandbox, ptyId, buffer }
const terminalSessions = new Map<
  string,
  {
    sandbox: Sandbox;
    shellProcess: { kill: () => Promise<boolean> }; // E2B Command process handle
    workDir: string;
  }
>();

const createTerminalSchema = z.object({
  projectId: z.string().uuid(),
  workDir: z.string().optional(),
  cols: z.number().default(80),
  rows: z.number().default(24),
});

/**
 * Create a new terminal session for a project
 */
export const createTerminalSession = authActionClient
  .schema(createTerminalSchema)
  .metadata({ actionName: 'createTerminalSession' })
  .action(async ({ parsedInput, ctx }) => {
    const { projectId, workDir = '/home/user', cols, rows } = parsedInput;
    const { supabase } = ctx;

    // Get project and verify access
    const project = await getProject(projectId);
    if (!project) {
      throw new ActionError('Project not found');
    }

    // Get active sandbox
    const sandboxSession = await getActiveSandbox(projectId);
    if (!sandboxSession?.e2b_session_id) {
      throw new ActionError('No active sandbox found for this project');
    }

    // Get team API key
    const teamApiKey = await TeamApiKeyService.getTeamApiKey(
      project.team_id,
      supabase
    );

    // Connect to sandbox
    const sandbox = await Sandbox.connect(sandboxSession.e2b_session_id, {
      apiKey: teamApiKey,
      ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
    });

    // Start a shell process in the sandbox
    // Using `script` command to get a PTY-like behavior
    const shellProcess = await sandbox.commands.run(
      `cd ${workDir} && exec bash`,
      {
        background: true,
        envs: {
          TERM: 'xterm-256color',
          COLUMNS: String(cols),
          LINES: String(rows),
        },
        onStdout: (data) => {
          // Output will be streamed via separate endpoint
          // E2B SDK v2: data is now a string, not an object with .line
          console.log('[Terminal]', data);
        },
        onStderr: (data) => {
          // E2B SDK v2: data is now a string, not an object with .line
          console.error('[Terminal Error]', data);
        },
      }
    );

    // Store session
    terminalSessions.set(projectId, {
      sandbox,
      shellProcess,
      workDir,
    });

    return {
      success: true,
      sessionId: projectId,
    };
  });

const sendTerminalInputSchema = z.object({
  projectId: z.string().uuid(),
  data: z.string(),
});

/**
 * Send input to terminal session
 */
export const sendTerminalInput = authActionClient
  .schema(sendTerminalInputSchema)
  .metadata({ actionName: 'sendTerminalInput' })
  .action(async ({ parsedInput }) => {
    const { projectId, data } = parsedInput;

    const session = terminalSessions.get(projectId);
    if (!session) {
      throw new ActionError('Terminal session not found');
    }

    // Send input to shell process via stdin
    // Note: E2B CommandHandle doesn't expose stdin directly
    // We'll need to run commands via sandbox.commands.run()
    // For now, execute as separate command
    await session.sandbox.commands.run(`cd ${session.workDir} && ${data}`, {
      background: true,
    });

    return { success: true };
  });

const resizeTerminalSchema = z.object({
  projectId: z.string().uuid(),
  cols: z.number(),
  rows: z.number(),
});

/**
 * Resize terminal session
 */
export const resizeTerminal = authActionClient
  .schema(resizeTerminalSchema)
  .metadata({ actionName: 'resizeTerminal' })
  .action(async ({ parsedInput }) => {
    const { projectId, cols, rows } = parsedInput;

    const session = terminalSessions.get(projectId);
    if (!session) {
      throw new ActionError('Terminal session not found');
    }

    // Send resize signal (via environment variables for next command)
    // E2B doesn't support direct PTY resize, so we'll update the env
    await session.sandbox.commands.run(
      `export COLUMNS=${cols} LINES=${rows}`,
      { background: true }
    );

    return { success: true };
  });

const closeTerminalSchema = z.object({
  projectId: z.string().uuid(),
});

/**
 * Close terminal session
 */
export const closeTerminal = authActionClient
  .schema(closeTerminalSchema)
  .metadata({ actionName: 'closeTerminal' })
  .action(async ({ parsedInput }) => {
    const { projectId } = parsedInput;

    const session = terminalSessions.get(projectId);
    if (session) {
      // Kill the shell process
      try {
        await session.shellProcess.kill();
      } catch (err) {
        // Already dead
      }
      terminalSessions.delete(projectId);
    }

    return { success: true };
  });

/**
 * Execute a command in the terminal (for automation)
 */
const executeTerminalCommandSchema = z.object({
  projectId: z.string().uuid(),
  command: z.string(),
});

export const executeTerminalCommand = authActionClient
  .schema(executeTerminalCommandSchema)
  .metadata({ actionName: 'executeTerminalCommand' })
  .action(async ({ parsedInput, ctx }) => {
    const { projectId, command } = parsedInput;
    const { supabase } = ctx;

    // Get project and verify access
    const project = await getProject(projectId);
    if (!project) {
      throw new ActionError('Project not found');
    }

    // Get active sandbox
    const sandboxSession = await getActiveSandbox(projectId);
    if (!sandboxSession?.e2b_session_id) {
      throw new ActionError('No active sandbox found for this project');
    }

    // Get team API key
    const teamApiKey = await TeamApiKeyService.getTeamApiKey(
      project.team_id,
      supabase
    );

    // Connect to sandbox
    const sandbox = await Sandbox.connect(sandboxSession.e2b_session_id, {
      apiKey: teamApiKey,
      ...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
    });

    // Get working directory
    const workDir = E2BService.getTemplateWorkDir(project.template);

    // Execute command
    const result = await sandbox.commands.run(`cd ${workDir} && ${command}`, {
      timeoutMs: 300000, // 5 min timeout
    });

    return {
      success: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    };
  });
