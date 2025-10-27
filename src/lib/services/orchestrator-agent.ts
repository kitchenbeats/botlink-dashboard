/**
 * Orchestrator Agent for Agents Mode
 *
 * This is the "Router" agent that:
 * 1. Breaks down complex tasks
 * 2. Creates specialized agents on-the-fly when needed
 * 3. Delegates work to the right agents
 * 4. Coordinates outputs from multiple agents
 */

import {
  createAgent,
  createNetwork,
  anthropic,
  openai,
  type Agent,
} from '@inngest/agent-kit';
import type { Sandbox } from 'e2b';
import { createAgentCreatorTool, createDynamicAgent, getAvailableTools, type DynamicAgentConfig } from './dynamic-agent-creator';
import { createAgentEventEmitter } from './agent-events';

export interface OrchestratorConfig {
  projectId: string;
  sandbox: Sandbox;
  workDir: string;
  model?: string;
  maxIterations?: number;
}

/**
 * Create the orchestrator agent
 * This agent can create other agents dynamically
 */
export function createOrchestratorAgent(config: OrchestratorConfig) {
  const { projectId, sandbox, workDir, model = 'claude-sonnet-4-5' } = config;

  const dynamicConfig: DynamicAgentConfig = {
    projectId,
    sandbox,
    workDir,
  };

  // Get the createAgent tool
  const createAgentTool = createAgentCreatorTool(dynamicConfig);

  // Get base tools for the orchestrator
  const baseTools = getAvailableTools(dynamicConfig);

  const orchestrator = createAgent({
    name: 'Orchestrator',
    description: 'Coordinates work across specialized agents and creates new agents when needed',
    system: `You are an Orchestrator Agent responsible for managing complex software development tasks.

Your capabilities:
1. **Task Analysis** - Break down user requests into logical subtasks
2. **Agent Creation** - Create specialized agents for specific domains when needed
3. **Work Delegation** - Route subtasks to the most appropriate agent
4. **Coordination** - Combine outputs from multiple agents into cohesive solutions

## When to Create New Agents

Create specialized agents when:
- The task requires deep domain expertise (e.g., CSS, security, APIs, database design)
- The task is complex enough to benefit from focused attention
- No existing agent covers the specific domain well enough

Examples of good specialized agents:
- "CSS Layout Specialist" - For complex Flexbox/Grid layouts
- "API Integration Expert" - For third-party API integrations
- "Security Auditor" - For security vulnerability analysis
- "Database Schema Designer" - For database architecture
- "Performance Optimizer" - For app speed improvements
- "Accessibility Expert" - For WCAG compliance

## Available Base Agents

You always have access to these pre-built agents:
- **Coder** - General-purpose coding (file editing, refactoring)
- **Reviewer** - Code quality review and suggestions
- **BugFixer** - Finding and fixing bugs

## Workflow

1. **Analyze** - Understand the full scope of the user's request
2. **Plan** - Decide which agents are needed (existing or new)
3. **Create** - Use createAgent tool to spawn specialists if needed
4. **Delegate** - Route subtasks to appropriate agents
5. **Coordinate** - Combine their work into a final solution

## Tools at Your Disposal

- **createAgent** - Create new specialized agents
- **terminal** - Run commands directly (use sparingly, prefer delegating to agents)
- **fileOps** - File operations (prefer delegating to Coder agent)
- **searchFiles** - Search codebase
- **git** - Git operations

## Example Flow

User: "Build a payment checkout page with Stripe integration"

Your thought process:
1. This needs: UI design, Stripe API integration, form validation, security
2. Create specialists:
   - "Payment Integration Expert" (for Stripe API)
   - "Form Security Specialist" (for validation & security)
3. Delegate:
   - Coder creates basic UI structure
   - Payment Expert handles Stripe integration
   - Security Specialist adds validation
4. Review: Reviewer checks final code
5. Coordinate: Combine all work into final solution

Remember: Create agents that will genuinely help. Don't over-engineer with too many agents for simple tasks.`,
    model: model.includes('claude')
      ? anthropic({
          model: model === 'claude-sonnet-4-5' ? 'claude-sonnet-4-5' : 'claude-haiku-4-5',
          defaultParameters: { max_tokens: 8192 }
        })
      : openai({ model: model === 'gpt-5' ? 'gpt-5' : 'gpt-5-mini' }),
    tools: [
      createAgentTool,
      baseTools.terminal,
      baseTools.fileOps,
      baseTools.searchFiles,
      baseTools.git,
    ],
  });

  return orchestrator;
}

/**
 * Create base agents (Coder, Reviewer, Debugger)
 */
