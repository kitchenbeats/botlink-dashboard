// ============================================================================
// PROJECT MANAGEMENT TOOL DEFINITIONS
// ============================================================================

import type { Tool } from '../types';

/**
 * CREATE_DIRECTORY - Create a directory
 */
export const createDirectory: Tool = {
  definition: {
    name: 'create_directory',
    description: 'Create a new directory at the specified path',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path where the directory should be created',
        },
      },
      required: ['path'],
    },
  },
  handler: async (input, context) => {
    try {
      const { path } = input;
      const { sandbox } = context;

      if (!sandbox) {
        return {
          success: false,
          error: 'Sandbox not available for directory operations',
        };
      }

      const result = await sandbox.commands.run(`mkdir -p "${path}"`);

      return {
        success: result.exitCode === 0,
        data: { path, created: true },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create directory',
      };
    }
  },
};

/**
 * CHECK_PATH - Check if a path exists
 */
export const checkPath: Tool = {
  definition: {
    name: 'check_path',
    description: 'Check if a file or directory exists at the specified path',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to check',
        },
      },
      required: ['path'],
    },
  },
  handler: async (input, context) => {
    try {
      const { path } = input;
      const { sandbox } = context;

      if (!sandbox) {
        return {
          success: false,
          error: 'Sandbox not available for path operations',
        };
      }

      const result = await sandbox.commands.run(`test -e "${path}" && echo "exists" || echo "not found"`);

      const exists = result.stdout.trim() === 'exists';

      return {
        success: true,
        data: { path, exists },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check path',
      };
    }
  },
};

/**
 * GET_PROJECT_STRUCTURE - Get directory tree structure
 */
export const getProjectStructure: Tool = {
  definition: {
    name: 'get_project_structure',
    description: 'Get the directory tree structure of the project. Useful for understanding project organization.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to get structure for (defaults to current directory)',
        },
        depth: {
          type: 'number',
          description: 'Maximum depth to traverse (default: 3)',
        },
      },
    },
  },
  handler: async (input, context) => {
    try {
      const { path = '.', depth = 3 } = input;
      const { sandbox } = context;

      if (!sandbox) {
        return {
          success: false,
          error: 'Sandbox not available for project structure operations',
        };
      }

      // Use tree if available, otherwise use find with formatting
      const treeCmd = `tree -L ${depth} "${path}" || find "${path}" -maxdepth ${depth} -print | sed -e "s;[^/]*/;|____;g;s;____|; |;g"`;
      const result = await sandbox.commands.run(treeCmd);

      return {
        success: true,
        data: {
          structure: result.stdout,
          path,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get project structure',
      };
    }
  },
};

/**
 * CHECK_PORT - Check if a port is in use
 */
export const checkPort: Tool = {
  definition: {
    name: 'check_port',
    description: 'Check if a port is in use (useful before starting dev servers)',
    parameters: {
      type: 'object',
      properties: {
        port: {
          type: 'number',
          description: 'Port number to check',
        },
      },
      required: ['port'],
    },
  },
  handler: async (input, context) => {
    try {
      const { port } = input;
      const { sandbox } = context;

      if (!sandbox) {
        return {
          success: false,
          error: 'Sandbox not available for port operations',
        };
      }

      const result = await sandbox.commands.run(`lsof -i:${port} || echo "free"`);
      const inUse = !result.stdout.includes('free');

      return {
        success: true,
        data: {
          port,
          inUse,
          details: inUse ? result.stdout : 'Port is free',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check port',
      };
    }
  },
};

/**
 * READ_PACKAGE_JSON - Read and parse package.json
 */
export const readPackageJson: Tool = {
  definition: {
    name: 'read_package_json',
    description: 'Read and parse the package.json file to see dependencies, scripts, etc.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to package.json (defaults to ./package.json)',
        },
      },
    },
  },
  handler: async (input, context) => {
    try {
      const { path = './package.json' } = input as { path?: string };
      const { sandbox } = context;

      if (!sandbox) {
        return {
          success: false,
          error: 'Sandbox not available for reading package.json',
        };
      }

      const content = await sandbox.files.read(path);
      const packageJson = JSON.parse(content);

      return {
        success: true,
        data: {
          name: packageJson.name,
          version: packageJson.version,
          dependencies: packageJson.dependencies || {},
          devDependencies: packageJson.devDependencies || {},
          scripts: packageJson.scripts || {},
          full: packageJson,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read package.json',
      };
    }
  },
};
