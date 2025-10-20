import { createAgent } from '@/lib/db/agents'
import { updateExecution } from '@/lib/db/executions'
import { createTask, createTasks, listTasks, updateTask } from '@/lib/db/tasks'
import { createWorkflow } from '@/lib/db/workflows'
import type {
  Agent,
  Execution,
  LogicCheckResult,
  Task,
  TaskPlannerOutput,
} from '@/lib/types/database'
import type { Json, TablesInsert } from '@/types/database.types'
import {
  parseLogicCheckResult,
  parseOrchestratorOutput,
  parseTaskPlannerOutput,
  safeJSONParse,
} from '@/lib/utils/json-parser'
import { getDefaultAnthropicModel } from '@/lib/config/env'
import { executeAgentSDK } from './agent-executor-sdk'
import { executionEvents } from './event-emitter'
import { getSystemAgentById } from './system-agents-config'

export class WorkflowOrchestrator {
  private teamId: string
  private execution: Execution

  constructor(teamId: string, execution: Execution) {
    this.teamId = teamId
    this.execution = execution
  }

  async run(): Promise<void> {
    try {
      // Update execution status
      await updateExecution(this.execution.id, { status: 'running' })

      this.emitEvent('execution_update', {
        status: 'running',
        message: 'Starting workflow execution',
      })

      // Step 1: Get Task Planner agent
      const plannerAgent = this.getPlannerAgent()

      // Step 2: Create initial planning task
      const planningTask = await createTask({
        execution_id: this.execution.id,
        message_id: null,
        agent_id: null,
        title: 'Planning task execution',
        description: this.execution.input,
        input: this.execution.input,
        status: 'pending',
        type: 'run_command',
        metadata: { system_agent_id: plannerAgent.id },
        attempts: 0,
      })

      // Step 3: Execute planner
      this.emitEvent('agent_start', {
        agent: 'task-planner',
        message: 'Planning tasks...',
      })
      const planOutput = await executeAgentSDK(plannerAgent, planningTask as Task)
      this.emitEvent('agent_complete', {
        agent: 'task-planner',
        message: 'Task plan created',
      })

      // Step 4: Parse the plan
      const parsedPlan = this.parsePlan(planOutput)

      // Step 5: Validate plan with Logic Checker
      await this.validateWithLogicChecker(
        this.execution.input,
        planOutput,
        'plan'
      )

      await updateTask(planningTask.id, {
        status: 'completed',
        output: planOutput,
        completed_at: new Date().toISOString(),
      })

      // Step 6: Get Orchestrator agent
      const orchestratorAgent = this.getOrchestratorAgent()

      // Step 7: Create orchestrator task to generate specialized agents
      const orchestratorInput = JSON.stringify({
        original_request: this.execution.input,
        plan: parsedPlan,
      })

      const orchestratorTask = await createTask({
        execution_id: this.execution.id,
        message_id: null,
        agent_id: null,
        title: 'Orchestrating specialized agents',
        description: `Creating specialized agents for ${parsedPlan.tasks.length} tasks`,
        input: orchestratorInput,
        status: 'pending',
        type: 'run_command',
        metadata: { system_agent_id: orchestratorAgent.id },
        attempts: 0,
      })

      // Step 8: Execute orchestrator to create specialized agents
      this.emitEvent('agent_start', {
        agent: 'orchestrator',
        message: 'Creating specialized agents...',
      })
      const orchestratorOutput = await executeAgentSDK(
        orchestratorAgent,
        orchestratorTask as Task
      )
      const agentSpecs = this.parseOrchestratorOutput(orchestratorOutput)

      // Step 9: Create specialized agents in database
      const specializedAgents = await this.createSpecializedAgents(agentSpecs)
      this.emitEvent('agent_complete', {
        agent: 'orchestrator',
        message: `Created ${specializedAgents.length} specialized agents`,
      })

      await updateTask(orchestratorTask.id, {
        status: 'completed',
        output: JSON.stringify({
          agent_ids: specializedAgents.map((a) => a.id),
        }),
        completed_at: new Date().toISOString(),
      })

      // Step 10: Create workflow with nodes and edges
      this.emitEvent('execution_update', {
        message: 'Creating workflow visualization...',
      })
      const workflow = await this.createWorkflowFromPlan(
        parsedPlan,
        specializedAgents
      )

      // PAUSE HERE - Execution status set to 'paused' for human review
      await updateExecution(this.execution.id, {
        workflow_id: workflow.id,
        status: 'paused',
        output: JSON.stringify({
          plan: parsedPlan,
          specialized_agents: specializedAgents,
        }),
      })

      this.emitEvent('execution_update', {
        status: 'paused',
        message: 'Workflow created. Ready for review and execution.',
      })
    } catch (error) {
      await updateExecution(this.execution.id, {
        status: 'failed',
        output: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async resume(): Promise<void> {
    try {
      // Update execution status
      await updateExecution(this.execution.id, { status: 'running' })

      this.emitEvent('execution_update', {
        status: 'running',
        message: 'Resuming execution - running tasks...',
      })

      // Get the execution output to retrieve specialized agents
      const executionData = safeJSONParse<{
        plan?: TaskPlannerOutput
        specialized_agents?: Agent[]
      }>(this.execution.output || '{}', {})

      if (!executionData.plan || !executionData.specialized_agents) {
        throw new Error(
          'Invalid execution data: missing plan or specialized_agents'
        )
      }

      const plan = executionData.plan
      const specializedAgents = executionData.specialized_agents

      // Validate that we have the same number of tasks and agents
      if (plan.tasks.length !== specializedAgents.length) {
        throw new Error(
          `Task count mismatch: ${plan.tasks.length} tasks but ${specializedAgents.length} agents. ` +
            'Each task must have exactly one corresponding agent.'
        )
      }

      // Create tasks for each specialized agent
      const taskInserts = plan.tasks.map((task, index) => ({
        execution_id: this.execution.id,
        message_id: null,
        agent_id: specializedAgents[index]!.id, // Safe due to length check above
        title: task.title,
        description: task.description,
        input: task.description, // Use task description as input
        status: 'pending' as const,
        type: 'run_command' as const,
        metadata: {},
        attempts: 0,
      }))

      const tasks = await createTasks(taskInserts)

      // Execute tasks respecting dependencies (parallel when possible)
      await this.executeTasksWithDependencies(tasks as Task[], specializedAgents as Agent[], plan)

      // All tasks completed - mark execution as completed
      await updateExecution(this.execution.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        output: JSON.stringify({
          tasks: await listTasks(this.execution.id),
        }),
      })
    } catch (error) {
      await updateExecution(this.execution.id, {
        status: 'failed',
        output: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  private async executeTasksWithDependencies(
    tasks: Task[],
    agents: Agent[],
    plan: TaskPlannerOutput
  ): Promise<void> {
    const completedTasks = new Set<number>()
    const runningTasks = new Map<number, Promise<void>>()

    // Helper to check if all dependencies are met
    const areDependenciesMet = (taskIndex: number): boolean => {
      const dependencies = plan.tasks[taskIndex]?.dependencies || []
      return dependencies.every((depIndex) => completedTasks.has(depIndex))
    }

    // Helper to execute a single task
    const executeTask = async (taskIndex: number): Promise<void> => {
      const task = tasks[taskIndex]
      const agent = agents[taskIndex]
      if (!task || !agent)
        throw new Error(`Task or agent not found at index ${taskIndex}`)

      // Execute task with logic checking
      const taskOutput = await this.executeTaskWithLogicCheck(agent, task)

      // Mark task as completed
      await updateTask(task.id, {
        status: 'completed',
        output: taskOutput,
        completed_at: new Date().toISOString(),
      })

      completedTasks.add(taskIndex)
      runningTasks.delete(taskIndex)
    }

    // Execute tasks in waves based on dependencies
    while (completedTasks.size < tasks.length) {
      // Find all tasks ready to run (dependencies met, not yet started)
      const readyTasks = tasks
        .map((_, index) => index)
        .filter(
          (index) =>
            !completedTasks.has(index) &&
            !runningTasks.has(index) &&
            areDependenciesMet(index)
        )

      if (readyTasks.length === 0 && runningTasks.size === 0) {
        throw new Error('Deadlock detected: no tasks can proceed')
      }

      // Start all ready tasks in parallel
      readyTasks.forEach((index) => {
        const promise = executeTask(index)
        runningTasks.set(index, promise)
      })

      // Wait for at least one task to complete before checking for more
      if (runningTasks.size > 0) {
        await Promise.race(Array.from(runningTasks.values()))
      }
    }
  }

  private async executeTaskWithLogicCheck(
    agent: Agent,
    task: Task
  ): Promise<string> {
    const maxAttempts = 3
    let lastOutput = ''

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Execute task
      this.emitEvent('task_update', {
        taskId: task.id,
        agentName: agent.name,
        status: 'running',
        message: `Executing task with ${agent.name}...`,
      })

      lastOutput = await executeAgentSDK(agent, task)

      this.emitEvent('task_update', {
        taskId: task.id,
        agentName: agent.name,
        status: 'completed',
        message: `Task completed by ${agent.name}`,
      })

      // Validate with logic checker
      const taskData = safeJSONParse<{ description?: string }>(task.input, {})
      if (!taskData.description) {
        throw new Error('Invalid task input: missing description')
      }

      const isValid = await this.validateWithLogicChecker(
        taskData.description,
        lastOutput,
        'task'
      )

      if (isValid) {
        return lastOutput
      }

      // Update task status for retry
      await updateTask(task.id, {
        status: 'pending',
      })
    }

    // Max attempts reached, return last output
    return lastOutput
  }

  private async validateWithLogicChecker(
    originalInput: string,
    output: string,
    type: 'plan' | 'task'
  ): Promise<string> {
    const logicCheckerAgent = this.getLogicCheckerAgent()
    const maxAttempts = 3

    const currentOutput = output

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Create logic check task
      const checkInput = JSON.stringify({
        type,
        original_input: originalInput,
        output: currentOutput,
      })

      const checkTask = await createTask({
        execution_id: this.execution.id,
        message_id: null,
        agent_id: null,
        title: 'Checking task completion and quality',
        description: `Validating ${type} completion`,
        input: checkInput,
        status: 'pending',
        type: 'run_command',
        metadata: { system_agent_id: logicCheckerAgent.id },
        attempts: 0,
      })

      // Execute logic checker
      const checkOutput = await executeAgentSDK(logicCheckerAgent, checkTask as Task)
      const result = this.parseLogicCheckResult(checkOutput)

      await updateTask(checkTask.id, {
        status: 'completed',
        output: checkOutput,
        completed_at: new Date().toISOString(),
      })

      if (result.is_complete) {
        return currentOutput
      }

      // If not passed, we'd need to re-execute the original agent with feedback
      // For now, return the output anyway after max attempts
      if (attempt === maxAttempts - 1) {
        return currentOutput
      }
    }

    return currentOutput
  }

  private getPlannerAgent() {
    const agent = getSystemAgentById('system-task-planner')
    if (!agent) {
      throw new Error('Task Planner system agent not found')
    }
    return agent
  }

  private getOrchestratorAgent() {
    const agent = getSystemAgentById('system-orchestrator')
    if (!agent) {
      throw new Error('Orchestrator system agent not found')
    }
    return agent
  }

  private getLogicCheckerAgent() {
    const agent = getSystemAgentById('system-logic-checker')
    if (!agent) {
      throw new Error('Logic Checker system agent not found')
    }
    return agent
  }

  private parsePlan(planOutput: string): TaskPlannerOutput {
    return parseTaskPlannerOutput(planOutput)
  }

  private parseOrchestratorOutput(output: string): Array<TablesInsert<'agents'>> {
    const parsed = parseOrchestratorOutput(output)
    const defaultModel = getDefaultAnthropicModel()

    return parsed.agents.map((agent) => ({
      team_id: this.teamId,
      name: agent.name,
      type: 'generic',
      model: agent.model || defaultModel, // Use default if not specified
      system_prompt: agent.system_prompt,
      user_prompt_template: agent.user_prompt_template,
      config: (agent.config || {}) as Json, // Cast to Json for database compatibility
    }))
  }

  private async createSpecializedAgents(
    agentSpecs: Array<TablesInsert<'agents'>>
  ): Promise<Agent[]> {
    // Create all agents in parallel for better performance
    const agents = await Promise.all(agentSpecs.map((spec) => createAgent(spec)))
    return agents as Agent[]
  }

  private parseLogicCheckResult(output: string): LogicCheckResult {
    return parseLogicCheckResult(output)
  }

  private emitEvent(
    type:
      | 'execution_update'
      | 'task_update'
      | 'agent_start'
      | 'agent_complete'
      | 'agent_error',
    payload: unknown
  ) {
    executionEvents.emitExecutionUpdate(this.execution.id, {
      type,
      payload,
      timestamp: new Date().toISOString(),
    })
  }

  private calculateTaskLevels(tasks: TaskPlannerOutput['tasks']): number[] {
    const levels = new Array(tasks.length).fill(0)

    // Calculate level for each task based on dependencies
    // Level = max(dependency levels) + 1
    const calculateLevel = (
      index: number,
      visited = new Set<number>()
    ): number => {
      if (visited.has(index)) {
        throw new Error(`Circular dependency detected at task ${index}`)
      }

      const task = tasks[index]
      if (!task) return 0

      const dependencies = task.dependencies || []
      if (dependencies.length === 0) {
        return 0
      }

      visited.add(index)
      const maxDepLevel = Math.max(
        ...dependencies.map((depIndex) =>
          calculateLevel(depIndex, new Set(visited))
        )
      )
      visited.delete(index)

      return maxDepLevel + 1
    }

    tasks.forEach((_, index) => {
      levels[index] = calculateLevel(index)
    })

    return levels
  }

  private async createWorkflowFromPlan(
    plan: TaskPlannerOutput,
    agents: Agent[]
  ) {
    // Calculate positioning based on dependency levels (layered graph layout)
    const horizontalSpacing = 450
    const verticalSpacing = 280

    // Calculate depth level for each task (topological sort)
    const taskLevels = this.calculateTaskLevels(plan.tasks)
    const levelCounts = new Map<number, number>()

    // Create nodes for each task/agent pair
    const nodes = plan.tasks.map((task, index) => {
      const level = taskLevels[index]!
      const countAtLevel = levelCounts.get(level) || 0
      levelCounts.set(level, countAtLevel + 1)

      return {
        id: `task-${index}`,
        type: 'agent',
        data: {
          label: task.title,
          agentId: agents[index]?.id,
          agentName: agents[index]?.name,
          taskDescription: task.description,
          dependencies: task.dependencies,
        },
        position: {
          x: level * horizontalSpacing + 100,
          y: countAtLevel * verticalSpacing + 100,
        },
      }
    })

    // Create edges based on actual dependencies
    const edges: Array<{
      id: string
      source: string
      target: string
      type: string
    }> = []
    plan.tasks.forEach((task, index) => {
      const dependencies = task.dependencies || []
      dependencies.forEach((depIndex) => {
        edges.push({
          id: `edge-${depIndex}-${index}`,
          source: `task-${depIndex}`,
          target: `task-${index}`,
          type: 'smoothstep',
        })
      })
    })

    // Create workflow
    return await createWorkflow({
      team_id: this.teamId,
      name: `Workflow for: ${this.execution.input.substring(0, 50)}...`,
      description: plan.overall_strategy,
      nodes,
      edges,
    })
  }
}

export async function startWorkflowExecution(
  teamId: string,
  execution: Execution
): Promise<void> {
  const orchestrator = new WorkflowOrchestrator(teamId, execution)
  await orchestrator.run()
}

export async function resumeWorkflowExecution(
  teamId: string,
  execution: Execution
): Promise<void> {
  const orchestrator = new WorkflowOrchestrator(teamId, execution)
  await orchestrator.resume()
}
