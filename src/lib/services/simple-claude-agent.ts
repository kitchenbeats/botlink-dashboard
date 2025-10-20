/**
 * SIMPLE AGENT - Claude Code CLI in E2B Sandbox
 *
 * Executes Claude Code CLI in the sandbox using the user's authenticated Claude.ai account.
 * Users must first run `claude login` in the terminal to authenticate.
 * This allows them to use their $20/month Claude subscription instead of expensive API tokens.
 *
 * Key Features:
 * - Uses Claude Code's built-in conversation management
 * - Supports interactive authentication via browser
 * - Much more cost-effective than direct API usage
 * - Provides the same experience as using Claude Code locally
 */

import type { Sandbox } from 'e2b';
import { publishWorkspaceMessage } from './redis-realtime';

// ProcessMessage type removed in E2B SDK v2
type ProcessMessage = { line: string; timestamp: string; error: boolean };

export interface SimpleAgentConfig {
  sandbox: Sandbox;
  projectId: string;
  workDir: string;
}

export interface SimpleAgentResult {
  success: boolean;
  content: string;
  error?: string;
}

/**
 * Check if Claude Code is authenticated in the sandbox
 */
export async function checkClaudeAuth(
  sandbox: Sandbox,
  workDir: string
): Promise<boolean> {
  try {
    // Check if Claude Code auth config exists
    const authCheck = await sandbox.commands.run(
      `cd ${workDir} && claude --version`,
      { timeoutMs: 5000 }
    );

    return authCheck.exitCode === 0;
  } catch (error) {
    return false;
  }
}

/**
 * Run Claude Code CLI directly in the E2B sandbox
 * Streams output via Redis for real-time UI updates
 *
 * IMPORTANT: User must be authenticated via `claude login` first
 */
export async function runSimpleClaudeAgent(
  userMessage: string,
  config: SimpleAgentConfig
): Promise<SimpleAgentResult> {
  const { sandbox, projectId, workDir } = config;

  let stdout = '';
  let stderr = '';

  try {
    // Check if Claude is authenticated
    const isAuthenticated = await checkClaudeAuth(sandbox, workDir);
    if (!isAuthenticated) {
      await publishWorkspaceMessage(projectId, 'status', {
        status: 'error',
        message: 'Claude Code is not authenticated. Please run "claude login" in the terminal first.',
        timestamp: Date.now(),
      });

      return {
        success: false,
        content: '',
        error: 'Not authenticated. Run "claude login" in terminal to authenticate with your Claude.ai account.',
      };
    }

    // Publish initial status
    await publishWorkspaceMessage(projectId, 'status', {
      status: 'thinking',
      message: 'Claude is processing your request...',
      timestamp: Date.now(),
    });

    // Create a temporary file with the user's message
    // This allows us to pass multi-line messages and special characters safely
    const msgFile = `/tmp/claude-msg-${Date.now()}.txt`;
    await sandbox.files.write(msgFile, userMessage);

    // Run Claude Code CLI in the sandbox
    // - Use `claude -p` for direct prompt mode
    // - Pass message via file to avoid shell escaping issues
    // - Run from workDir so Claude has context of the project
    // - Use timeoutMs: 0 since Claude Code can run indefinitely
    // - User is already authenticated via `claude login`, so no API key needed
    const command = `cd ${workDir} && cat ${msgFile} | claude -p`;

    console.log('[Simple Claude Agent] Executing:', command);

    // E2B SDK v2: commands.run() no longer supports streaming callbacks
    // Output is returned in the result object
    const result = await sandbox.commands.run(command, {
      timeoutMs: 0, // No timeout - Claude Code can run for a long time
      envs: {
        PWD: workDir,
        // No ANTHROPIC_API_KEY - uses user's authenticated session
      },
    });

    // Get output from result
    stdout = result.stdout;
    stderr = result.stderr;

    // Publish final output
    if (stdout.trim()) {
      await publishWorkspaceMessage(projectId, 'status', {
        status: 'working',
        message: stdout.trim(),
        timestamp: Date.now(),
      });
    }
    if (stderr.trim()) {
      console.error('[Claude stderr]:', stderr);
      await publishWorkspaceMessage(projectId, 'status', {
        status: 'error',
        message: stderr.trim(),
        timestamp: Date.now(),
      });
    }

    // Publish completion status
    await publishWorkspaceMessage(projectId, 'status', {
      status: 'completed',
      message: 'Task completed',
      timestamp: Date.now(),
    });

    return {
      success: result.exitCode === 0,
      content: stdout || stderr || 'Task completed',
      error: result.exitCode !== 0 ? stderr : undefined,
    };
  } catch (error) {
    console.error('[Simple Claude Agent] Error:', error);

    // Publish error status
    await publishWorkspaceMessage(projectId, 'status', {
      status: 'error',
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: Date.now(),
    });

    return {
      success: false,
      content: stdout || 'An error occurred',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Stream file changes from E2B sandbox
 * E2B SDK v2: Use PTY to run inotifywait and stream output
 */
export async function watchSandboxFiles(
  sandbox: Sandbox,
  projectId: string,
  workDir: string
) {
  try {
    console.log('[File Watcher] Starting file watch for:', workDir);

    // Create PTY running inotifywait to watch for file changes
    const ptyHandle = await sandbox.pty.create({
      cols: 80,
      rows: 24,
      cwd: workDir,
      onData: async (data) => {
        // Parse inotify output: "EVENT /path/to/file"
        const output = new TextDecoder().decode(data);
        const lines = output.split('\n').filter(l => l.trim());

        for (const line of lines) {
          const parts = line.trim().split(' ');
          const event = parts[0];
          const filePath = parts.slice(1).join(' ');

          if (!event || !filePath) continue;

          // Determine action type
          let action: 'created' | 'updated' | 'deleted' = 'updated';
          if (event.includes('CREATE')) action = 'created';
          else if (event.includes('DELETE')) action = 'deleted';
          else if (event.includes('MODIFY')) action = 'updated';

          // Get relative path from workDir
          const relativePath = filePath.replace(workDir + '/', '');

          console.log('[File Watcher]', action, relativePath);

          // Publish file change event
          await publishWorkspaceMessage(projectId, 'file-changes', {
            path: relativePath,
            action,
            timestamp: Date.now(),
          });
        }
      },
    });

    // Send the inotifywait command via PTY
    const watchCommand = `inotifywait -m -r -e modify,create,delete,move --format '%e %w%f' ${workDir}\n`;
    await sandbox.pty.sendInput(ptyHandle.pid, new TextEncoder().encode(watchCommand));

    console.log('[File Watcher] Started watching:', workDir);

    return ptyHandle;
  } catch (error) {
    console.error('[File Watcher] Failed to start:', error);
    // Don't throw - file watching is optional
    return null;
  }
}
