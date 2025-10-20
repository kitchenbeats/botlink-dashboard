"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/clients/supabase/server";
import {
	createProject,
	getProject,
	listProjects,
	updateProject,
	deleteProject,
	getProjectWithFiles,
} from "@/lib/db/projects";
import { createFile } from "@/lib/db/files";
import type { InsertProject, ProjectTemplate } from "@/lib/types/database";
import { getE2BTemplateId } from "@/configs/templates";

interface CreateProjectResult {
	success: boolean;
	error?: string;
	projectId?: string;
}

/**
 * Create a new project with initial template files
 * For simple_site, nextjs, and nextjs_saas: creates project with E2B template reference
 * Files will be copied from E2B template when sandbox is created
 */
export async function createNewProject(
	teamId: string,
	name: string,
	template: ProjectTemplate,
	description?: string
): Promise<CreateProjectResult> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return { success: false, error: "Not authenticated" };
		}

		// Create project
		const projectData: InsertProject = {
			team_id: teamId,
			name,
			template,
			description: description || null,
			settings: {
				template,
				initialized: true,
				e2b_template: getE2BTemplateId(template), // Store E2B template ID
			} as never,
		};

		const project = await createProject(projectData as never);

		// Create a README placeholder
		// Actual template files will be copied from E2B template when workspace sandbox is created
		await createFile({
			project_id: project.id,
			path: "README.md",
			content: `# ${name}\n\nInitializing from template...\n\nYour project will be ready in the workspace.`,
			language: "markdown",
			created_by: "user",
		});

		// NOTE: Workspace initialization happens when user clicks "Run Project"
		// or during project creation flow via runProject() call

		// Create GitHub repo for backup (async, don't block project creation)
		const { GitService } = await import("@/lib/services/git-service");
		GitService.createGitHubRepo(project.id, teamId, template, name)
			.then((result) => {
				if (result.success) {
					console.log("[createNewProject] Created GitHub repo:", result.repoUrl);
				}
			})
			.catch((error) => {
				console.error("[createNewProject] Failed to create GitHub repo:", error);
				// Don't block project creation if GitHub fails
			});

		revalidatePath("/dashboard");
		return { success: true, projectId: project.id };
	} catch (error) {
		console.error("[createNewProject] Error:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to create project",
		};
	}
}

// Template mapping moved to centralized config: @/configs/templates

/**
 * Get project with all files
 */
export async function getProjectData(projectId: string) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("Not authenticated");
		}

		return await getProjectWithFiles(projectId);
	} catch (error) {
		console.error("[getProjectData] Error:", error);
		throw error;
	}
}

/**
 * Get all projects for a team
 */
export async function getTeamProjects(teamId: string) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("Not authenticated");
		}

		return await listProjects(teamId);
	} catch (error) {
		console.error("[getTeamProjects] Error:", error);
		throw error;
	}
}

/**
 * Update project metadata
 */
export async function updateProjectMetadata(
	projectId: string,
	updates: { name?: string; description?: string }
) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("Not authenticated");
		}

		const updated = await updateProject(projectId, updates);
		revalidatePath(`/workspace/${projectId}`);
		revalidatePath("/dashboard");
		return updated;
	} catch (error) {
		console.error("[updateProjectMetadata] Error:", error);
		throw error;
	}
}

/**
 * Delete a project
 */
export async function deleteProjectAction(projectId: string) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("Not authenticated");
		}

		// Kill ALL E2B sandboxes for this project (not just active one)
		const { getAllProjectSandboxes } = await import("@/lib/db/sandboxes");
		const { Sandbox } = await import("e2b");
		const { TeamApiKeyService } = await import("@/lib/services/team-api-key-service");

		const project = await getProject(projectId);
		if (project) {
			const allSandboxes = await getAllProjectSandboxes(projectId);
			const teamApiKey = await TeamApiKeyService.getTeamApiKey(project.team_id, supabase);
			const E2B_DOMAIN = process.env.E2B_DOMAIN;

			// Kill all sandboxes in parallel
			const killPromises = allSandboxes.map(async (sandbox) => {
				if (!sandbox.e2b_session_id) return;
				try {
					const e2bSandbox = await Sandbox.connect(sandbox.e2b_session_id, {
						apiKey: teamApiKey,
						...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
					});
					await e2bSandbox.kill();
					console.log("[deleteProjectAction] Killed E2B sandbox:", sandbox.e2b_session_id);
				} catch (error) {
					console.error("[deleteProjectAction] Failed to kill sandbox:", sandbox.e2b_session_id, error);
					// Continue even if one fails
				}
			});

			await Promise.allSettled(killPromises);
			console.log(`[deleteProjectAction] Cleaned up ${allSandboxes.length} sandbox(es)`);
		}

		// Delete the project from database (CASCADE will delete sandbox_sessions, files, messages)
		await deleteProject(projectId);

		// Delete the GitHub repo (async, don't block on failure)
		const { GitService } = await import("@/lib/services/git-service");
		GitService.deleteGitHubRepo(projectId).catch((error) => {
			console.error("[deleteProjectAction] Failed to delete GitHub repo:", error);
			// Don't throw - project is already deleted from DB
		});

		revalidatePath("/dashboard");
	} catch (error) {
		console.error("[deleteProjectAction] Error:", error);
		throw error;
	}
}

