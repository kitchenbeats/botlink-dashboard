// ============================================================================
// TOOL REGISTRY - Central registry for all tools
// ============================================================================

import type { Tool } from './types';
import { ToolCategory } from './types';

// File operations
import {
  readFile,
  writeFile,
  deleteFileTool,
  listFiles,
  moveFile,
} from './definitions/file-operations';

// Command execution
import {
  executeCommand,
  installPackage,
} from './definitions/command-execution';

// Git operations
import {
  gitInit,
  gitCommit,
  gitStatus,
  gitDiff,
  gitLog,
} from './definitions/git-operations';

// Search operations
import {
  searchFiles,
  findFiles,
} from './definitions/search-operations';

// Project management
import {
  createDirectory,
  checkPath,
  getProjectStructure,
  checkPort,
  readPackageJson,
} from './definitions/project-management';

// Web operations
import {
  fetchUrl,
  searchNpm,
  readGithubFile,
  webSearch,
  searchDocs,
} from './definitions/web-operations';

/**
 * All available tools organized by category
 */
export const ALL_TOOLS: Record<ToolCategory, Tool[]> = {
  [ToolCategory.FILE_OPERATIONS]: [
    readFile,
    writeFile,
    deleteFileTool,
    listFiles,
    moveFile,
  ],
  [ToolCategory.COMMAND_EXECUTION]: [
    executeCommand,
    installPackage,
  ],
  [ToolCategory.GIT_OPERATIONS]: [
    gitInit,
    gitCommit,
    gitStatus,
    gitDiff,
    gitLog,
  ],
  [ToolCategory.PROJECT_MANAGEMENT]: [
    createDirectory,
    checkPath,
    getProjectStructure,
    checkPort,
    readPackageJson,
  ],
  [ToolCategory.SEARCH]: [
    searchFiles,
    findFiles,
  ],
  [ToolCategory.WEB]: [
    fetchUrl,
    searchNpm,
    readGithubFile,
    webSearch,
    searchDocs,
  ],
};

/**
 * Get all tools as a flat array
 */
export function getAllTools(): Tool[] {
  return Object.values(ALL_TOOLS).flat();
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: ToolCategory): Tool[] {
  return ALL_TOOLS[category] || [];
}

/**
 * Get a specific tool by name
 */
export function getToolByName(name: string): Tool | undefined {
  return getAllTools().find((tool) => tool.definition.name === name);
}

/**
 * Get tool definitions only (without handlers) for sending to LLM
 */
export function getToolDefinitions() {
  return getAllTools().map((tool) => tool.definition);
}

// Export types and tools
export * from './types';
export {
  // File operations
  readFile,
  writeFile,
  deleteFileTool,
  listFiles,
  moveFile,
  // Command execution
  executeCommand,
  installPackage,
  // Git operations
  gitInit,
  gitCommit,
  gitStatus,
  gitDiff,
  gitLog,
  // Search operations
  searchFiles,
  findFiles,
  // Project management
  createDirectory,
  checkPath,
  getProjectStructure,
  checkPort,
  readPackageJson,
  // Web operations
  fetchUrl,
  searchNpm,
  readGithubFile,
  webSearch,
  searchDocs,
};
