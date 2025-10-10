// ============================================================================
// GIT OPERATION TOOL DEFINITIONS
// ============================================================================

import type { Tool } from '../types';

/**
 * GIT_INIT - Initialize a git repository
 */
export const gitInit: Tool = {
  definition: {
    name: 'git_init',
    description: 'Initialize a new git repository in the project',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  handler: async (input, context) => {
    try {
      const { sandbox } = context;

      if (!sandbox) {
        return {
          success: false,
          error: 'Sandbox not available for git operations',
        };
      }

      const result = await sandbox.commands.run('git init');

      return {
        success: result.exitCode === 0,
        data: { initialized: true },
        metadata: { commandOutput: result.stdout },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize git',
      };
    }
  },
};

/**
 * GIT_COMMIT - Create a git commit
 */
export const gitCommit: Tool = {
  definition: {
    name: 'git_commit',
    description: 'Stage all changes and create a git commit with a message',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Commit message describing the changes',
        },
      },
      required: ['message'],
    },
  },
  handler: async (input, context) => {
    try {
      const { message } = input as { message: string };
      const { sandbox } = context;

      if (!sandbox) {
        return {
          success: false,
          error: 'Sandbox not available for git operations',
        };
      }

      // Stage all changes
      await sandbox.commands.run('git add .');

      // Commit
      const result = await sandbox.commands.run(`git commit -m "${message}"`);

      return {
        success: result.exitCode === 0,
        data: { message },
        metadata: {
          commandOutput: result.stdout,
          gitCommit: message,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create commit',
      };
    }
  },
};

/**
 * GIT_STATUS - Get git status
 */
export const gitStatus: Tool = {
  definition: {
    name: 'git_status',
    description: 'Get the current status of the git repository (modified, untracked files, etc.)',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  handler: async (input, context) => {
    try {
      const { sandbox } = context;

      if (!sandbox) {
        return {
          success: false,
          error: 'Sandbox not available for git operations',
        };
      }

      const result = await sandbox.commands.run('git status --short');

      return {
        success: true,
        data: {
          status: result.stdout,
          hasChanges: result.stdout.trim().length > 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get git status',
      };
    }
  },
};

/**
 * GIT_DIFF - Show git diff
 */
export const gitDiff: Tool = {
  definition: {
    name: 'git_diff',
    description: 'Show the diff of uncommitted changes',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Optional path to show diff for specific file',
        },
      },
    },
  },
  handler: async (input, context) => {
    try {
      const { path } = input;
      const { sandbox } = context;

      if (!sandbox) {
        return {
          success: false,
          error: 'Sandbox not available for git operations',
        };
      }

      const command = path ? `git diff ${path}` : 'git diff';
      const result = await sandbox.commands.run(command);

      return {
        success: true,
        data: {
          diff: result.stdout,
          hasChanges: result.stdout.trim().length > 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get git diff',
      };
    }
  },
};

/**
 * GIT_LOG - Show commit history
 */
export const gitLog: Tool = {
  definition: {
    name: 'git_log',
    description: 'Show recent commit history',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of commits to show (default: 10)',
        },
      },
    },
  },
  handler: async (input, context) => {
    try {
      const { limit = 10 } = input;
      const { sandbox } = context;

      if (!sandbox) {
        return {
          success: false,
          error: 'Sandbox not available for git operations',
        };
      }

      const result = await sandbox.commands.run(
        `git log --oneline -n ${limit}`
      );

      return {
        success: true,
        data: {
          commits: result.stdout,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get git log',
      };
    }
  },
};
