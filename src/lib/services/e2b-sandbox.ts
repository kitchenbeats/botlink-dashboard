/**
 * E2B Sandbox Service
 * Provides secure code execution in isolated sandboxes using self-hosted E2B infrastructure
 */

import { Sandbox } from 'e2b';
import { getE2BApiKey, getE2BDomain } from '@/lib/config/env';
import type { File, ProjectType } from '@/lib/types';

export interface SandboxExecutionResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
  exitCode?: number;
  url?: string;
}

export interface SandboxOptions {
  /** Timeout in milliseconds (default: 300000 - 5 minutes) */
  timeout?: number;
}

/**
 * Create a new E2B sandbox instance
 */
export async function createSandbox(options: SandboxOptions = {}): Promise<Sandbox> {
  const apiKey = getE2BApiKey();
  const domain = getE2BDomain();

  const sandbox = await Sandbox.create({
    apiKey,
    domain,
    timeoutMs: options.timeout,
  });

  return sandbox;
}

/**
 * Execute code files in a sandbox
 */
export async function executeInSandbox(
  files: Array<{ path: string; content: string }>,
  entrypoint: string,
  projectType: ProjectType,
  options: SandboxOptions = {}
): Promise<SandboxExecutionResult> {
  let sandbox: Sandbox | null = null;

  try {
    // Create sandbox
    sandbox = await createSandbox(options);

    // Write files to sandbox with path validation
    for (const file of files) {
      const safePath = sanitizePath(file.path);
      if (!safePath) {
        throw new Error(`Invalid file path: ${file.path}`);
      }
      await sandbox.files.write(safePath, file.content);
    }

    // Determine execution command based on file extension
    const command = getExecutionCommand(entrypoint, projectType);

    console.log('[E2B] Executing command:', command);

    // Execute the code and wait for completion
    const result = await sandbox.commands.run(command, {
      stdin: false,
      timeoutMs: options.timeout || 300000, // 5 minute default
      onStdout: (data) => console.log('[Sandbox stdout]:', data),
      onStderr: (data) => console.error('[Sandbox stderr]:', data),
    });

    const executionResult: SandboxExecutionResult = {
      success: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      error: result.error,
    };

    // For web projects, try to get the preview URL
    if (projectType === 'web' && executionResult.success) {
      executionResult.url = getWebPreviewUrl(sandbox);
    }

    return executionResult;
  } catch (error) {
    console.error('Sandbox execution error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown execution error',
    };
  } finally {
    // Always cleanup the sandbox
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch (cleanupError) {
        console.error('Error cleaning up sandbox:', cleanupError);
      }
    }
  }
}

/**
 * Execute a Next.js project in a sandbox
 */
export async function executeNextJsProject(
  files: File[],
  options: SandboxOptions = {}
): Promise<SandboxExecutionResult> {
  const filesArray = files.map(f => ({ path: f.path, content: f.content }));

  // Check for common Next.js entry points
  const hasPackageJson = files.some(f => f.path === 'package.json');

  if (!hasPackageJson) {
    return {
      success: false,
      error: 'No package.json found. Next.js projects require a package.json file.',
    };
  }

  return executeInSandbox(filesArray, 'package.json', 'web', options);
}

/**
 * Execute a Python script in a sandbox
 */
export async function executePythonScript(
  files: File[],
  entrypoint: string = 'main.py',
  options: SandboxOptions = {}
): Promise<SandboxExecutionResult> {
  const filesArray = files.map(f => ({ path: f.path, content: f.content }));

  return executeInSandbox(filesArray, entrypoint, 'cli', options);
}

/**
 * Execute generic code files
 */
export async function executeCode(
  code: string,
  language: string,
  filename?: string
): Promise<SandboxExecutionResult> {
  const file = {
    path: filename || `main.${getExtensionForLanguage(language)}`,
    content: code,
  };

  const projectType = inferProjectType(language);

  return executeInSandbox([file], file.path, projectType);
}


/**
 * Infer project type from language
 */
function inferProjectType(language: string): ProjectType {
  const lang = language.toLowerCase();

  if (lang.includes('html') || lang.includes('tsx') || lang.includes('jsx')) {
    return 'web';
  }
  if (lang.includes('python')) {
    return 'api';
  }

  return 'cli';
}

/**
 * Get file extension for a language
 */
function getExtensionForLanguage(language: string): string {
  const extensions: Record<string, string> = {
    typescript: 'ts',
    javascript: 'js',
    tsx: 'tsx',
    jsx: 'jsx',
    python: 'py',
    rust: 'rs',
    go: 'go',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
  };

  return extensions[language.toLowerCase()] || 'txt';
}

/**
 * Sanitize file path to prevent command injection
 */
function sanitizePath(path: string): string {
  // Remove any shell special characters and allow only safe filename characters
  // Allow alphanumeric, dots, dashes, underscores, and forward slashes
  return path.replace(/[^a-zA-Z0-9._\-/]/g, '');
}

/**
 * Determine the execution command based on file and project type
 */
function getExecutionCommand(entrypoint: string, projectType: ProjectType): string {
  // Sanitize the entrypoint to prevent command injection
  const safeEntrypoint = sanitizePath(entrypoint);
  const ext = safeEntrypoint.split('.').pop()?.toLowerCase();

  // For web projects
  if (projectType === 'web') {
    return 'npm install && npm run dev';
  }

  // Language-specific commands
  switch (ext) {
    case 'py':
      return `python ${safeEntrypoint}`;
    case 'js':
      return `node ${safeEntrypoint}`;
    case 'ts':
      return `npx ts-node ${safeEntrypoint}`;
    case 'rs':
      return `rustc ${safeEntrypoint} && ./main`;
    case 'go':
      return `go run ${safeEntrypoint}`;
    case 'java': {
      const className = safeEntrypoint.replace('.java', '');
      return `javac ${safeEntrypoint} && java ${className}`;
    }
    default:
      return `./${safeEntrypoint}`;
  }
}

/**
 * Get web preview URL from sandbox (for web projects)
 */
function getWebPreviewUrl(sandbox: Sandbox): string {
  // For Next.js projects, the dev server typically runs on port 3000
  const host = sandbox.getHost(3000);
  return `https://${host}`;
}

/**
 * Test E2B connection
 */
export async function testE2BSandbox(): Promise<{ success: boolean; message: string }> {
  try {
    const sandbox = await createSandbox({ timeout: 10000 });

    // Try a simple echo command
    const result = await sandbox.commands.run('echo "Hello from E2B sandbox!"', { stdin: false });

    await sandbox.kill();

    return {
      success: result.exitCode === 0,
      message: result.exitCode === 0
        ? `E2B sandbox connection successful! Output: ${result.stdout.trim()}`
        : 'E2B sandbox connection failed',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
