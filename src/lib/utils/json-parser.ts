import type { TaskPlannerOutput, OrchestratorOutput, LogicCheckResult } from '@/lib/types';

function stripMarkdownCodeBlocks(text: string): string {
  // Remove ```json and ``` markers
  return text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
}

export function parseTaskPlannerOutput(output: string): TaskPlannerOutput {
  try {
    const cleaned = stripMarkdownCodeBlocks(output);
    const parsed = JSON.parse(cleaned);

    // Validate structure
    if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
      throw new Error('Invalid plan structure: missing tasks array');
    }

    if (!parsed.overall_strategy || typeof parsed.overall_strategy !== 'string') {
      throw new Error('Invalid plan structure: missing overall_strategy');
    }

    // Validate each task
    for (const task of parsed.tasks) {
      if (!task.title || typeof task.title !== 'string') {
        throw new Error('Invalid task: missing title');
      }
      if (!task.description || typeof task.description !== 'string') {
        throw new Error('Invalid task: missing description');
      }
      if (!['low', 'medium', 'high'].includes(task.estimated_complexity)) {
        throw new Error('Invalid task: invalid estimated_complexity');
      }
    }

    return parsed as TaskPlannerOutput;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse Task Planner output: ${message}`);
  }
}

export function parseOrchestratorOutput(output: string): OrchestratorOutput {
  try {
    const cleaned = stripMarkdownCodeBlocks(output);
    const parsed = JSON.parse(cleaned);

    // Validate structure
    if (!parsed.agents || !Array.isArray(parsed.agents)) {
      throw new Error('Invalid orchestrator structure: missing agents array');
    }

    if (!parsed.task_assignments || !Array.isArray(parsed.task_assignments)) {
      throw new Error('Invalid orchestrator structure: missing task_assignments');
    }

    // Validate each agent
    for (const agent of parsed.agents) {
      if (!agent.name || typeof agent.name !== 'string') {
        throw new Error('Invalid agent: missing name');
      }
      if (!agent.system_prompt || typeof agent.system_prompt !== 'string') {
        throw new Error('Invalid agent: missing system_prompt');
      }
      if (!agent.user_prompt_template || typeof agent.user_prompt_template !== 'string') {
        throw new Error('Invalid agent: missing user_prompt_template');
      }
      if (!agent.model || typeof agent.model !== 'string') {
        throw new Error('Invalid agent: missing model');
      }
      if (!agent.config || typeof agent.config !== 'object') {
        throw new Error('Invalid agent: missing config');
      }
    }

    // Validate task assignments
    for (const assignment of parsed.task_assignments) {
      if (typeof assignment.task_index !== 'number') {
        throw new Error('Invalid assignment: missing task_index');
      }
      if (typeof assignment.agent_index !== 'number') {
        throw new Error('Invalid assignment: missing agent_index');
      }
    }

    return parsed as OrchestratorOutput;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse Orchestrator output: ${message}`);
  }
}

export function parseLogicCheckResult(output: string): LogicCheckResult {
  try {
    const cleaned = stripMarkdownCodeBlocks(output);
    const parsed = JSON.parse(cleaned);

    // Validate structure
    if (typeof parsed.passed !== 'boolean') {
      throw new Error('Invalid logic check: missing or invalid passed field');
    }

    if (!parsed.feedback || typeof parsed.feedback !== 'string') {
      throw new Error('Invalid logic check: missing feedback');
    }

    return parsed as LogicCheckResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse Logic Check result: ${message}`);
  }
}

export function safeJSONParse<T = unknown>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
