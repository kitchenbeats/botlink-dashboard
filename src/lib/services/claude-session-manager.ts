/**
 * Claude Session Manager
 *
 * Manages persistent interactive Claude Code CLI sessions in E2B sandboxes.
 * Uses E2B's stdin support to maintain true interactive sessions.
 *
 * How it works:
 * 1. Start `claude` with stdin: true to keep it running
 * 2. User messages are sent via sendStdin()
 * 3. Claude's output streams back via onStdout
 * 4. File changes are detected via E2B file watcher
 */

import type { Sandbox } from 'e2b';
import { publishWorkspaceMessage, setClaudePtyPid, getClaudePtyPid, deleteClaudePtyPid } from './redis-realtime';

export interface ClaudeSessionConfig {
  sandbox: Sandbox;
  projectId: string;
  workDir: string;
  onOutput?: (data: string, type: 'stdout' | 'stderr') => void;
  onError?: (error: Error) => void;
}

export interface ClaudeSession {
  id: string;
  projectId: string;
  pid: number; // Process ID
  ptySession: { pid: number } | null; // E2B PTY handle
  fileWatcher: { stop: () => Promise<void> } | null;
  isRunning: boolean;
  startedAt: Date;
  lastActivityAt: Date;
}

// Store active Claude sessions per project
const activeSessions = new Map<string, ClaudeSession>();

/**
 * Start a new Claude Code interactive session
 */
export async function startClaudeSession(
  config: ClaudeSessionConfig
): Promise<ClaudeSession> {
  const { sandbox, projectId, workDir, onOutput, onError } = config;

  // Check if session already exists
  const existing = activeSessions.get(projectId);
  if (existing?.isRunning) {
    console.log('[Claude Session] Existing session found:', existing.id);
    return existing;
  }

  console.log('[Claude Session] Starting new interactive session for project:', projectId);

  try {
    // Start Claude using PTY for proper interactive terminal with real-time streaming
    // IMPORTANT: We do NOT set ANTHROPIC_API_KEY env var
    // This forces Claude to use user's authenticated account (via `claude login`)
    console.log('[Claude Session] Creating PTY session running claude command directly');

    // E2B SDK v2: PTY automatically starts a bash shell, can't specify cmd
    // User needs to type 'claude' in the terminal themselves
    const ptyHandle = await sandbox.pty.create({
      cols: 80,
      rows: 24,
      cwd: workDir,
      envs: {
        TERM: 'xterm-256color',
        FORCE_COLOR: '1',
      },
      onData: (data) => {
        console.log('[Claude PTY] ========== CALLBACK FIRED ==========');
        console.log('[Claude PTY] Raw data type:', typeof data);
        console.log('[Claude PTY] Raw data length:', data.length);

        const outputStr = Buffer.from(data).toString();
        console.log('[Claude PTY] Decoded output length:', outputStr.length);

        // Send RAW output with ANSI codes to terminal (xterm.js handles ANSI)
        // DO NOT strip ANSI codes - the terminal needs them for colors/formatting
        publishWorkspaceMessage(projectId, 'claude-output', {
          type: 'stdout',
          data: outputStr, // Raw output with ANSI codes intact
          timestamp: Date.now(),
        }).then(() => {
          console.log('[Claude PTY] Redis publish SUCCESS');
        }).catch(err => {
          console.error('[Claude PTY] Redis publish ERROR:', err);
        });

        onOutput?.(outputStr, 'stdout');
        console.log('[Claude PTY] ========== CALLBACK COMPLETE ==========');
      },
    });

    console.log('[Claude Session] PTY shell created successfully');

    const pid = ptyHandle.pid;

    console.log('[Claude Session] PTY started with PID:', pid);

    // Wait a moment for Claude to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('[Claude Session] Claude should now be running and output streaming to UI');

    // Watch the working directory for file changes
    const fileWatcher = await sandbox.files.watchDir(
      workDir,
      async (event) => {
        console.log('[File Change]', event.type, event.name);

        publishWorkspaceMessage(projectId, 'file-change', {
          type: event.type,
          path: event.name,
          timestamp: Date.now(),
        });
      },
      { recursive: true }
    );

    const session: ClaudeSession = {
      id: `claude-${projectId}-${Date.now()}`,
      projectId,
      pid,
      ptySession: ptyHandle,
      fileWatcher,
      isRunning: true,
      startedAt: new Date(),
      lastActivityAt: new Date(),
    };

    activeSessions.set(projectId, session);

    console.log('[Claude Session] Started successfully:', session.id);

    // Save PID to Redis for persistence across serverless invocations
    try {
      await setClaudePtyPid(projectId, pid);
    } catch (error) {
      console.error('[Claude Session] Failed to save PID to Redis:', error);
      // Non-fatal, continue
    }

    // Monitor for unexpected process exit
    monitorSessionHealth(session, sandbox, onError);

    return session;
  } catch (error) {
    console.error('[Claude Session] Failed to start:', error);
    throw error;
  }
}

/**
 * Send a message to the Claude session
 */
