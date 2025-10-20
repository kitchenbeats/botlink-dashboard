# Dynamic Agent Generation - Implementation Plan

## Concept Overview

**The Key Innovation:** The Orchestrator agent doesn't just assign tasks - it **creates specialized agents dynamically** based on the work needed. Each specialized agent gets a custom system prompt, tools, and configuration tailored to their role.

## How It Works

### Phase 1: Agent Generation

```typescript
// 1. Orchestrator outputs JSON with specialized agents
{
  "agents": [
    {
      "name": "Frontend Expert",
      "type": "frontend_specialist",
      "system_prompt": "You are an expert React/TypeScript developer specializing in modern frontend...",
      "skills": ["react", "typescript", "tailwind", "nextjs"],
      "tools": ["file_operations", "search", "terminal"],
      "model": "claude-sonnet-4-5"
    },
    {
      "name": "Backend Expert",
      "type": "backend_specialist",
      "system_prompt": "You are an expert Node.js/PostgreSQL developer...",
      "skills": ["nodejs", "express", "postgresql", "prisma"],
      "tools": ["file_operations", "database_operations", "terminal"],
      "model": "claude-sonnet-4-5"
    },
    {
      "name": "Integration Expert",
      "type": "integration_specialist",
      "system_prompt": "You are an expert in API design and system integration...",
      "skills": ["rest_api", "graphql", "authentication", "websockets"],
      "tools": ["file_operations", "api_testing", "terminal"],
      "model": "claude-sonnet-4-5"
    }
  ],
  "task_assignments": [
    { "agent": "Frontend Expert", "tasks": ["Create React components", "Setup routing"] },
    { "agent": "Backend Expert", "tasks": ["Design database schema", "Build API endpoints"] },
    { "agent": "Integration Expert", "tasks": ["Connect frontend to backend", "Add auth"] }
  ]
}

// 2. Save these to database
for (const agentSpec of orchestratorOutput.agents) {
  await createAgent({
    team_id: execution.team_id,
    execution_id: execution.id,
    name: agentSpec.name,
    type: agentSpec.type,
    system_prompt: agentSpec.system_prompt,
    model: agentSpec.model,
    config: {
      skills: agentSpec.skills,
      tools: agentSpec.tools
    }
  });
}
```

### Phase 2: Dynamic Agent Execution

```typescript
// 3. Load specialized agents from database
const specializedAgents = await getAgentsByExecution(executionId);

// 4. Create Agent-Kit agents dynamically from specs
const agentKitAgents = specializedAgents.map(spec =>
  createAgent({
    name: spec.name,
    description: `${spec.type}: ${spec.skills.join(', ')}`,
    system: spec.system_prompt,
    model: anthropic({
      model: spec.model,
      defaultParameters: { max_tokens: 8192 }
    }),
    tools: loadToolsForAgent(spec.config.tools), // E2B sandbox tools
  })
);

// 5. Execute with routing
const network = createNetwork({
  agents: agentKitAgents,
  defaultRouter: ({ network, callCount }) => {
    const state = network.state.kv;

    // Get current task
    const currentTask = state.get('current_task');
    if (!currentTask) return agentKitAgents[0]; // Start with first

    // If code feedback failed, retry same agent
    if (state.get('code_feedback_failed')) {
      return agentKitAgents.find(a => a.name === currentTask.agent);
    }

    // If logic check failed, retry same agent
    if (state.get('logic_check_failed')) {
      return agentKitAgents.find(a => a.name === currentTask.agent);
    }

    // Move to next task
    const nextTask = getNextTask(state);
    if (!nextTask) return; // All done

    return agentKitAgents.find(a => a.name === nextTask.agent);
  }
});
```

## Implementation with Inngest

### Orchestrator Tool Definition

