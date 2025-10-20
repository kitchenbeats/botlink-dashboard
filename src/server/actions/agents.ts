"use server";

import { createClient } from "@/lib/clients/supabase/server";
import { getTeamId } from "@/lib/auth/get-team-id";
import type { InsertAgent, UpdateAgent } from "@/lib/types/database";

interface ActionResult {
	success: boolean;
	error?: string;
	id?: string;
}

export async function createAgentAction(data: {
	name: string;
	type: string;
	model: string;
	system_prompt: string;
	config: {
		temperature: number;
		max_tokens: number;
	};
}): Promise<ActionResult> {
	try {
		const teamId = await getTeamId();
		if (!teamId) {
			return { success: false, error: "Not authenticated" };
		}

		const supabase = await createClient();
		const insertData: InsertAgent = {
			team_id: teamId,
			name: data.name,
			type: data.type as 'planner' | 'executor' | 'reviewer' | 'custom' | 'orchestrator' | 'logic_checker' | 'generic',
			model: data.model,
			system_prompt: data.system_prompt,
			config: data.config,
		};

		const { data: agent, error } = await supabase
			.from("agents")
			.insert(insertData as never)
			.select()
			.single();

		if (error) throw error;

		return { success: true, id: (agent as { id: string }).id };
	} catch (error) {
		console.error("[createAgentAction] Error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to create agent",
		};
	}
}

export async function updateAgentAction(
	id: string,
	data: {
		name: string;
		type: string;
		model: string;
		system_prompt: string;
		config: {
			temperature: number;
			max_tokens: number;
		};
	}
): Promise<ActionResult> {
	try {
		const teamId = await getTeamId();
		if (!teamId) {
			return { success: false, error: "Not authenticated" };
		}

		const supabase = await createClient();
		const updateData: UpdateAgent = {
			name: data.name,
			type: data.type as 'planner' | 'executor' | 'reviewer' | 'custom' | 'orchestrator' | 'logic_checker' | 'generic',
			model: data.model,
			system_prompt: data.system_prompt,
			config: data.config,
		};

		const { error } = await supabase
			.from("agents")
			.update({ ...updateData, updated_at: new Date().toISOString() } as never)
			.eq("id", id)
			.eq("team_id", teamId);

		if (error) throw error;

		return { success: true };
	} catch (error) {
		console.error("[updateAgentAction] Error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to update agent",
		};
	}
}

export async function deleteAgent(id: string): Promise<ActionResult> {
	return deleteAgentAction(id);
}

export async function deleteAgentAction(id: string): Promise<ActionResult> {
	try {
		const teamId = await getTeamId();
		if (!teamId) {
			return { success: false, error: "Not authenticated" };
		}

		const supabase = await createClient();
		const { error } = await supabase
			.from("agents")
			.delete()
			.eq("id", id)
			.eq("team_id", teamId);

		if (error) throw error;

		return { success: true };
	} catch (error) {
		console.error("[deleteAgentAction] Error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to delete agent",
		};
	}
}
