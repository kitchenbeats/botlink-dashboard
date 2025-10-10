// ============================================================================
// SEARCH OPERATION TOOL DEFINITIONS
// ============================================================================

import type { Tool } from '../types';

/**
 * SEARCH_FILES - Search for text in files (grep)
 */
export const searchFiles: Tool = {
  definition: {
    name: 'search_files',
    description: 'Search for text patterns in files using grep. Essential for finding imports, function definitions, or any text pattern.',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'The text or regex pattern to search for',
        },
        path: {
          type: 'string',
          description: 'Optional path to search in (defaults to current directory)',
        },
        filePattern: {
          type: 'string',
          description: 'Optional file pattern to filter (e.g., "*.tsx", "*.ts")',
        },
        caseSensitive: {
          type: 'boolean',
          description: 'Whether search should be case sensitive (default: false)',
        },
      },
      required: ['pattern'],
    },
  },
  handler: async (input, context) => {
    try {
      const { pattern, path = '.', filePattern, caseSensitive = false } = input;
      const { sandbox } = context;

      if (!sandbox) {
        return {
          success: false,
          error: 'Sandbox not available for search operations',
        };
      }

      // Build grep command
      const caseFlag = caseSensitive ? '' : '-i';
      const fileGlob = filePattern ? `--include="${filePattern}"` : '';
      const command = `grep -r ${caseFlag} ${fileGlob} "${pattern}" ${path} || true`;

      const result = await sandbox.commands.run(command);

      return {
        success: true,
        data: {
          matches: result.stdout,
          pattern,
          path,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search files',
      };
    }
  },
};

/**
 * FIND_FILES - Find files by name pattern
 */
export const findFiles: Tool = {
  definition: {
    name: 'find_files',
    description: 'Find files by name pattern. Useful for locating specific files or types of files.',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'File name pattern to search for (e.g., "*.tsx", "package.json")',
        },
        path: {
          type: 'string',
          description: 'Optional path to search in (defaults to current directory)',
        },
      },
      required: ['pattern'],
    },
  },
  handler: async (input, context) => {
    try {
      const { pattern, path = '.' } = input;
      const { sandbox } = context;

      if (!sandbox) {
        return {
          success: false,
          error: 'Sandbox not available for find operations',
        };
      }

      const command = `find ${path} -name "${pattern}" -type f`;
      const result = await sandbox.commands.run(command);

      return {
        success: true,
        data: {
          files: result.stdout.split('\n').filter((f) => f.trim()),
          pattern,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find files',
      };
    }
  },
};