```typescript
// Tool for Orchestrator to output specialized agents
const createSpecializedAgentsTool = createTool({
  name: 'generate_specialized_agents',
  description: 'Generate specialized agents based on the task plan. Create agents with specific expertise (frontend, backend, DevOps, etc.) tailored to the work.',
  parameters: z.object({
    agents: z.array(z.object({
      name: z.string().describe('Agent name (e.g., "Frontend Expert")'),
      type: z.string().describe('Agent type/role (e.g., "frontend_specialist")'),
      system_prompt: z.string().describe('Detailed system prompt defining the agent\'s expertise and behavior'),
      skills: z.array(z.string()).describe('List of skills/technologies the agent specializes in'),
      tools: z.array(z.string()).describe('Tools the agent should have access to'),
      model: z.string().describe('AI model to use (e.g., "claude-sonnet-4-5")'),
    })),
    task_assignments: z.array(z.object({
      agent: z.string().describe('Agent name'),
      tasks: z.array(z.string()).describe('Tasks assigned to this agent'),
    })),
  }),
  handler: async ({ agents, task_assignments }) => {
    // Save agents to database
    const createdAgents = [];
    for (const agentSpec of agents) {
      const agent = await createAgent({
        team_id: execution.team_id,
        execution_id: execution.id,
        name: agentSpec.name,
        type: agentSpec.type,
        system_prompt: agentSpec.system_prompt,
        model: agentSpec.model,
        config: {
          skills: agentSpec.skills,
          tools: agentSpec.tools,
        },
      });
      createdAgents.push(agent);
    }

    // Create tasks
    for (const assignment of task_assignments) {
      const agent = createdAgents.find(a => a.name === assignment.agent);
      for (const taskDescription of assignment.tasks) {
        await createTask({
          execution_id: execution.id,
          agent_id: agent.id,
          title: taskDescription,
          description: taskDescription,
          status: 'pending',
        });
      }
    }

    return {
      success: true,
      agents_created: createdAgents.length,
      tasks_created: task_assignments.reduce((sum, a) => sum + a.tasks.length, 0),
    };
  },
});
```

### Complete Inngest Function

```typescript
export const workflowOrchestrationFunction = inngest.createFunction(
  { id: 'workflow-orchestration', name: 'Workflow Orchestration' },
  { event: 'workflow/start' },
  async ({ event, step }) => {
    const { executionId } = event.data;

    // PHASE 1: PLANNING & AGENT GENERATION

    // Step 1: Task Planning
    const plan = await step.run('task-planning', async () => {
      const planner = createAgent({
        name: 'Task Planner',
        system: TASK_PLANNER_PROMPT,
        model: anthropic({ model: 'claude-sonnet-4-5' }),
        tools: [generatePlanTool],
      });

      const result = await planner.run(userInput);
      return result.output;
    });

    // Step 2: Logic Check Plan
    await step.run('validate-plan', async () => {
      let attempts = 0;
      let valid = false;

      while (!valid && attempts < 3) {
        const checker = createAgent({
          name: 'Logic Checker',
          system: LOGIC_CHECKER_PROMPT,
          model: anthropic({ model: 'claude-sonnet-4-5' }),
          tools: [validateTool],
        });

        const result = await checker.run(plan);
        valid = result.output.passed;

        if (!valid) {
          attempts++;
          plan = await retryPlanning(result.output.feedback);
        }
      }
    });

    // Step 3: Generate Specialized Agents
    const specializedAgents = await step.run('generate-agents', async () => {
      const orchestrator = createAgent({
        name: 'Orchestrator',
        system: ORCHESTRATOR_PROMPT,
        model: anthropic({ model: 'claude-sonnet-4-5' }),
        tools: [createSpecializedAgentsTool],
      });

      const result = await orchestrator.run({
        plan,
        userInput,
      });

      // Agents are now in database
      return await getAgentsByExecution(executionId);
    });

    // Step 4: PAUSE for human approval
    await step.run('pause-for-approval', async () => {
      await updateExecution(executionId, { status: 'paused' });
    });

    // Wait for approval event (24 hour timeout)
    await step.waitForEvent('workflow/resume', {
      match: 'data.executionId',
      timeout: '24h',
    });

    // PHASE 2: EXECUTION WITH SPECIALIZED AGENTS

    await step.run('execute-with-specialized-agents', async () => {
      // Create Agent-Kit agents from DB specs
      const agentKitAgents = specializedAgents.map(spec =>
        createAgent({
          name: spec.name,
          description: spec.type,
          system: spec.system_prompt,
          model: anthropic({ model: spec.model }),
          tools: [
            // E2B sandbox tools
            terminalTool(sandbox),
            fileOperationsTool(sandbox),
            searchTool(sandbox),
          ],
        })
      );

      // Add review agents
      const codeFeedbackAgent = createAgent({
        name: 'Code Feedback Agent',
        system: CODE_REVIEWER_PROMPT,
        model: anthropic({ model: 'claude-sonnet-4-5' }),
        tools: [reviewCodeTool],
      });

      const logicCheckerAgent = createAgent({
        name: 'Logic Checker',
        system: LOGIC_CHECKER_PROMPT,
        model: anthropic({ model: 'claude-sonnet-4-5' }),
        tools: [validateTool],
      });

      // Create network with all agents
      const network = createNetwork({
        agents: [...agentKitAgents, codeFeedbackAgent, logicCheckerAgent],
        defaultRouter: ({ network }) => {
          // Custom routing logic for your workflow
          return routeToNextAgent(network.state.kv);
        },
      });

      // Execute
      const result = await network.run(plan);

      return result;
    });

    // Mark complete
    await step.run('complete', async () => {
      await updateExecution(executionId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
    });
  }
);
```

