/**
 * Dynamic Agent Loader
 * Loads specialized agents from database and creates Agent-Kit agents
 * Follows the same pattern as coding-agent.ts
 */

import {
  anthropic,
  createAgent,
  createNetwork,
  openai,
} from '@inngest/agent-kit'
import type { Sandbox } from 'e2b'
import { getAgentTools } from '../tools/sandbox-tools'
import type { Agent } from '../types'
import {
  CODE_FEEDBACK_PROMPT,
  LOGIC_CHECKER_PROMPT,
  ORCHESTRATOR_PROMPT,
  TASK_PLANNER_PROMPT,
} from './system-prompts'
import {
  createSpecializedAgentsTool,
  generatePlanTool,
  reviewCodeTool,
  validateWorkTool,
} from '../tools/orchestrator-tools'

/**
 * Load specialized agents for an execution and create Agent-Kit agents
 */
export async function loadSpecializedAgents(
  executionId: string,
  sandbox: Sandbox
) {
  console.log(
    '[Dynamic Agent Loader] Loading specialized agents for execution:',
    executionId
  )

  // Import here to avoid circular dependency
  const { getAgentsByExecution } = await import('../db/agents')

  // Get all agents for this execution from database
  const dbAgents = await getAgentsByExecution(executionId)

  if (!dbAgents || dbAgents.length === 0) {
    throw new Error(`No specialized agents found for execution ${executionId}`)
  }

  console.log(
    '[Dynamic Agent Loader] Found',
    dbAgents.length,
    'specialized agents'
  )

  // Create Agent-Kit agents from database specs
  const agentKitAgents = dbAgents.map((dbAgent) => {
    const config = (dbAgent.config || {}) as Record<string, unknown>
    const toolNames = (config.tools as string[]) || [
      'file_operations',
      'terminal',
      'search',
    ]

    // Get model provider
    const modelProvider = getModelProvider(dbAgent.model)

    // Get tools for this agent - ALWAYS include at least one tool for structured output
    const tools = getAgentTools(sandbox, toolNames)

    // IMPORTANT: Ensure every agent has at least one tool for structured output
    if (tools.length === 0) {
      console.warn(
        '[Dynamic Agent Loader] Agent has no tools, adding default tools:',
        dbAgent.name
      )
      tools.push(...getAgentTools(sandbox, ['file_operations']))
    }

    console.log(
      '[Dynamic Agent Loader] Creating agent:',
      dbAgent.name,
      'with',
      tools.length,
      'tools'
    )

    // Create Agent-Kit agent with tools to guarantee structured output
    return createAgent({
      name: dbAgent.name,
      description: `${dbAgent.type}: ${(config.skills as string[])?.join(', ') || 'Specialized agent'}`,
      system: dbAgent.system_prompt,
      model: modelProvider,
      tools, // Tools are required for structured, reliable output
    })
  })

  console.log(
    '[Dynamic Agent Loader] Created',
    agentKitAgents.length,
    'Agent-Kit agents'
  )

  return {
    agents: agentKitAgents,
    dbAgents, // Keep reference to DB agents for task assignment
  }
}

/**
 * Get model provider configuration
 * Follows the same pattern as coding-agent.ts
 */
function getModelProvider(modelId: string) {
  // Check if it's an Anthropic model
  if (modelId.startsWith('claude')) {
    return anthropic({
      model: modelId,
      defaultParameters: {
        max_tokens: 8192,
      },
    })
  }

  // Check if it's an OpenAI model
  if (modelId.startsWith('gpt')) {
    return openai({
      model: modelId,
      defaultParameters: {
        // OpenAI parameters
      },
    })
  }

  // Default to Claude Sonnet
  return anthropic({
    model: 'claude-sonnet-4-5-20250929',
    defaultParameters: {
      max_tokens: 8192,
    },
  })
}

/**
 * Create review agents (Code Feedback + Logic Checker)
 */
export function createReviewAgents() {
  const codeFeedbackAgent = createAgent({
    name: 'Code Feedback Agent',
    description: 'Expert senior developer conducting code reviews',
    system: CODE_FEEDBACK_PROMPT,
    model: anthropic({
      model: 'claude-sonnet-4-5-20250929',
      defaultParameters: { max_tokens: 8192 },
    }),
    tools: [reviewCodeTool],
  })

  const logicCheckerAgent = createAgent({
    name: 'Logic Checker',
    description: 'Validation agent ensuring quality and completion',
    system: LOGIC_CHECKER_PROMPT,
    model: anthropic({
      model: 'claude-sonnet-4-5-20250929',
      defaultParameters: { max_tokens: 8192 },
    }),
    tools: [validateWorkTool],
  })

  return {
    codeFeedbackAgent,
    logicCheckerAgent,
  }
}

/**
 * Get agent by name from loaded agents
 */
export function getAgentByName(agents: ReturnType<typeof createAgent>[], name: string) {
  return agents.find((agent) => agent.name === name)
}

/**
 * Load planning agents (Planner, Logic Checker, Orchestrator)
 */
export function createPlanningAgents(teamId: string, executionId: string) {
  const plannerAgent = createAgent({
    name: 'Task Planner',
    description: 'Expert at breaking down requirements into actionable tasks',
    system: TASK_PLANNER_PROMPT,
    model: anthropic({
      model: 'claude-sonnet-4-5-20250929',
      defaultParameters: { max_tokens: 8192 },
    }),
    tools: [generatePlanTool],
  })

  const logicCheckerAgent = createAgent({
    name: 'Logic Checker (Planning)',
    description: 'Validates the task plan',
    system: LOGIC_CHECKER_PROMPT,
    model: anthropic({
      model: 'claude-sonnet-4-5-20250929',
      defaultParameters: { max_tokens: 8192 },
    }),
    tools: [validateWorkTool],
  })

  const orchestratorAgent = createAgent({
    name: 'Orchestrator',
    description: 'Creates specialized agents for the project',
    system: ORCHESTRATOR_PROMPT,
    model: anthropic({
      model: 'claude-sonnet-4-5-20250929',
      defaultParameters: { max_tokens: 8192 },
    }),
    tools: [createSpecializedAgentsTool(teamId, executionId)],
  })

  return {
    plannerAgent,
    logicCheckerAgent,
    orchestratorAgent,
  }
}
