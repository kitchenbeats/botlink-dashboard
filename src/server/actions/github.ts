'use server';

import { authActionClient } from '@/lib/clients/action';
import { z } from 'zod';
import { ActionError } from '@/lib/utils/action';
import { getProject, updateProject } from '@/lib/db/projects';
import { getSandboxByProjectId } from '@/lib/db/sandboxes';
import { E2BService } from '@/lib/services/e2b-service';
import { GitService } from '@/lib/services/git-service';
import { TeamApiKeyService } from '@/lib/services/team-api-key-service';

const connectGitHubSchema = z.object({
  projectId: z.string().uuid(),
});

/**
 * Connect project to GitHub (one-click setup)
 * - Creates GitHub repo
 * - Pushes current code
 * - Updates project with repo URL
 */
export const connectProjectToGitHub = authActionClient
  .schema(connectGitHubSchema)
  .metadata({ actionName: 'connectProjectToGitHub' })
  .action(async ({ parsedInput, ctx }) => {
    const { projectId } = parsedInput;
    const { supabase } = ctx;

    // Get project
    const project = await getProject(projectId);
    if (!project) {
      throw new ActionError('Project not found');
    }

    // Check if already connected
    if (project.github_repo_url) {
      return {
        success: true,
        alreadyConnected: true,
        repoUrl: project.github_repo_url,
        message: 'Project already connected to GitHub'
      };
    }

    // Get active sandbox and connect
    const result = await E2BService.getSandbox(projectId, supabase);
    if (!result) {
      throw new ActionError('No active workspace found. Please open the workspace first.');
    }
    const e2bSandbox = result.sandbox;

    // Get working directory
    const workDir = E2BService.getTemplateWorkDir(project.template);

    // Create GitHub repo (auto-creates on first push)
    const createResult = await GitService.createGitHubRepo(
      projectId,
      project.team_id,
      project.template,
      project.name
    );

    if (!createResult.success || !createResult.repoUrl) {
      throw new ActionError(
        createResult.error || 'Failed to set up GitHub repository'
      );
    }

    // Push to GitHub
    const pushResult = await GitService.pushToGitHub(
      e2bSandbox,
      workDir,
      projectId
    );

    if (!pushResult.success) {
      throw new ActionError(
        pushResult.error || 'Failed to push code to GitHub'
      );
    }

    // Get latest commit hash
    const commitHash = await GitService.getCurrentCommit(e2bSandbox, workDir);

    // Update project with GitHub URL
    await updateProject(projectId, {
      github_repo_url: createResult.repoUrl,
      last_commit_hash: commitHash || undefined,
    });

    return {
      success: true,
      repoUrl: createResult.repoUrl,
      message: 'Successfully connected to GitHub!'
    };
  });

const pushToGitHubSchema = z.object({
  projectId: z.string().uuid(),
});

/**
 * Push latest changes to GitHub
 */
export const pushProjectToGitHub = authActionClient
  .schema(pushToGitHubSchema)
  .metadata({ actionName: 'pushProjectToGitHub' })
  .action(async ({ parsedInput, ctx }) => {
    const { projectId } = parsedInput;
    const { supabase } = ctx;

    // Get project
    const project = await getProject(projectId);
    if (!project) {
      throw new ActionError('Project not found');
    }

    // Check if connected to GitHub
    if (!project.github_repo_url) {
      throw new ActionError('Project not connected to GitHub. Please connect first.');
    }

    // Get active sandbox and connect
    const result = await E2BService.getSandbox(projectId, supabase);
    if (!result) {
      throw new ActionError('No active workspace found. Please open the workspace first.');
    }
    const e2bSandbox = result.sandbox;

    // Get working directory
    const workDir = E2BService.getTemplateWorkDir(project.template);

    // Push to GitHub
    const pushResult = await GitService.pushToGitHub(
      e2bSandbox,
      workDir,
      projectId
    );

    if (!pushResult.success) {
      throw new ActionError(
        pushResult.error || 'Failed to push to GitHub'
      );
    }

    // Get latest commit hash
    const commitHash = await GitService.getCurrentCommit(e2bSandbox, workDir);

    // Update last commit hash
    await updateProject(projectId, {
      last_commit_hash: commitHash || undefined,
    });

    return {
      success: true,
      message: 'Successfully pushed to GitHub!'
    };
  });

const disconnectGitHubSchema = z.object({
  projectId: z.string().uuid(),
});

/**
 * Disconnect project from GitHub (remove link, don't delete repo)
 */
export const disconnectProjectFromGitHub = authActionClient
  .schema(disconnectGitHubSchema)
  .metadata({ actionName: 'disconnectProjectFromGitHub' })
  .action(async ({ parsedInput }) => {
    const { projectId } = parsedInput;

    // Get project
    const project = await getProject(projectId);
    if (!project) {
      throw new ActionError('Project not found');
    }

    // Update project to remove GitHub URL
    await updateProject(projectId, {
      github_repo_url: null,
      last_commit_hash: null,
    });

    return {
      success: true,
      message: 'Disconnected from GitHub (repository preserved)'
    };
  });

const getGitHubStatusSchema = z.object({
  projectId: z.string().uuid(),
});

/**
 * Get GitHub connection status and sync info
 */
export const getGitHubStatus = authActionClient
  .schema(getGitHubStatusSchema)
  .metadata({ actionName: 'getGitHubStatus' })
  .action(async ({ parsedInput }) => {
    const { projectId } = parsedInput;

    // Get project
    const project = await getProject(projectId);
    if (!project) {
      throw new ActionError('Project not found');
    }

    return {
      connected: !!project.github_repo_url,
      repoUrl: project.github_repo_url,
      lastCommitHash: project.last_commit_hash,
    };
  });