## Database Schema Updates Needed

```sql
-- Add execution_id to agents table (for dynamic agents)
ALTER TABLE agents ADD COLUMN execution_id uuid REFERENCES executions(id) ON DELETE CASCADE;
ALTER TABLE agents ADD COLUMN is_dynamic boolean DEFAULT false;

-- Index for fast lookup
CREATE INDEX idx_agents_execution_id ON agents(execution_id);

-- Dynamic agents are those created by orchestrator
-- is_dynamic = true means they're temporary for this execution
-- is_dynamic = false means they're user-created permanent agents
```

## Key Advantages

### 1. **True Dynamic Agent Creation**
- Orchestrator analyzes the work
- Creates agents with perfect specializations
- Each agent gets custom system prompt
- Tools are matched to agent's needs

### 2. **Flexible & Scalable**
- Can create 2 agents or 20 agents
- Agent specializations match the exact work
- Reusable pattern for any project type

### 3. **Human Review of Agent Team**
- User sees WHO will do the work
- Can see each agent's specialization
- Approves the team before execution

### 4. **Quality Assurance Built-In**
- Code Feedback Agent reviews output
- Logic Checker validates completion
- Retry loops with feedback

### 5. **Realtime Visibility**
```typescript
// Stream updates during execution
await inngest.send({
  name: 'workflow/progress',
  data: {
    executionId,
    message: `Frontend Expert is creating React components...`,
    agent: 'Frontend Expert',
    step: 'coding',
  }
});
```

## Example: E-Commerce App

**User Input:** "Build a full-stack e-commerce app"

**Orchestrator Creates:**
1. **Frontend Architect** - React, TypeScript, Tailwind expert
2. **Backend Architect** - Node.js, PostgreSQL, Prisma expert
3. **Authentication Specialist** - JWT, OAuth, security expert
4. **Payment Integration Specialist** - Stripe, webhooks expert
5. **Testing Engineer** - Jest, Playwright, E2E testing expert
6. **DevOps Engineer** - Docker, deployment, CI/CD expert

**Each gets custom tools and prompts!**

## Next Steps

1. ✅ We already have Inngest setup
2. ✅ We already have E2B sandbox integration
3. **Need:** Create orchestrator tool for agent generation
4. **Need:** Build dynamic agent loader (DB → Agent-Kit)
5. **Need:** Implement routing logic for agent network
6. **Need:** Add code feedback agent
7. **Need:** Wire up UI to show generated agents

Want me to start implementing this? I'd begin with the orchestrator tool and dynamic agent loading!
