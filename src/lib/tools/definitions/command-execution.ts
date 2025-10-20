// ============================================================================
// COMMAND EXECUTION TOOL DEFINITIONS
// ============================================================================

import type { Tool } from '../types';

/**
 * EXECUTE_COMMAND - Run a bash command in the sandbox
 */
export const executeCommand: Tool = {
  definition: {
    name: 'execute_command',
    description: 'Execute a bash command in the sandbox environment. Use for running npm/pnpm commands, starting servers, etc.',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The bash command to execute',
        },
        background: {
          type: 'boolean',
          description: 'Whether to run the command in the background (for long-running processes like dev servers)',
        },
      },
      required: ['command'],
    },
  },
  handler: async (input, context) => {
    try {
      const { command, background } = input;
      const { sandbox } = context;

      if (!sandbox) {
        return {
          success: false,
          error: 'Sandbox not available for command execution',
        };
      }

      const result = background
        ? await sandbox.commands.run(command as string, {
            background: true as const,
          })
        : await sandbox.commands.run(command as string);

      return {
        success: result.exitCode === 0,
        data: {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
        },
        metadata: {
          commandOutput: result.stdout || result.stderr,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute command',
      };
    }
  },
};

/**
 * INSTALL_PACKAGE - Install npm/pnpm packages
 */
export const installPackage: Tool = {
  definition: {
    name: 'install_package',
    description: 'Install one or more npm/pnpm packages in the project',
    parameters: {
      type: 'object',
      properties: {
        packages: {
          type: 'array',
          description: 'Array of package names to install (e.g., ["react", "react-dom"])',
          items: {
            type: 'string',
            description: 'Package name',
          },
        },
        dev: {
          type: 'boolean',
          description: 'Install as dev dependencies',
        },
        manager: {
          type: 'string',
          description: 'Package manager to use',
          enum: ['npm', 'pnpm', 'yarn'],
        },
      },
      required: ['packages'],
    },
  },
  handler: async (input, context) => {
    try {
      const { packages, dev, manager = 'npm' } = input;
      const { sandbox } = context;

      if (!sandbox) {
        return {
          success: false,
          error: 'Sandbox not available for package installation',
        };
      }

      const devFlag = dev ? (manager === 'npm' ? '--save-dev' : '-D') : '';
      const pkgList = Array.isArray(packages) ? packages : [packages];
      const command = `${manager} install ${pkgList.join(' ')} ${devFlag}`.trim();

      const result = await sandbox.commands.run(command);

      return {
        success: result.exitCode === 0,
        data: {
          packages,
          dev,
          stdout: result.stdout,
          stderr: result.stderr,
        },
        metadata: {
          commandOutput: result.stdout || result.stderr,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to install packages',
      };
    }
  },
};
