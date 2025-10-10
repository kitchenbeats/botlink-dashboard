"use server";

import { createClient } from "@/lib/supabase/server";
import { getTeamId } from "@/lib/auth/get-team-id";
import type { InsertExecution, BuilderType } from "@/lib/types/database";

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
		};

		const { data: execution, error } = await supabase
			.from("executions")
			.insert(insertData)
			.select()
			.single();

		if (error) throw error;

		return { success: true, id: execution.id };
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
			.update({ status: "running" })
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
			.update({ status: "running" })
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
			})
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
