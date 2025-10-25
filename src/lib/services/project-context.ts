/**
 * Project Context Manager
 *
 * Generates and maintains comprehensive project context for AI agents
 * Stored in .claude/project-context.md in sandbox for persistence
 */

import type { Sandbox } from 'e2b';

export interface ProjectContext {
  fileTree: string;
  packageJson?: Record<string, unknown>;
  readme?: string;
  summary: string;
  lastUpdated: string;
}

/**
 * Generate file tree from sandbox
 */
async function generateFileTree(sandbox: Sandbox, workDir: string): Promise<string> {
  try {
    // Use find command (tree not available in E2B sandbox)
    const findResult = await sandbox.commands.run(`cd ${workDir} && find . -maxdepth 3 -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.next/*' | sort`);
    return findResult.stdout || 'Unable to generate file tree';
  } catch (error) {
    console.error('[Project Context] Error generating file tree:', error);
    return 'File tree unavailable';
  }
}

/**
 * Read package.json if it exists
 */
async function readPackageJson(sandbox: Sandbox, workDir: string): Promise<Record<string, unknown> | undefined> {
  try {
    const content = await sandbox.files.read(`${workDir}/package.json`);
    return JSON.parse(content);
  } catch (error) {
    return undefined;
  }
}

/**
 * Read README if it exists
 */
async function readReadme(sandbox: Sandbox, workDir: string): Promise<string | undefined> {
  try {
    // Try README.md first, then README
    const mdContent = await sandbox.files.read(`${workDir}/README.md`);
    return mdContent;
  } catch {
    try {
      const txtContent = await sandbox.files.read(`${workDir}/README`);
      return txtContent;
    } catch {
      return undefined;
    }
  }
}

/**
 * Generate comprehensive project context
 */
export async function generateProjectContext(
  sandbox: Sandbox,
  workDir: string
): Promise<ProjectContext> {
  console.log('[Project Context] Generating context for:', workDir);

  const [fileTree, packageJson, readme] = await Promise.all([
    generateFileTree(sandbox, workDir),
    readPackageJson(sandbox, workDir),
    readReadme(sandbox, workDir),
  ]);

  // Generate summary based on available info
  let summary = 'Project context:\n';

  if (packageJson) {
    summary += `- Name: ${packageJson.name || 'Unknown'}\n`;
    summary += `- Description: ${packageJson.description || 'No description'}\n`;

    const deps = Object.keys((packageJson.dependencies as Record<string, unknown>) || {});
    if (deps.length > 0) {
      summary += `- Dependencies: ${deps.slice(0, 5).join(', ')}${deps.length > 5 ? '...' : ''}\n`;
    }

    const scripts = Object.keys((packageJson.scripts as Record<string, unknown>) || {});
    if (scripts.length > 0) {
      summary += `- Scripts: ${scripts.join(', ')}\n`;
    }
  }

  return {
    fileTree,
    packageJson,
    readme,
    summary,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Save project context to .claude/project-context.md in sandbox
 */
export async function saveProjectContext(
  sandbox: Sandbox,
  workDir: string,
  context: ProjectContext
): Promise<void> {
  const contextPath = `${workDir}/.claude/project-context.md`;

  const markdown = `# Project Context

> Last updated: ${context.lastUpdated}

## Summary

${context.summary}

## File Structure

\`\`\`
${context.fileTree}
\`\`\`

${context.packageJson ? `
## Package Info

\`\`\`json
${JSON.stringify(context.packageJson, null, 2)}
\`\`\`
` : ''}

${context.readme ? `
## README

${context.readme}
` : ''}
`;

  try {
    // Ensure .claude directory exists
    await sandbox.commands.run(`mkdir -p ${workDir}/.claude`);

    // Write context file
    await sandbox.files.write(contextPath, markdown);

    console.log('[Project Context] Saved to:', contextPath);
  } catch (error) {
    console.error('[Project Context] Error saving context:', error);
  }
}

/**
 * Load project context from .claude/project-context.md
 */
export async function loadProjectContext(
  sandbox: Sandbox,
  workDir: string
): Promise<string | null> {
  const contextPath = `${workDir}/.claude/project-context.md`;

  try {
    const content = await sandbox.files.read(contextPath);
    return content;
  } catch (error) {
    console.log('[Project Context] No existing context file, will generate');
    return null;
  }
}

/**
 * Get or generate project context
 * Returns markdown string ready to inject into agent prompt
 */
export async function getOrGenerateContext(
  sandbox: Sandbox,
  workDir: string,
  forceRegenerate = false
): Promise<string> {
  // Try to load existing context
  if (!forceRegenerate) {
    const existing = await loadProjectContext(sandbox, workDir);
    if (existing) {
      console.log('[Project Context] Using cached context');
      return existing;
    }
  }

  // Generate new context
  console.log('[Project Context] Generating new context');
  const context = await generateProjectContext(sandbox, workDir);

  // Save for future use
  await saveProjectContext(sandbox, workDir, context);

  // Return markdown
  const markdown = await loadProjectContext(sandbox, workDir);
  return markdown || context.summary;
}
