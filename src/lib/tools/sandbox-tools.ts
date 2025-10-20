/**
 * E2B Sandbox Tools for Specialized Agents
 * Production-ready tools that agents use to interact with the E2B sandbox
 */

import { createTool } from '@inngest/agent-kit';
import { z } from 'zod';
import type { Sandbox } from 'e2b';

/**
 * File Operations Tool - Create, read, update, delete files in sandbox
 */
export function createFileOperationsTool(sandbox: Sandbox) {
  return createTool({
    name: 'file_operations',
    description: 'Create, read, update, or delete files in the sandbox. Use this to write code, config files, or read existing files.',
    parameters: z.object({
      operation: z.enum(['create', 'read', 'update', 'delete', 'list']).describe('File operation to perform'),
      path: z.string().describe('File path relative to project root (e.g., "src/components/Button.tsx")'),
      content: z.string().optional().describe('File content (for create/update operations)'),
      directory: z.string().optional().describe('Directory path (for list operation)'),
    }),
    handler: async ({ operation, path, content, directory }) => {
      try {
        switch (operation) {
          case 'create':
          case 'update':
            if (!content) throw new Error('Content required for create/update');
            await sandbox.files.write(path, content);
            return {
              success: true,
              message: `${operation === 'create' ? 'Created' : 'Updated'} file: ${path}`,
              path,
            };

          case 'read':
            const fileContent = await sandbox.files.read(path);
            return {
              success: true,
              content: fileContent,
              path,
            };

          case 'delete':
            await sandbox.files.remove(path);
            return {
              success: true,
              message: `Deleted file: ${path}`,
              path,
            };

          case 'list':
            const listPath = directory || '.';
            const files = await sandbox.files.list(listPath);
            return {
              success: true,
              files,
              directory: listPath,
            };

          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          operation,
          path,
        };
      }
    },
  });
}

/**
 * Terminal Tool - Execute commands in sandbox
 */
export function createTerminalTool(sandbox: Sandbox) {
  return createTool({
    name: 'terminal',
    description: 'Execute terminal commands in the sandbox. Use this to install packages, run builds, execute tests, or any shell command.',
    parameters: z.object({
      command: z.string().describe('Shell command to execute (e.g., "npm install", "npm run build")'),
      working_directory: z.string().optional().describe('Working directory for command (defaults to project root)'),
      timeout: z.number().optional().describe('Timeout in milliseconds (default: 30000)'),
    }),
    handler: async ({ command, working_directory, timeout = 30000 }) => {
      try {
        console.log(`[Terminal] Executing: ${command}`);

        const result = await sandbox.commands.run(command, {
          cwd: working_directory,
          timeoutMs: timeout,
        });

        return {
          success: result.exitCode === 0,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
          command,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          command,
        };
      }
    },
  });
}

/**
 * Search Tool - Search through code in sandbox
 */
export function createSearchTool(sandbox: Sandbox) {
  return createTool({
    name: 'search',
    description: 'Search for text patterns in files within the sandbox. Use this to find existing code, imports, or specific patterns.',
    parameters: z.object({
      pattern: z.string().describe('Search pattern (supports regex)'),
      file_pattern: z.string().optional().describe('File pattern to search in (e.g., "*.ts", "src/**/*.tsx")'),
      case_sensitive: z.boolean().optional().describe('Whether search is case-sensitive (default: false)'),
    }),
    handler: async ({ pattern, file_pattern, case_sensitive = false }) => {
      try {
        // Use grep command in sandbox
        const grepFlags = case_sensitive ? '' : '-i';
        const fileGlob = file_pattern || '*';
        const command = `grep -r ${grepFlags} "${pattern}" ${fileGlob} 2>/dev/null || true`;

        const result = await sandbox.commands.run(command);

        const matches = result.stdout
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const [file, ...rest] = line.split(':');
            return {
              file,
              line: rest.join(':'),
            };
          });

        return {
          success: true,
          matches,
          total_matches: matches.length,
          pattern,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          pattern,
        };
      }
    },
  });
}

/**
 * Code Analysis Tool - Analyze code structure
 */