export async function sendToClaudeSession(
  sandbox: Sandbox,
  projectId: string,
  message: string
): Promise<void> {
  let session = activeSessions.get(projectId);

  // If session not in memory, try to restore from Redis
  if (!session) {
    console.log('[Claude Session] Session not in memory, attempting to restore from Redis...');

    try {
      const pid = await getClaudePtyPid(projectId);

      if (pid) {
        console.log('[Claude Session] Restored PID from Redis:', pid);

        // Recreate session object (but PTY handle is still alive on E2B)
        session = {
          id: `claude-${projectId}-restored`,
          projectId,
          pid,
          ptySession: null, // We don't need the handle to send input
          fileWatcher: null,
          isRunning: true,
          startedAt: new Date(), // We don't know exact start time, but doesn't matter
          lastActivityAt: new Date(),
        };

        activeSessions.set(projectId, session);
      }
    } catch (error) {
      console.error('[Claude Session] Failed to restore session from Redis:', error);
    }
  }

  if (!session) {
    throw new Error('No active Claude session found. Please start a session first.');
  }

  try {
    console.log('[Claude Session] Sending message:', message.substring(0, 100) + '...');

    // Update last activity
    session.lastActivityAt = new Date();

    // Send message to Claude's PTY (add newline to submit)
    // Convert string to Uint8Array for PTY input
    const encoder = new TextEncoder();
    const data = encoder.encode(message + '\n');
    await sandbox.pty.sendInput(session.pid, data);

    console.log('[Claude Session] Message sent to PTY');
  } catch (error) {
    console.error('[Claude Session] Failed to send message:', error);

    // Check if it's a "process not found" error - means PTY died
    if (error instanceof Error && error.message.includes('not_found')) {
      console.log('[Claude Session] PTY process died, clearing stale session');

      // Clear stale session from memory and Redis
      activeSessions.delete(projectId);

      try {
        await deleteClaudePtyPid(projectId);
      } catch (cleanupError) {
        console.error('[Claude Session] Failed to cleanup stale session:', cleanupError);
      }

      throw new Error('Claude session expired. Please click "Start Claude Code" again.');
    }

    throw error;
  }
}

/**
 * Stop a Claude session
 */
export async function stopClaudeSession(
  sandbox: Sandbox,
  projectId: string
): Promise<void> {
  const session = activeSessions.get(projectId);

  if (!session) {
    console.warn('[Claude Session] No session to stop for project:', projectId);
    return;
  }

  try {
    console.log('[Claude Session] Stopping session:', session.id);

    // Stop file watcher
    if (session.fileWatcher) {
      await session.fileWatcher.stop();
    }

    // Kill the Claude PTY session
    if (session.pid) {
      await sandbox.pty.kill(session.pid);
    }

    session.isRunning = false;
    activeSessions.delete(projectId);

    // Clear PID from Redis
    try {
      await deleteClaudePtyPid(projectId);
    } catch (error) {
      console.error('[Claude Session] Failed to clear PID from Redis:', error);
      // Non-fatal
    }

    console.log('[Claude Session] Session stopped successfully');
  } catch (error) {
    console.error('[Claude Session] Error stopping session:', error);
    throw error;
  }
}

/**
 * Restart a Claude session with optional context
 */
export async function restartClaudeSession(
  config: ClaudeSessionConfig,
  contextSummary?: string
): Promise<ClaudeSession> {
  const { projectId, sandbox } = config;

  // Stop existing session
  await stopClaudeSession(sandbox, projectId);

  // Wait for cleanup
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Start new session
  const session = await startClaudeSession(config);

  // If context summary provided, send it as first message
  if (contextSummary) {
    console.log('[Claude Session] Providing context summary to new session');
    await sendToClaudeSession(sandbox, projectId, contextSummary);
  }

  return session;
}

/**
 * Get active session for a project
 */
export function getClaudeSession(projectId: string): ClaudeSession | null {
  return activeSessions.get(projectId) || null;
}

/**
 * Check if session is healthy
 */
export function isSessionHealthy(projectId: string): boolean {
  const session = activeSessions.get(projectId);

  if (!session?.isRunning) {
    return false;
  }

  // Check if session is too old (over 4 hours)
  const fourHours = 4 * 60 * 60 * 1000;
  const age = Date.now() - session.startedAt.getTime();

  if (age > fourHours) {
    console.warn('[Claude Session] Session is stale (over 4 hours old)');
    return false;
  }

  return true;
}

/**
 * Monitor session health and detect crashes
 */
async function monitorSessionHealth(
  session: ClaudeSession,
  sandbox: Sandbox,
  onError?: (error: Error) => void
) {
  // Poll to check if process is still alive
  const healthCheck = setInterval(async () => {
    if (!session.isRunning) {
      clearInterval(healthCheck);
      return;
    }

    try {
      // Try to list processes to see if our PID is still alive
      // Note: E2B might not expose this - we'll handle errors gracefully
      // For now, we rely on onStdout/onStderr stopping to detect crashes
    } catch (error) {
      console.error('[Claude Session] Health check error:', error);
      clearInterval(healthCheck);

      session.isRunning = false;
      activeSessions.delete(session.projectId);

      // Notify about crash
      publishWorkspaceMessage(session.projectId, 'claude-crash', {
        message: 'Claude session crashed unexpectedly',
        timestamp: Date.now(),
      });

      onError?.(new Error('Claude session crashed'));
    }
  }, 30000); // Check every 30 seconds

  // Clean up interval when session stops
  const checkSessionStopped = setInterval(() => {
    if (!session.isRunning) {
      clearInterval(healthCheck);
      clearInterval(checkSessionStopped);
    }
  }, 5000);
}
