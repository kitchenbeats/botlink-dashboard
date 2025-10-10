import { getSystemAgentById, type SystemAgent } from "./system-agents";
import { getAgentById } from "@/lib/db";
import type { Agent, Task } from "@/lib/types";

export async function getAgentForTask(
	task: Task
): Promise<Agent | SystemAgent> {
	if (task.system_agent_id) {
		const systemAgent = getSystemAgentById(task.system_agent_id);
		if (!systemAgent) {
			throw new Error(`System agent not found: ${task.system_agent_id}`);
		}
		return systemAgent;
	}

	if (task.agent_id) {
		const agent = await getAgentById(task.agent_id, task.team_id);
		if (!agent) {
			throw new Error(`Agent not found: ${task.agent_id}`);
		}
		return agent;
	}

	throw new Error("Task has no agent_id or system_agent_id");
}
