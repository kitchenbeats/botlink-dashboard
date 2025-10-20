/**
 * Tools for Orchestration Agents
 * These tools allow agents to structure their outputs and create specialized agents
 */

import { createTool } from '@inngest/agent-kit';
import { z } from 'zod';
import { createAgent as createAgentInDB } from '../db/agents';
import { createTask } from '../db/tasks';
import { generateSpecializedAgentPrompt } from '../services/system-prompts';

/**
 * Tool for Task Planner to output structured task plan
 */
export const generatePlanTool = createTool({
  name: 'generate_task_plan',
  description: 'Output a structured task plan breaking down the user request into actionable tasks',
  parameters: z.object({
    overall_strategy: z.string().describe('High-level approach and strategy for the project'),
    task_categories: z.array(z.object({
      category: z.string().describe('Category name (e.g., "Frontend", "Backend", "Infrastructure")'),
      tasks: z.array(z.object({
        title: z.string().describe('Clear, concise task title'),
        description: z.string().describe('Detailed description of what needs to be done'),
        complexity: z.enum(['simple', 'moderate', 'complex']).describe('Task complexity level'),
        dependencies: z.array(z.string()).optional().describe('Task titles this depends on'),
        estimated_hours: z.number().optional().describe('Estimated hours to complete'),
      })),
    })).describe('Tasks organized by category'),
    technologies: z.array(z.string()).describe('Recommended technologies and frameworks'),
    considerations: z.array(z.string()).describe('Important considerations (security, scalability, etc.)'),
  }),
  handler: async ({ overall_strategy, task_categories, technologies, considerations }) => {
    // Store in network state for next agents
    return {
      success: true,
      plan: {
        overall_strategy,
        task_categories,
        technologies,
        considerations,
        total_tasks: task_categories.reduce((sum, cat) => sum + cat.tasks.length, 0),
      },
    };
  },
});

/**
 * Tool for Logic Checker to output validation results
 */
export const validateWorkTool = createTool({
  name: 'validate_work',
  description: 'Validate that work meets requirements and quality standards',
  parameters: z.object({
    passed: z.boolean().describe('Whether validation passed'),
    feedback: z.string().describe('Detailed feedback on the validation'),
    issues: z.array(z.object({
      severity: z.enum(['critical', 'major', 'minor']).describe('Issue severity'),
      description: z.string().describe('Issue description'),
      location: z.string().optional().describe('File/line where issue exists'),
    })).optional().describe('List of issues found'),
    suggestions: z.array(z.string()).optional().describe('Improvement suggestions'),
    quality_score: z.number().min(0).max(10).optional().describe('Quality score out of 10'),
  }),
  handler: async ({ passed, feedback, issues, suggestions, quality_score }) => {
    return {
      success: true,
      validation: {
        passed,
        feedback,
        issues: issues || [],
        suggestions: suggestions || [],
        quality_score,
      },
    };
  },
});

/**
 * Tool for Orchestrator to create specialized agents dynamically
 */
