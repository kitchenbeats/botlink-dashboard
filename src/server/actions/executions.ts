"use server";

import { createClient } from "@/lib/clients/supabase/server";
import { getTeamId } from "@/lib/auth/get-team-id";
import type { InsertExecution, BuilderType, Execution } from "@/lib/types/database";
import { startWorkflowExecution, resumeWorkflowExecution } from "@/lib/services/workflow-orchestrator";
import { getExecution } from "@/lib/db/executions";

interface ActionResult {
	success: boolean;
	error?: string;
	id?: string;
}

export async function createDraftExecutionAction(
	builderType: BuilderType
): Promise<ActionResult> {
	try {
		const teamId = await getTeamId();
		if (!teamId) {
			return { success: false, error: "Not authenticated" };
		}

		const supabase = await createClient();
		const insertData: InsertExecution = {
			team_id: teamId,
			workflow_id: null,
			status: "draft",
			input: "",
			output: null,
			builder_type: builderType,
			channel_id: null,
			inngest_run_id: null,
		};

		const { data: execution, error } = await supabase
			.from("executions")
			.insert(insertData as never)
			.select()
			.single();

		if (error) throw error;

		return { success: true, id: (execution as { id: string }).id };
	} catch (error) {
		console.error("[createDraftExecutionAction] Error:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to create execution",
		};
	}
}

export async function runExecutionAction(id: string): Promise<ActionResult> {
	try {
		const teamId = await getTeamId();
		if (!teamId) {
			return { success: false, error: "Not authenticated" };
		}

		const supabase = await createClient();
		const { error } = await supabase
			.from("executions")
			.update({ status: "running" } as never)
			.eq("id", id)
			.eq("team_id", teamId);

		if (error) throw error;

		return { success: true };
	} catch (error) {
		console.error("[runExecutionAction] Error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to run execution",
		};
	}
}

export async function resumeExecutionAction(id: string): Promise<ActionResult> {
	try {
		const teamId = await getTeamId();
		if (!teamId) {
			return { success: false, error: "Not authenticated" };
		}

		const supabase = await createClient();
		const { error } = await supabase
			.from("executions")
			.update({ status: "running" } as never)
			.eq("id", id)
			.eq("team_id", teamId);

		if (error) throw error;

		return { success: true };
	} catch (error) {
		console.error("[resumeExecutionAction] Error:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to resume execution",
		};
	}
}

export async function submitInstructionAction(
	id: string,
	input: string,
	context: string
): Promise<ActionResult> {
	try {
		const teamId = await getTeamId();
		if (!teamId) {
			return { success: false, error: "Not authenticated" };
		}

		const supabase = await createClient();
		const { error } = await supabase
			.from("executions")
			.update({
				input,
				status: "running",
			} as never)
			.eq("id", id)
			.eq("team_id", teamId);

		if (error) throw error;

		return { success: true };
	} catch (error) {
		console.error("[submitInstructionAction] Error:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to submit instruction",
		};
	}
}

export async function deleteExecutionAction(id: string): Promise<ActionResult> {
	try {
		const teamId = await getTeamId();
		if (!teamId) {
			return { success: false, error: "Not authenticated" };
		}

		const supabase = await createClient();
		const { error } = await supabase
			.from("executions")
			.delete()
			.eq("id", id)
			.eq("team_id", teamId);

		if (error) throw error;

		return { success: true };
	} catch (error) {
		console.error("[deleteExecutionAction] Error:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to delete execution",
		};
	}
}

/**
 * Start a new workflow execution with orchestration
 * This creates the execution, then runs the WorkflowOrchestrator
 * Phase 1: Task Planner → Logic Checker → Orchestrator → Creates specialized agents → PAUSE for approval
 */
export async function startWorkflowExecutionAction(
	projectId: string,
	userInput: string
): Promise<ActionResult> {
	try {
		const teamId = await getTeamId();
		if (!teamId) {
			return { success: false, error: "Not authenticated" };
		}

		// Create execution record
		const supabase = await createClient();
		const insertData = {
			team_id: teamId,
			workflow_id: null,
			status: "pending" as const,
			input: userInput,
			output: null,
			builder_type: null, // Not a project builder
			channel_id: projectId, // Use projectId as channel for scoping
			inngest_run_id: null,
		};

		const { data: execution, error } = await supabase
			.from("executions")
			.insert(insertData as never)
			.select()
			.single();

		if (error) throw error;
		const exec = execution as unknown as Execution;

		// Start orchestration in background (non-blocking)
		startWorkflowExecution(teamId, exec).catch((err) => {
			console.error("[startWorkflowExecutionAction] Orchestration error:", err);
		});

		return { success: true, id: exec.id };
	} catch (error) {
		console.error("[startWorkflowExecutionAction] Error:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to start workflow execution",
		};
	}
}

/**
 * Resume a paused workflow execution
 * Phase 2: Execute tasks with specialized agents in parallel respecting dependencies
 */
export async function resumeWorkflowExecutionAction(
	executionId: string
): Promise<ActionResult> {
	try {
		const teamId = await getTeamId();
		if (!teamId) {
			return { success: false, error: "Not authenticated" };
		}

		// Get execution
		const execution = await getExecution(executionId);
		if (!execution) {
			return { success: false, error: "Execution not found" };
		}

		if (execution.team_id !== teamId) {
			return { success: false, error: "Unauthorized" };
		}

		if (execution.status !== "paused") {
			return {
				success: false,
				error: `Cannot resume execution with status: ${execution.status}`,
			};
		}

		// Resume orchestration in background (non-blocking)
		resumeWorkflowExecution(teamId, execution as Execution).catch((err) => {
			console.error("[resumeWorkflowExecutionAction] Resume error:", err);
		});

		return { success: true };
	} catch (error) {
		console.error("[resumeWorkflowExecutionAction] Error:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to resume workflow execution",
		};
	}
}
