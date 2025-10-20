/**
 * GIT SERVICE - Automatic Version Control
 *
 * Provides automatic git commits after every AI action to:
 * - Protect beginners from losing work
 * - Create audit trail of AI changes
 * - Enable easy rollback functionality
 *
 * NOT controlled by AI - this is a system-level safety feature
 */

import type { Sandbox } from 'e2b';

const GITHUB_ORG = process.env.GITHUB_ORG;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_PREFIX = process.env.GITHUB_PREFIX || 'bl-';

export interface GitCommitOptions {
  userPrompt: string;
  aiResponse: string;
  workDir?: string;
  author?: string;
}

export class GitService {
  /**
   * Commit all changes made during an AI turn
   * This runs after the AI completes a task
   */
  static async commitAgentChanges(
    sandbox: Sandbox,
    options: GitCommitOptions
  ): Promise<{ success: boolean; commitHash?: string; error?: string }> {
    const { userPrompt, aiResponse, workDir = '/home/user', author = 'BotLink AI <ai@botlink.com>' } = options;

    try {

      // Check if there are any changes to commit
      const statusResult = await sandbox.commands.run(`cd ${workDir} && git status --porcelain`);

      if (!statusResult.stdout.trim()) {
        console.log('[Git] No changes to commit');
        return { success: true };
      }

      console.log('[Git] Changes detected:', statusResult.stdout);

      // Stage all changes
      await sandbox.commands.run(`cd ${workDir} && git add -A`);

      // Create commit message
      // Format: Short summary (first 50 chars of prompt) + full AI response in body
      const shortPrompt = userPrompt.length > 50
        ? userPrompt.substring(0, 47) + '...'
        : userPrompt;

      // Extract task summary from AI response if it exists
      const summaryMatch = aiResponse.match(/<task_summary>(.*?)<\/task_summary>/s);
      const summary = summaryMatch?.[1]?.trim() ?? aiResponse;

      const commitMessage = `AI: ${shortPrompt}\n\n${summary.substring(0, 500)}`;

      // Commit with message
      const commitResult = await sandbox.commands.run(
        `cd ${workDir} && git -c user.name="BotLink AI" -c user.email="ai@botlink.com" commit -m "${commitMessage.replace(/"/g, '\\"')}"`
      );

      // Get the commit hash
      const hashResult = await sandbox.commands.run(`cd ${workDir} && git rev-parse HEAD`);
      const commitHash = hashResult.stdout.trim();

      console.log('[Git] Committed changes:', commitHash);

      return {
        success: true,
        commitHash,
      };
    } catch (error) {
      console.error('[Git] Commit failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create a user checkpoint (tagged commit)
   * Used when user explicitly wants to save a restore point
   */
  static async createCheckpoint(
    sandbox: Sandbox,
    label: string
  ): Promise<{ success: boolean; tag?: string; error?: string }> {
    try {
      const workDir = '/home/user';

      // Check if there are uncommitted changes
      const statusResult = await sandbox.commands.run(`cd ${workDir} && git status --porcelain`);

      if (statusResult.stdout.trim()) {
        // Commit changes first
        await sandbox.commands.run(`cd ${workDir} && git add -A`);
        await sandbox.commands.run(
          `cd ${workDir} && git -c user.name="BotLink User" -c user.email="user@botlink.com" commit -m "Checkpoint: ${label}"`
        );
      }

      // Create tag
      const timestamp = Date.now();
      const tagName = `checkpoint-${timestamp}`;
      await sandbox.commands.run(`cd ${workDir} && git tag -a ${tagName} -m "${label}"`);

      console.log('[Git] Created checkpoint:', tagName);

      return {
        success: true,
        tag: tagName,
      };
    } catch (error) {
      console.error('[Git] Checkpoint failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * List commit history
   */
  static async listCommits(
    sandbox: Sandbox,
    limit: number = 20,
    workDir: string = '/home/user'
  ): Promise<{ success: boolean; commits?: Array<{ hash: string; message: string; date: string }>; error?: string }> {
    try {
      // Check if git repo exists first
      const checkResult = await sandbox.commands.run(`cd ${workDir} && git rev-parse --git-dir 2>/dev/null || echo "not-git"`);

      if (checkResult.stdout.includes('not-git')) {
        // Not a git repository
        return { success: true, commits: [] };
      }

      // Try to get commit log
      const result = await sandbox.commands.run(
        `cd ${workDir} && git log --pretty=format:"%H|%s|%ai" -n ${limit} 2>/dev/null || echo ""`
      );

      // If no commits yet, return empty array
      if (!result.stdout.trim()) {
        return { success: true, commits: [] };
      }

      const commits = result.stdout
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [hash, message, date] = line.split('|');
          return { hash: hash || '', message: message || '', date: date || '' };
        });

      return {
        success: true,
        commits,
      };
    } catch (error) {
      console.error('[Git] List commits failed:', error);
      // Return empty commits instead of error - this is non-critical
      return {
        success: true,
        commits: [],
      };
    }
  }

  /**
   * Rollback to a specific commit
   * WARNING: This is destructive - will lose all changes after the commit
   */
  static async rollback(
    sandbox: Sandbox,
    commitHash: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const workDir = '/home/user';

      // Reset to the specified commit
      await sandbox.commands.run(`cd ${workDir} && git reset --hard ${commitHash}`);

      console.log('[Git] Rolled back to:', commitHash);

      return { success: true };
    } catch (error) {
      console.error('[Git] Rollback failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Initialize git repository (used for new projects)
   */
  static async initRepository(
    sandbox: Sandbox,
    workDir: string = '/home/user'
  ): Promise<{ success: boolean; commitHash?: string; error?: string }> {
    try {
      // Check if already initialized
      const checkResult = await sandbox.commands.run(`cd ${workDir} && git rev-parse --git-dir 2>/dev/null || echo "not-git"`);

      if (!checkResult.stdout.includes('not-git')) {
        console.log('[Git] Repository already initialized');
        // Get current commit (might not exist if no commits yet)
        try {
          const hashResult = await sandbox.commands.run(`cd ${workDir} && git rev-parse HEAD 2>/dev/null`);
          if (hashResult.stdout.trim()) {
            return { success: true, commitHash: hashResult.stdout.trim() };
          }
        } catch (e) {
          // No commits yet, continue to create initial commit
          console.log('[Git] Repo initialized but no commits yet');
        }
      }

      // Initialize git if needed (don't fail if already exists)
      try {
        const initResult = await sandbox.commands.run(`cd ${workDir} && git init 2>&1 || true`);
        console.log('[Git] Init output:', initResult.stdout || initResult.stderr);
      } catch (e) {
        console.log('[Git] Init warning (might already exist):', e);
      }

      // Fix .git directory permissions to allow all users to read/write
      await sandbox.commands.run(`cd ${workDir} && chmod -R 777 .git 2>&1 || true`);

      // Configure git to not check file ownership (security.bareRepository)
      await sandbox.commands.run(`cd ${workDir} && git config --global --add safe.directory ${workDir} 2>&1 || true`);
      await sandbox.commands.run(`cd ${workDir} && git config user.name "BotLink User" 2>&1 || true`);
      await sandbox.commands.run(`cd ${workDir} && git config user.email "user@botlink.com" 2>&1 || true`);

      // Create initial commit with better error logging
      try {
        const addResult = await sandbox.commands.run(`cd ${workDir} && git add -A 2>&1`);
        console.log('[Git] Add output:', addResult.stdout, addResult.stderr);
        console.log('[Git] Add result object:', JSON.stringify({
          exitCode: addResult.exitCode,
          stdout: addResult.stdout,
          stderr: addResult.stderr
        }));
      } catch (addError) {
        const err = addError as { result?: unknown }
        console.error('[Git] Add error:', addError);
        console.error('[Git] Add error result:', JSON.stringify(err.result || {}));
        throw addError;
      }

      try {
        const commitResult = await sandbox.commands.run(`cd ${workDir} && git commit -m "Initial commit - Project created" 2>&1`);
        console.log('[Git] Commit output:', commitResult.stdout, commitResult.stderr);
      } catch (commitError) {
        const err = commitError as { result?: unknown }
        console.error('[Git] Commit error:', commitError);
        console.error('[Git] Commit error result:', JSON.stringify(err.result || {}));
        throw commitError;
      }

      // Get commit hash
      const hashResult = await sandbox.commands.run(`cd ${workDir} && git rev-parse HEAD`);
      const commitHash = hashResult.stdout.trim();

      console.log('[Git] Repository initialized:', commitHash);

      return { success: true, commitHash };
    } catch (error) {
      console.error('[Git] Init failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get current commit hash (HEAD)
   */
  static async getCurrentCommit(
    sandbox: Sandbox,
    workDir: string = '/home/user'
  ): Promise<string | null> {
    try {
      const result = await sandbox.commands.run(`cd ${workDir} && git rev-parse HEAD 2>/dev/null || echo ""`);
      return result.stdout.trim() || null;
    } catch (error) {
      console.error('[Git] Get current commit failed:', error);
      return null;
    }
  }

  /**
   * List all files in git repository
   */
  static async listFiles(
    sandbox: Sandbox,
    workDir: string = '/home/user'
  ): Promise<{ success: boolean; files?: string[]; error?: string }> {
    try {
      // First check if git repo exists
      const checkResult = await sandbox.commands.run(`cd ${workDir} && git rev-parse --git-dir 2>/dev/null || echo "not-git"`);

      if (checkResult.stdout.includes('not-git')) {
        console.log('[Git] Not a git repository, initializing...');
        // Try to initialize git repo
        const initResult = await this.initRepository(sandbox, workDir);
        if (!initResult.success) {
          return {
            success: false,
            error: 'Failed to initialize git repository: ' + initResult.error,
          };
        }
      }

      const result = await sandbox.commands.run(`cd ${workDir} && git ls-files`);
      const files = result.stdout.split('\n').filter(f => f.trim());
      return { success: true, files };
    } catch (error) {
      console.error('[Git] List files failed:', error);
      console.error('[Git] Error details:', JSON.stringify(error, null, 2));
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Show file content at specific commit
   */
  static async showFile(
    sandbox: Sandbox,
    workDir: string,
    commitHash: string,
    filePath: string
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const result = await sandbox.commands.run(`cd ${workDir} && git show ${commitHash}:${filePath}`);
      return { success: true, content: result.stdout };
    } catch (error) {
      console.error('[Git] Show file failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get diff between two commits
   */
  static async getDiff(
    sandbox: Sandbox,
    workDir: string,
    fromCommit: string,
    toCommit: string = 'HEAD'
  ): Promise<{ success: boolean; diff?: string; error?: string }> {
    try {
      const result = await sandbox.commands.run(`cd ${workDir} && git diff ${fromCommit}..${toCommit}`);
      return { success: true, diff: result.stdout };
    } catch (error) {
      console.error('[Git] Get diff failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ============================================================================
  // GITHUB INTEGRATION
  // ============================================================================

  /**
   * Create GitHub repo for project
   * NOTE: We don't pre-create the repo via API anymore.
   * GitHub will auto-create private repos on first push if they don't exist.
   * This avoids needing admin:org permissions.
   */
  static async createGitHubRepo(
    projectId: string,
    teamId: string,
    template: string,
    projectName?: string
  ): Promise<{ success: boolean; repoUrl?: string; error?: string }> {
    if (!GITHUB_TOKEN) {
      return { success: false, error: 'GITHUB_TOKEN not configured' };
    }

    if (!GITHUB_ORG) {
      return { success: false, error: 'GITHUB_ORG not configured' };
    }

    if (!REPO_PREFIX) {
      return { success: false, error: 'GITHUB_PREFIX not configured' };
    }

    // Just return success - repo will be created on first push
    const repoName = `${REPO_PREFIX}${projectId}`;
    const repoUrl = `https://github.com/${GITHUB_ORG}/${repoName}`;

    console.log('[Git] GitHub repo will be created on first push:', repoUrl);
    return { success: true, repoUrl };
  }

  /**
   * Push to GitHub repo
   */
  static async pushToGitHub(
    sandbox: Sandbox,
    workDir: string,
    projectId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!GITHUB_TOKEN) {
      return { success: false, error: 'GITHUB_TOKEN not configured' };
    }

    if (!GITHUB_ORG) {
      return { success: false, error: 'GITHUB_ORG not configured' };
    }

    if (!REPO_PREFIX) {
      return { success: false, error: 'GITHUB_PREFIX not configured' };
    }

    try {
      const repoName = `${REPO_PREFIX}${projectId}`;
      const remoteUrl = `https://${GITHUB_TOKEN}@github.com/${GITHUB_ORG}/${repoName}.git`;

      // Check if remote already exists
      const checkRemote = await sandbox.commands.run(`cd ${workDir} && git remote -v`);

      if (!checkRemote.stdout.includes('origin')) {
        // Add remote
        await sandbox.commands.run(`cd ${workDir} && git remote add origin ${remoteUrl}`);
      } else {
        // Update remote URL (in case token changed)
        await sandbox.commands.run(`cd ${workDir} && git remote set-url origin ${remoteUrl}`);
      }

      // Push to GitHub
      const pushResult = await sandbox.commands.run(`cd ${workDir} && git push -u origin main 2>&1 || git push -u origin master 2>&1`);

      console.log('[Git] Pushed to GitHub:', pushResult.stdout);
      return { success: true };
    } catch (error) {
      console.error('[Git] Failed to push to GitHub:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Clone from GitHub (restore on sandbox restart)
   */
  static async cloneFromGitHub(
    sandbox: Sandbox,
    workDir: string,
    projectId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!GITHUB_TOKEN) {
      return { success: false, error: 'GITHUB_TOKEN not configured' };
    }

    if (!GITHUB_ORG) {
      return { success: false, error: 'GITHUB_ORG not configured' };
    }

    if (!REPO_PREFIX) {
      return { success: false, error: 'GITHUB_PREFIX not configured' };
    }

    try {
      const repoName = `${REPO_PREFIX}${projectId}`;
      const remoteUrl = `https://${GITHUB_TOKEN}@github.com/${GITHUB_ORG}/${repoName}.git`;

      // Clone repo
      await sandbox.commands.run(`rm -rf ${workDir} && git clone ${remoteUrl} ${workDir}`);

      console.log('[Git] Cloned from GitHub');
      return { success: true };
    } catch (error) {
      console.error('[Git] Failed to clone from GitHub:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete GitHub repo (cleanup)
   */
  static async deleteGitHubRepo(
    projectId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!GITHUB_TOKEN) {
      return { success: false, error: 'GITHUB_TOKEN not configured' };
    }

    if (!GITHUB_ORG) {
      return { success: false, error: 'GITHUB_ORG not configured' };
    }

    if (!REPO_PREFIX) {
      return { success: false, error: 'GITHUB_PREFIX not configured' };
    }

    try {
      const repoName = `${REPO_PREFIX}${projectId}`;

      const response = await fetch(`https://api.github.com/repos/${GITHUB_ORG}/${repoName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      console.log('[Git] Deleted GitHub repo:', repoName);
      return { success: true };
    } catch (error) {
      console.error('[Git] Failed to delete GitHub repo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * List all BotLink repos in org
   */
  static async listBotLinkRepos(): Promise<{ success: boolean; repos?: Array<{ name: string; url: string }>; error?: string }> {
    if (!GITHUB_TOKEN) {
      return { success: false, error: 'GITHUB_TOKEN not configured' };
    }

    if (!GITHUB_ORG) {
      return { success: false, error: 'GITHUB_ORG not configured' };
    }

    if (!REPO_PREFIX) {
      return { success: false, error: 'GITHUB_PREFIX not configured' };
    }

    try {
      const response = await fetch(`https://api.github.com/orgs/${GITHUB_ORG}/repos?per_page=100&type=all`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const allRepos = await response.json() as Array<{ name: string; html_url: string }>;

      // Filter only BotLink repos
      const botlinkRepos = allRepos
        .filter(repo => repo.name.startsWith(REPO_PREFIX))
        .map(repo => ({ name: repo.name, url: repo.html_url }));

      return { success: true, repos: botlinkRepos };
    } catch (error) {
      console.error('[Git] Failed to list repos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