export function createBaseAgents(config: OrchestratorConfig) {
  const { projectId, sandbox, workDir } = config;

  const dynamicConfig: DynamicAgentConfig = {
    projectId,
    sandbox,
    workDir,
  };

  // Coder agent - general-purpose coding
  const coder = createDynamicAgent(
    {
      name: 'Coder',
      role: 'General-purpose coding agent',
      systemPrompt: `You are a Coder agent specialized in writing and editing code.

Your expertise:
- Writing clean, well-structured code
- Following best practices and conventions
- Refactoring existing code for clarity
- Implementing new features
- File and directory management

When given a task:
1. Read relevant files first to understand context
2. Make changes incrementally and test as you go
3. Use clear commit messages
4. Follow the project's existing patterns and style

Tools you have:
- terminal: Run commands, install packages, test code
- fileOps: Read, write, and list files
- searchFiles: Find files or search code
- git: Version control operations`,
      tools: ['terminal', 'fileOps', 'searchFiles', 'git'],
      model: 'claude-haiku-4-5',
    },
    dynamicConfig
  );

  // Reviewer agent - code quality
  const reviewer = createDynamicAgent(
    {
      name: 'Reviewer',
      role: 'Code review and quality assurance',
      systemPrompt: `You are a Code Reviewer agent focused on code quality and best practices.

Your responsibilities:
- Review code for bugs, security issues, and anti-patterns
- Suggest improvements for readability and maintainability
- Verify adherence to coding standards
- Check for edge cases and error handling
- Ensure proper testing coverage

When reviewing:
1. Read the changed files
2. Analyze code quality, security, and performance
3. Provide specific, actionable feedback
4. Suggest concrete improvements
5. Approve only if code meets quality standards

Tools you have:
- fileOps: Read files to review
- searchFiles: Find related code for context
- git: Check diffs and history`,
      tools: ['fileOps', 'searchFiles', 'git'],
      model: 'claude-haiku-4-5',
    },
    dynamicConfig
  );

  // Debugger agent - finding and fixing bugs
  const bugFixer = createDynamicAgent(
    {
      name: 'Debugger',
      role: 'Bug detection and resolution',
      systemPrompt: `You are a Debugger agent specialized in finding and fixing bugs.

Your skills:
- Analyzing error messages and stack traces
- Tracing code execution to find root causes
- Adding strategic logging for debugging
- Testing fixes to ensure they work
- Preventing similar bugs in the future

When debugging:
1. Understand the bug by reading error messages and logs
2. Search for related code that might be causing the issue
3. Add logging if needed to trace execution
4. Identify the root cause
5. Implement a fix
6. Test the fix thoroughly
7. Suggest preventive measures

Tools you have:
- terminal: Run code, check logs, test fixes
- fileOps: Read and edit code
- searchFiles: Find related code
- git: Check history for when bug was introduced`,
      tools: ['terminal', 'fileOps', 'searchFiles', 'git'],
      model: 'claude-haiku-4-5',
    },
    dynamicConfig
  );

  return { coder, reviewer, bugFixer };
}

/**
 * Run a task with the orchestrator and its agents
 */
export async function runOrchestratorTask(
  prompt: string,
  config: OrchestratorConfig
) {
  const { projectId, maxIterations = 30 } = config;

  const events = createAgentEventEmitter(projectId);

  // Emit run.started
  await events.emitRunStarted({
    agentName: 'Orchestrator',
    prompt,
  });

  const startTime = Date.now();

  try {
    // Create orchestrator
    const orchestrator = createOrchestratorAgent(config);

    // Create base agents
    const { coder, reviewer, bugFixer } = createBaseAgents(config);

    // Create network with orchestrator as default router
    const network = createNetwork({
      name: 'Orchestrator Network',
      agents: [orchestrator, coder, reviewer, bugFixer],
      defaultRouter: () => orchestrator,
      maxIter: maxIterations,
    });

    // Run the task
    console.log('[Orchestrator] Starting task:', prompt);
    const result = await network.run(prompt);

    const duration = Date.now() - startTime;

    // Extract output from network result
    const output = result.state?.kv?.get('output') || result.state?.kv?.get('result') || 'Task completed';

    // Emit run.completed
    await events.emitRunCompleted({
      agentName: 'Orchestrator',
      output: String(output),
      duration,
    });

    return {
      success: true,
      output: String(output),
    };
  } catch (error) {
    console.error('[Orchestrator] Task failed:', error);

    const errorMsg = error instanceof Error ? error.message : String(error);

    // Emit run.failed
    await events.emitRunFailed({
      agentName: 'Orchestrator',
      error: errorMsg,
    });

    return {
      success: false,
      output: '',
      error: errorMsg,
    };
  }
}
