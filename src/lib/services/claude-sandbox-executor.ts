/**
 * Claude Code CLI Sandbox Executor
 *
 * Runs Claude Code CLI directly inside E2B sandbox (following E2B best practices).
 * Based on: https://github.com/e2b-dev/code-interpreter examples
 *
 * Pattern:
 * 1. User sends message
 * 2. Execute `claude -p "user message"` inside sandbox
 * 3. Stream stdout/stderr/results back to client
 * 4. Claude Code CLI has full access to sandbox filesystem, tools, etc.
 */

import { Sandbox } from 'e2b';

// ProcessMessage type removed in E2B SDK v2
type ProcessMessage = { line: string; timestamp: string; error: boolean };

export interface ClaudeSandboxExecutorOptions {
  sandbox: Sandbox;
  workDir: string;
  apiKey: string; // ANTHROPIC_API_KEY for Claude Code CLI
  onStdout?: (message: ProcessMessage) => void;
  onStderr?: (message: ProcessMessage) => void;
  onExit?: (exitCode: number) => void;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  error?: string;
}

/**
 * Execute a user prompt using Claude Code CLI inside the sandbox
 *
 * Example from E2B docs:
 * ```
 * const result = await sbx.commands.run(
 *   `echo 'Create a hello world index.html' | claude -p --dangerously-skip-permissions`,
 *   { timeoutMs: 0 } // Claude Code can run for a long time
 * )
 * ```
 */
// executeClaudePrompt removed - incompatible with E2B SDK v2 API (onStdout/onStderr/onExit callbacks no longer supported)
// Replaced by PTY terminal implementation in terminal-pty.tsx

// Legacy functions removed - incompatible with E2B SDK v2 API:
// - executeClaudePromptStreaming
// - executeCodeWithStreaming
// - formatClaudeOutput
// All replaced by PTY terminal implementation in terminal-pty.tsx