/**
 * Open project (updates last_opened_at)
 */
export async function openProject(projectId: string) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("Not authenticated");
		}

		await updateProject(projectId, {
			last_opened_at: new Date().toISOString(),
		});

		redirect(`/workspace/${projectId}`);
	} catch (error) {
		console.error("[openProject] Error:", error);
		throw error;
	}
}

/**
 * Initialize project workspace - Start sandbox and wait until ready
 * Returns success/error without redirecting (for use in client components)
 */
export async function initializeProject(projectId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return { success: false, error: "Not authenticated" };
		}

		console.log("[initializeProject] Starting project:", projectId);

		// Initialize workspace (creates sandbox, starts dev server)
		const { initializeWorkspaceFiles } = await import("./workspace");
		const result = await initializeWorkspaceFiles(projectId);

		if (!result.success) {
			return { success: false, error: "Failed to start project" };
		}

		console.log("[initializeProject] Project started successfully:", projectId);
		return { success: true };
	} catch (error) {
		console.error("[initializeProject] Error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to initialize project",
		};
	}
}

/**
 * Run project - Start sandbox and initialize workspace
 * Blocks until sandbox is ready, then redirects to workspace
 */
export async function runProject(projectId: string) {
	const result = await initializeProject(projectId);

	if (!result.success) {
		throw new Error(result.error || "Failed to start project");
	}

	// Redirect to workspace
	redirect(`/workspace/${projectId}`);
}

/**
 * Stop project - Save snapshot and pause sandbox
 * Returns immediately, snapshot happens in background
 */
export async function stopProject(projectId: string) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("Not authenticated");
		}

		console.log("[stopProject] Stopping project:", projectId);

		const { getProject } = await import("@/lib/db/projects");
		const { getActiveSandbox, updateSandbox } = await import("@/lib/db/sandboxes");
		const { Sandbox } = await import("e2b");
		const { TeamApiKeyService } = await import("@/lib/services/team-api-key-service");
		const { SnapshotService } = await import("@/lib/services/snapshot-service");

		// Get project and sandbox
		const project = await getProject(projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		const sandboxSession = await getActiveSandbox(projectId);
		if (!sandboxSession?.e2b_session_id) {
			// Already stopped
			console.log("[stopProject] No active sandbox, already stopped");
			return { success: true, message: "Project already stopped" };
		}

		// Get API key
		const teamApiKey = await TeamApiKeyService.getTeamApiKey(project.team_id, supabase);
		const E2B_DOMAIN = process.env.E2B_DOMAIN;

		// Connect to sandbox
		const sandbox = await Sandbox.connect(sandboxSession.e2b_session_id, {
			apiKey: teamApiKey,
			...(E2B_DOMAIN && { domain: E2B_DOMAIN }),
		});

		// Mark sandbox as stopped immediately (UI update)
		await updateSandbox(sandboxSession.id, {
			status: "stopped",
		});

		console.log("[stopProject] Sandbox marked as stopped, starting background snapshot...");

		// Create snapshot and kill sandbox in background (non-blocking)
		SnapshotService.createSnapshot(sandbox, projectId, 'Auto-saved before stop', teamApiKey)
			.then((snapshotId: string) => {
				console.log("[stopProject] Snapshot created:", snapshotId);
			})
			.catch((error: Error) => {
				console.error("[stopProject] Snapshot error:", error);
			})
			.finally(async () => {
				// Kill sandbox after snapshot attempt
				try {
					await sandbox.kill();
					console.log("[stopProject] Sandbox killed:", sandboxSession.e2b_session_id);
				} catch (error) {
					console.error("[stopProject] Failed to kill sandbox:", error);
				}
			});

		revalidatePath(`/workspace/${projectId}`);
		revalidatePath("/dashboard");

		return { success: true, message: "Project stopped" };
	} catch (error) {
		console.error("[stopProject] Error:", error);
		throw error;
	}
}

// ============================================================================
// TEMPLATE HELPERS
// ============================================================================
// Note: Template files are now pre-installed in E2B templates
// This function is no longer used for simple_site, nextjs, and nextjs_saas