export function createCodeAnalysisTool(sandbox: Sandbox) {
  return createTool({
    name: 'code_analysis',
    description: 'Analyze code structure, dependencies, and patterns in the sandbox. Use this to understand existing code before making changes.',
    parameters: z.object({
      analysis_type: z.enum(['structure', 'dependencies', 'imports', 'exports', 'functions', 'types']).describe('Type of analysis to perform'),
      path: z.string().describe('File or directory path to analyze'),
    }),
    handler: async ({ analysis_type, path }) => {
      try {
        let command = '';

        switch (analysis_type) {
          case 'structure':
            // List directory structure
            command = `find ${path} -type f -o -type d | head -100`;
            break;

          case 'dependencies':
            // Find package.json and list dependencies
            command = `find ${path} -name "package.json" -exec cat {} \\;`;
            break;

          case 'imports':
            // Find all import statements
            command = `grep -r "^import " ${path} || true`;
            break;

          case 'exports':
            // Find all export statements
            command = `grep -r "^export " ${path} || true`;
            break;

          case 'functions':
            // Find function declarations
            command = `grep -rE "(function |const .* = |async )" ${path} || true`;
            break;

          case 'types':
            // Find type/interface declarations
            command = `grep -rE "(type |interface |enum )" ${path} || true`;
            break;
        }

        const result = await sandbox.commands.run(command);

        return {
          success: true,
          analysis_type,
          path,
          result: result.stdout,
          summary: `Found ${result.stdout.split('\n').filter(l => l.trim()).length} items`,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          analysis_type,
          path,
        };
      }
    },
  });
}

/**
 * Git Operations Tool - Version control in sandbox
 */
export function createGitOperationsTool(sandbox: Sandbox) {
  return createTool({
    name: 'git_operations',
    description: 'Perform git operations in the sandbox. Use this to initialize repos, commit changes, check status, etc.',
    parameters: z.object({
      operation: z.enum(['init', 'status', 'add', 'commit', 'log', 'diff']).describe('Git operation'),
      message: z.string().optional().describe('Commit message (for commit operation)'),
      files: z.array(z.string()).optional().describe('Files to add (for add operation)'),
    }),
    handler: async ({ operation, message, files }) => {
      try {
        let command = '';

        switch (operation) {
          case 'init':
            command = 'git init';
            break;

          case 'status':
            command = 'git status';
            break;

          case 'add':
            const filesToAdd = files?.join(' ') || '.';
            command = `git add ${filesToAdd}`;
            break;

          case 'commit':
            if (!message) throw new Error('Commit message required');
            command = `git commit -m "${message}"`;
            break;

          case 'log':
            command = 'git log --oneline -10';
            break;

          case 'diff':
            command = 'git diff';
            break;
        }

        const result = await sandbox.commands.run(command);

        return {
          success: result.exitCode === 0,
          output: result.stdout || result.stderr,
          operation,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          operation,
        };
      }
    },
  });
}

/**
 * Package Manager Tool - Manage dependencies
 */
export function createPackageManagerTool(sandbox: Sandbox) {
  return createTool({
    name: 'package_manager',
    description: 'Manage project dependencies using npm, yarn, or pnpm. Use this to install, update, or remove packages.',
    parameters: z.object({
      manager: z.enum(['npm', 'yarn', 'pnpm', 'bun']).optional().describe('Package manager (default: npm)'),
      operation: z.enum(['install', 'add', 'remove', 'update', 'list']).describe('Package operation'),
      packages: z.array(z.string()).optional().describe('Package names'),
      dev: z.boolean().optional().describe('Install as dev dependency'),
    }),
    handler: async ({ manager = 'npm', operation, packages, dev }) => {
      try {
        let command = '';

        switch (operation) {
          case 'install':
            command = manager === 'npm' ? 'npm install' : `${manager} install`;
            break;

          case 'add':
            if (!packages?.length) throw new Error('Packages required for add operation');
            const devFlag = dev ? (manager === 'npm' ? '--save-dev' : '-D') : '';
            command = manager === 'npm'
              ? `npm install ${packages.join(' ')} ${devFlag}`.trim()
              : `${manager} add ${packages.join(' ')} ${devFlag}`.trim();
            break;

          case 'remove':
            if (!packages?.length) throw new Error('Packages required for remove operation');
            command = manager === 'npm'
              ? `npm uninstall ${packages.join(' ')}`
              : `${manager} remove ${packages.join(' ')}`;
            break;

          case 'update':
            command = manager === 'npm' ? 'npm update' : `${manager} upgrade`;
            break;

          case 'list':
            command = manager === 'npm' ? 'npm list --depth=0' : `${manager} list --depth=0`;
            break;
        }

        console.log(`[Package Manager] Executing: ${command}`);
        const result = await sandbox.commands.run(command, {
          timeoutMs: 120000, // 2 minute timeout for installs
        });

        return {
          success: result.exitCode === 0,
          output: result.stdout,
          error: result.stderr,
          operation,
          packages,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          operation,
        };
      }
    },
  });
}

/**
 * Get all tools for a specialized agent
 */
export function getAgentTools(sandbox: Sandbox, toolNames: string[]) {
  const allTools = {
    file_operations: createFileOperationsTool(sandbox),
    terminal: createTerminalTool(sandbox),
    search: createSearchTool(sandbox),
    code_analysis: createCodeAnalysisTool(sandbox),
    git_operations: createGitOperationsTool(sandbox),
    package_manager: createPackageManagerTool(sandbox),
  };

  return toolNames
    .map(name => allTools[name as keyof typeof allTools])
    .filter(Boolean);
}