export function createSpecializedAgentsTool(teamId: string, executionId: string) {
  return createTool({
    name: 'create_specialized_agents',
    description: 'Create a team of specialized AI agents tailored to the project requirements. Each agent should have deep expertise in a specific domain.',
    parameters: z.object({
      agents: z.array(z.object({
        name: z.string().describe('Agent name (e.g., "Frontend Expert", "Backend Architect")'),
        type: z.enum([
          'frontend_expert',
          'backend_expert',
          'devops_expert',
          'testing_expert',
          'integration_expert',
          'database_expert',
          'security_expert',
          'mobile_expert',
          'ai_ml_expert',
        ]).describe('Agent specialization type'),
        skills: z.array(z.string()).describe('Specific skills and technologies (e.g., ["React", "TypeScript", "Tailwind"])'),
        responsibilities: z.array(z.string()).describe('Key responsibilities and areas of focus'),
        model: z.string().default('claude-sonnet-4-5').describe('AI model to use'),
      })).min(1).max(10).describe('Team of specialized agents'),
      task_assignments: z.array(z.object({
        agent_name: z.string().describe('Name of agent to assign tasks to'),
        tasks: z.array(z.object({
          title: z.string().describe('Task title'),
          description: z.string().describe('Detailed task description'),
          order: z.number().describe('Execution order (tasks with same order can run in parallel)'),
        })),
      })).describe('Task assignments for each agent'),
      collaboration_strategy: z.string().describe('How agents should collaborate and hand off work'),
    }),
    handler: async ({ agents, task_assignments, collaboration_strategy }) => {
      console.log('[Orchestrator] Creating specialized agents:', agents.map(a => a.name));

      const createdAgents: Awaited<ReturnType<typeof createAgentInDB>>[] = [];

      // Create each specialized agent in database
      for (const agentSpec of agents) {
        // Generate detailed system prompt
        const systemPrompt = generateSpecializedAgentPrompt(
          agentSpec.type,
          agentSpec.skills,
          collaboration_strategy
        );

        // Create agent in database
        const agent = await createAgentInDB({
          team_id: teamId,
          name: agentSpec.name,
          type: agentSpec.type,
          model: agentSpec.model,
          system_prompt: systemPrompt,
          user_prompt_template: null,
          config: {
            skills: agentSpec.skills,
            responsibilities: agentSpec.responsibilities,
            execution_id: executionId,
            is_dynamic: true,
            tools: ['file_operations', 'terminal', 'search', 'code_analysis'],
          },
        });

        createdAgents.push(agent);
        console.log('[Orchestrator] Created agent:', agent.name, agent.id);
      }

      // Create tasks for each agent
      let taskCount = 0;
      for (const assignment of task_assignments) {
        const agent = createdAgents.find(a => a.name === assignment.agent_name);
        if (!agent) {
          console.error('[Orchestrator] Agent not found:', assignment.agent_name);
          continue;
        }

        for (const task of assignment.tasks) {
          await createTask({
            team_id: teamId,
            execution_id: executionId,
            agent_id: agent.id,
            title: task.title,
            description: task.description,
            input: JSON.stringify({ order: task.order }),
            status: 'pending',
            type: 'file_create', // Default type
            metadata: {
              order: task.order,
              agent_type: agent.type,
            },
          });
          taskCount++;
        }
      }

      console.log('[Orchestrator] Created', taskCount, 'tasks for', createdAgents.length, 'agents');

      return {
        success: true,
        agents_created: createdAgents.length,
        tasks_created: taskCount,
        agent_ids: createdAgents.map(a => a.id),
        collaboration_strategy,
      };
    },
  });
}

/**
 * Tool for Code Feedback Agent to review code
 */
export const reviewCodeTool = createTool({
  name: 'review_code',
  description: 'Conduct a thorough code review and provide feedback',
  parameters: z.object({
    approved: z.boolean().describe('Whether code is approved for production'),
    feedback: z.string().describe('Detailed review feedback'),
    issues: z.array(z.object({
      severity: z.enum(['critical', 'major', 'minor']).describe('Issue severity'),
      category: z.enum(['code_quality', 'best_practices', 'architecture', 'testing', 'security', 'performance']),
      description: z.string().describe('Issue description'),
      file: z.string().optional().describe('File where issue exists'),
      suggestion: z.string().describe('How to fix the issue'),
    })).optional(),
    suggestions: z.array(z.string()).optional().describe('General improvement suggestions'),
    quality_rating: z.number().min(1).max(10).describe('Overall code quality rating (1-10)'),
    highlights: z.array(z.string()).optional().describe('Things done particularly well'),
  }),
  handler: async ({ approved, feedback, issues, suggestions, quality_rating, highlights }) => {
    return {
      success: true,
      review: {
        approved,
        feedback,
        issues: issues || [],
        suggestions: suggestions || [],
        quality_rating,
        highlights: highlights || [],
      },
    };
  },
});

/**
 * Tool for Clarifier Agent to ask questions
 */
export const askClarifyingQuestionsTool = createTool({
  name: 'ask_clarifying_questions',
  description: 'Ask clarifying questions about ambiguous or missing requirements',
  parameters: z.object({
    needs_clarification: z.boolean().describe('Whether clarification is needed'),
    questions: z.array(z.object({
      category: z.string().describe('Question category (e.g., "Technical Details", "Business Logic")'),
      question: z.string().describe('The clarifying question'),
      why: z.string().describe('Why this question is important'),
      impact: z.enum(['high', 'medium', 'low']).describe('Impact if not clarified'),
    })).optional(),
    assumptions: z.array(z.object({
      assumption: z.string().describe('Assumption being made'),
      risk: z.string().describe('Risk if assumption is wrong'),
    })).optional(),
    can_proceed: z.boolean().describe('Whether work can proceed without clarification'),
  }),
  handler: async ({ needs_clarification, questions, assumptions, can_proceed }) => {
    return {
      success: true,
      clarification: {
        needs_clarification,
        questions: questions || [],
        assumptions: assumptions || [],
        can_proceed,
      },
    };
  },
});
