// ============================================================================
// FILE OPERATION TOOL DEFINITIONS
// ============================================================================

import type { Tool } from '../types';
import { createFile, updateFile, deleteFile, getFileByPath } from '@/lib/db/files';
import { getProjectWithFiles } from '@/lib/db/projects';

/**
 * READ_FILE - Read contents of a file
 */
export const readFile: Tool = {
  definition: {
    name: 'read_file',
    description: 'Read the complete contents of a file in the project',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file relative to project root (e.g., "src/App.tsx")',
        },
      },
      required: ['path'],
    },
  },
  handler: async (input, context) => {
    try {
      const { path } = input as { path: string };
      const { projectId, sandbox } = context;

      // Try to read from sandbox first if available
      if (sandbox) {
        const content = await sandbox.files.read(path);
        return {
          success: true,
          data: { path, content },
        };
      }

      // Fall back to database
      const file = await getFileByPath(projectId, path);
      if (!file) {
        return {
          success: false,
          error: `File not found: ${path}`,
        };
      }

      return {
        success: true,
        data: { path, content: file.content },
        };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file',
      };
    }
  },
};

/**
 * WRITE_FILE - Create or update a file
 */
export const writeFile: Tool = {
  definition: {
    name: 'write_file',
    description: 'Create a new file or completely overwrite an existing file with new content',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path where the file should be created/updated',
        },
        content: {
          type: 'string',
          description: 'Complete content to write to the file',
        },
      },
      required: ['path', 'content'],
    },
  },
  handler: async (input, context) => {
    try {
      const { path, content } = input as { path: string; content: string };
      const { projectId, sandbox } = context;

      // Write to sandbox if available
      if (sandbox) {
        await sandbox.files.write(path, content);
      }

      // Determine language from file extension
      const ext = path.split('.').pop()?.toLowerCase();
      const languageMap: Record<string, string> = {
        ts: 'typescript',
        tsx: 'tsx',
        js: 'javascript',
        jsx: 'jsx',
        json: 'json',
        css: 'css',
        scss: 'scss',
        html: 'html',
        md: 'markdown',
        py: 'python',
        go: 'go',
        rs: 'rust',
      };
      const language = languageMap[ext || ''] || 'text';

      // Check if file exists in database
      const existingFile = await getFileByPath(projectId, path);

      if (existingFile) {
        // Update existing file
        await updateFile(existingFile.id, { content });
      } else {
        // Create new file
        await createFile({
          project_id: projectId,
          path,
          content,
          language,
          created_by: 'ai',
        });
      }

      return {
        success: true,
        data: { path, action: existingFile ? 'updated' : 'created' },
        metadata: { filesChanged: [path] },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write file',
      };
    }
  },
};

/**
 * DELETE_FILE - Delete a file
 */
export const deleteFileTool: Tool = {
  definition: {
    name: 'delete_file',
    description: 'Delete a file from the project',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file to delete',
        },
      },
      required: ['path'],
    },
  },
  handler: async (input, context) => {
    try {
      const { path } = input as { path: string };
      const { projectId, sandbox } = context;

      // Delete from sandbox if available
      if (sandbox) {
        await sandbox.files.remove(path);
      }

      // Delete from database
      const file = await getFileByPath(projectId, path);
      if (file) {
        await deleteFile(file.id);
      }

      return {
        success: true,
        data: { path, action: 'deleted' },
        metadata: { filesChanged: [path] },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file',
      };
    }
  },
};

/**
 * LIST_FILES - List all files in the project
 */
export const listFiles: Tool = {
  definition: {
    name: 'list_files',
    description: 'Get a list of all files in the project with their paths',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Optional glob pattern to filter files (e.g., "*.ts", "src/**")',
        },
      },
    },
  },
  handler: async (input, context) => {
    try {
      const { projectId, sandbox } = context;
      const { pattern } = input as { pattern?: string };

      // Get files from sandbox if available
      if (sandbox) {
        const files = await sandbox.files.list('/home/user');
        const filteredFiles = pattern
          ? files.filter((f) => f.name.match(new RegExp(pattern as string)))
          : files;

        return {
          success: true,
          data: {
            files: filteredFiles.map((f) => ({
              path: f.path,
              type: f.type,
            })),
          },
        };
      }

      // Fall back to database
      const projectData = await getProjectWithFiles(projectId);
      if (!projectData) {
        return {
          success: false,
          error: 'Project not found',
        };
      }

      const files = projectData.files.map((f) => ({
        path: f.path,
        language: f.language,
      }));

      return {
        success: true,
        data: { files },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list files',
      };
    }
  },
};

/**
 * MOVE_FILE - Rename or move a file
 */
export const moveFile: Tool = {
  definition: {
    name: 'move_file',
    description: 'Rename or move a file to a new location',
    parameters: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          description: 'Current path of the file',
        },
        destination: {
          type: 'string',
          description: 'New path for the file',
        },
      },
      required: ['source', 'destination'],
    },
  },
  handler: async (input, context) => {
    try {
      const { source, destination } = input as { source: string; destination: string };
      const { projectId, sandbox } = context;

      // Read source file
      const sourceFile = await getFileByPath(projectId, source);
      if (!sourceFile) {
        return {
          success: false,
          error: `Source file not found: ${source}`,
        };
      }

      // Move in sandbox if available
      if (sandbox) {
        const content = await sandbox.files.read(source);
        await sandbox.files.write(destination, content);
        await sandbox.files.remove(source);
      }

      // Create new file in database
      await createFile({
        project_id: projectId,
        path: destination,
        content: sourceFile.content,
        language: sourceFile.language,
        created_by: 'ai',
      });

      // Delete old file
      await deleteFile(sourceFile.id);

      return {
        success: true,
        data: { source, destination, action: 'moved' },
        metadata: { filesChanged: [source, destination] },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to move file',
      };
    }
  },
};
