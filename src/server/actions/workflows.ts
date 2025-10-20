"use server";

import { createClient } from "@/lib/clients/supabase/server";
import { getTeamId } from "@/lib/auth/get-team-id";
import type { InsertWorkflow, UpdateWorkflow, WorkflowNode, WorkflowEdge } from "@/lib/types/database";

interface ActionResult {
	success: boolean;
	error?: string;
	id?: string;
}

export async function createWorkflowAction(data: {
	name: string;
	description: string | null;
	nodes: WorkflowNode[];
	edges: WorkflowEdge[];
}): Promise<ActionResult> {
	try {
		const teamId = await getTeamId();
		if (!teamId) {
			return { success: false, error: "Not authenticated" };
		}

		const supabase = await createClient();
		const insertData: InsertWorkflow = {
			team_id: teamId,
			name: data.name,
			description: data.description,
			nodes: data.nodes,
			edges: data.edges,
		};

		const { data: workflow, error } = await supabase
			.from("workflows")
			.insert(insertData as never)
			.select()
			.single();

		if (error) throw error;

		return { success: true, id: (workflow as { id: string }).id };
	} catch (error) {
		console.error("[createWorkflowAction] Error:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to create workflow",
		};
	}
}

export async function updateWorkflowAction(
	id: string,
	data: {
		name: string;
		description: string | null;
		nodes: WorkflowNode[];
		edges: WorkflowEdge[];
	}
): Promise<ActionResult> {
	try {
		const teamId = await getTeamId();
		if (!teamId) {
			return { success: false, error: "Not authenticated" };
		}

		const supabase = await createClient();
		const updateData: UpdateWorkflow = {
			name: data.name,
			description: data.description,
			nodes: data.nodes,
			edges: data.edges,
		};

		const { error } = await supabase
			.from("workflows")
			.update({ ...updateData, updated_at: new Date().toISOString() } as never)
			.eq("id", id)
			.eq("team_id", teamId);

		if (error) throw error;

		return { success: true };
	} catch (error) {
		console.error("[updateWorkflowAction] Error:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to update workflow",
		};
	}
}

export async function deleteWorkflowAction(id: string): Promise<ActionResult> {
	try {
		const teamId = await getTeamId();
		if (!teamId) {
			return { success: false, error: "Not authenticated" };
		}

		const supabase = await createClient();
		const { error } = await supabase
			.from("workflows")
			.delete()
			.eq("id", id)
			.eq("team_id", teamId);

		if (error) throw error;

		return { success: true };
	} catch (error) {
		console.error("[deleteWorkflowAction] Error:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to delete workflow",
		};
	}
}
