/**
 * Complete Workflow Orchestration Function
 * Production-ready multi-agent workflow with dynamic agent generation
 * Based on: https://github.com/inngest/agent-kit
 */

import { createNetwork } from '@inngest/agent-kit';
import { inngest, workspaceChannel } from './client';
import { E2BService } from '../services/e2b-service';
import { getExecution, updateExecution } from '../db/executions';
import { getTasksByExecution, updateTask } from '../db/tasks';
import { createPlanningAgents, loadSpecializedAgents, createReviewAgents } from '../services/dynamic-agent-loader';
import type { Sandbox } from 'e2b';

/**
 * Main Workflow Orchestration Function
 * Handles the complete multi-agent workflow with pause/resume
 */
export const workflowOrchestrationFunction = inngest.createFunction(
  {
    id: 'workflow-orchestration',
    name: 'Workflow Orchestration',
    retries: 2,
  },
  { event: 'workspace/workflow/run' },
  async ({ event, step }) => {
    const { projectId, query, workflowId } = event.data;
    const channel = workspaceChannel(projectId);

    console.log('[Workflow] Starting orchestration for project:', projectId);

    // ============================================================
    // PHASE 1: PLANNING & AGENT GENERATION
    // ============================================================

    // Step 1: Get execution record
    const execution = await step.run('get-execution', async () => {
      // Find the latest pending execution for this project
      const exec = await getExecution(projectId);
      if (!exec) {
        throw new Error(`No execution found for project ${projectId}`);
      }

      await updateExecution(exec.id, { status: 'running' });

      // Publish status
      await inngest.send({
        name: 'workspace/progress',
        data: {
          projectId,
          message: 'Starting workflow orchestration...',
          timestamp: Date.now(),
        },
      });

      return exec;
    });

    // Step 2: Publish sandbox initialization status
    await step.run('publish-sandbox-init', async () => {
      await inngest.send({
        name: 'workspace/progress',
        data: {
          projectId,
          message: 'Initializing development environment...',
          timestamp: Date.now(),
        },
      });
    });

    // Get or create E2B sandbox (NOT wrapped in step - sandbox instances cannot be serialized)
    // Use service role version since Inngest runs in background
    const { sandbox, session } = await E2BService.getOrCreateSandboxServiceRole(projectId);

    // Step 3: Task Planning
    const plan = await step.run('task-planning', async () => {
      await inngest.send({
        name: 'workspace/progress',
        data: {
          projectId,
          message: 'Task Planner is analyzing requirements...',
          timestamp: Date.now(),
        },
      });

      const { plannerAgent } = createPlanningAgents(execution.team_id, execution.id);

      // Create planning network with just the planner
      const planningNetwork = createNetwork({ name: "planning-network",
        agents: [plannerAgent],
        maxIter: 5,
      });

      const result = await planningNetwork.run(query);

      // Extract plan from tool use
      const planData = result.state.kv.get('plan');
      if (!planData) {
        throw new Error('Planner did not generate a plan');
      }

      console.log('[Workflow] Plan generated:', planData);

      await inngest.send({
        name: 'workspace/progress',
        data: {
          projectId,
          message: `Plan created with ${planData.total_tasks} tasks`,
          timestamp: Date.now(),
        },
      });

      return planData;
    });

    // Step 4: Validate Plan with Logic Checker
    const validatedPlan = await step.run('validate-plan', async () => {
      await inngest.send({
        name: 'workspace/progress',
        data: {
          projectId,
          message: 'Logic Checker is validating the plan...',
          timestamp: Date.now(),
        },
      });

      const { logicCheckerAgent } = createPlanningAgents(execution.team_id, execution.id);

      let attempts = 0;
      let currentPlan = plan;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        const checkNetwork = createNetwork({ name: "check-network",
          agents: [logicCheckerAgent],
          maxIter: 3,
        });

        const result = await checkNetwork.run(JSON.stringify(currentPlan));
        const validation = result.state.kv.get('validation');

        if (validation?.passed) {
          console.log('[Workflow] Plan validation passed');
          await inngest.send({
            name: 'workspace/progress',
            data: {
              projectId,
              message: '✅ Plan validated successfully',
              timestamp: Date.now(),
            },
          });
          return currentPlan;
        }

        attempts++;
        console.log(`[Workflow] Plan validation failed (attempt ${attempts}/${maxAttempts}):`, validation?.feedback);

        if (attempts < maxAttempts) {
          await inngest.send({
            name: 'workspace/progress',
            data: {
              projectId,
              message: `Refining plan based on feedback (attempt ${attempts})...`,
              timestamp: Date.now(),
            },
          });

          // Retry planning with feedback
          const { plannerAgent } = createPlanningAgents(execution.team_id, execution.id);
          const retryNetwork = createNetwork({ name: "retry-network",
            agents: [plannerAgent],
            maxIter: 5,
          });

          const retryResult = await retryNetwork.run(
            `${query}\n\nPrevious plan feedback: ${validation?.feedback}\n\nPlease address the feedback and create an improved plan.`
          );

          currentPlan = retryResult.state.kv.get('plan');
        } else {
          throw new Error(`Plan validation failed after ${maxAttempts} attempts: ${validation?.feedback}`);
        }
      }

      return currentPlan;
    });

    // Step 5: Generate Specialized Agents (store in DB only)
    await step.run('generate-specialized-agents', async () => {
      await inngest.send({
        name: 'workspace/progress',
        data: {
          projectId,
          message: 'Orchestrator is creating specialized agents...',
          timestamp: Date.now(),
        },
      });

      const { orchestratorAgent } = createPlanningAgents(execution.team_id, execution.id);

      const orchestratorNetwork = createNetwork({ name: "orchestrator-network",
        agents: [orchestratorAgent],
        maxIter: 5,
      });

      const result = await orchestratorNetwork.run(
        `Based on this validated plan, create a team of specialized agents:\n\n${JSON.stringify(validatedPlan, null, 2)}`
      );

      // Agents are now stored in database by the orchestrator tool
      // We'll load them later after approval to avoid serialization issues
      const { getAgentsByExecution } = await import('../db/agents');
      const dbAgents = await getAgentsByExecution(execution.id);

      console.log('[Workflow] Created', dbAgents.length, 'specialized agents');

      await inngest.send({
        name: 'workspace/progress',
        data: {
          projectId,
          message: `✨ Created team of ${dbAgents.length} specialized agents`,
          timestamp: Date.now(),
        },
      });

      return { agentCount: dbAgents.length };
    });

    // Step 6: PAUSE for Human Approval
    await step.run('pause-for-approval', async () => {
      const { getAgentsByExecution } = await import('../db/agents');
      const dbAgents = await getAgentsByExecution(execution.id);

      await updateExecution(execution.id, {
        status: 'paused',
        output: JSON.stringify({
          plan: validatedPlan,
          agents: dbAgents.map(a => ({
            name: a.name,
            type: a.type,
            skills: (a.config as Record<string, unknown>)?.skills || [],
          })),
        }),
      });

      await inngest.send({
        name: 'workspace/progress',
        data: {
          projectId,
          message: '⏸️  Workflow paused - awaiting your approval',
          timestamp: Date.now(),
        },
      });

      console.log('[Workflow] Paused for human approval');
    });

    // Step 7: Wait for Approval (24 hour timeout)
    const approvalEvent = await step.waitForEvent('wait-for-approval', {
      event: 'workspace/workflow/resume',
      timeout: '24h',
      if: `async.data.executionId == '${execution.id}'`,
    });

    console.log('[Workflow] Approval received, resuming execution');

    // Load specialized agents AFTER approval (can't serialize agent instances across wait)
    const specializedAgents = await loadSpecializedAgents(execution.id, sandbox);

    // ============================================================
    // PHASE 2: EXECUTION WITH SPECIALIZED AGENTS
    // ============================================================

    await step.run('execute-with-specialized-agents', async () => {
      await updateExecution(execution.id, { status: 'running' });

      await inngest.send({
        name: 'workspace/progress',
        data: {
          projectId,
          message: '▶️  Executing workflow with specialized agents...',
          timestamp: Date.now(),
        },
      });

      // Get all tasks for this execution
      const tasks = await getTasksByExecution(execution.id);
      console.log('[Workflow] Found', tasks.length, 'tasks to execute');

      // Group tasks by order (for parallel execution)
      const tasksByOrder = new Map<number, typeof tasks>();
      tasks.forEach(task => {
        const metadata = (task.metadata as Record<string, unknown>) || {};
        const order = (metadata.order as number) || 0;
        if (!tasksByOrder.has(order)) {
          tasksByOrder.set(order, []);
        }
        tasksByOrder.get(order)?.push(task);
      });

      // Get review agents
      const { codeFeedbackAgent, logicCheckerAgent } = createReviewAgents();

      // Execute tasks in order
      const sortedOrders = Array.from(tasksByOrder.keys()).sort((a, b) => a - b);

      for (const order of sortedOrders) {
        const orderTasks = tasksByOrder.get(order) || [];
        console.log(`[Workflow] Executing ${orderTasks.length} tasks at order ${order}`);

        // Execute tasks at this order level (can be parallel)
        await Promise.all(
          orderTasks.map(async (task) => {
            const dbAgent = specializedAgents.dbAgents.find(a => a.id === task.agent_id);
            if (!dbAgent) {
              console.error('[Workflow] Agent not found for task:', task.id);
              return;
            }

            const agentKitAgent = specializedAgents.agents.find(a => a.name === dbAgent.name);
            if (!agentKitAgent) {
              console.error('[Workflow] Agent-Kit agent not found:', dbAgent.name);
              return;
            }

            await inngest.send({
              name: 'workspace/progress',
              data: {
                projectId,
                message: `${dbAgent.name} is working on: ${task.title}`,
                timestamp: Date.now(),
              },
            });

            // Execute task with retry and validation loop
            await updateTask(task.id, { status: 'running' });

            let attempts = 0;
            const maxAttempts = 3;
            let taskComplete = false;

            while (!taskComplete && attempts < maxAttempts) {
              attempts++;

              // Execute the task
              const executionNetwork = createNetwork({ name: "execution-network",
                agents: [agentKitAgent],
                maxIter: 10,
              });

              const result = await executionNetwork.run(task.description || task.title);
              // Get output from the last agent result
              const lastResult = result.state.results[result.state.results.length - 1];
              const output = JSON.stringify(lastResult?.output || []);

              // Code feedback review
              const feedbackNetwork = createNetwork({ name: "feedback-network",
                agents: [codeFeedbackAgent],
                maxIter: 3,
              });

              const feedbackResult = await feedbackNetwork.run(
                `Review this code output:\n\n${output}\n\nTask: ${task.description}`
              );

              const review = feedbackResult.state.kv.get('review');

              if (!review?.approved) {
                console.log(`[Workflow] Code feedback failed (attempt ${attempts}):`, review?.feedback);
                if (attempts < maxAttempts) {
                  await inngest.send({
                    name: 'workspace/progress',
                    data: {
                      projectId,
                      message: `${dbAgent.name} is refining based on feedback...`,
                      timestamp: Date.now(),
                    },
                  });
                  continue;
                }
              }

              // Logic check validation
              const validationNetwork = createNetwork({ name: "validation-network",
                agents: [logicCheckerAgent],
                maxIter: 3,
              });

              const validationResult = await validationNetwork.run(
                `Validate this task completion:\n\nTask: ${task.description}\n\nOutput: ${output}`
              );

              const validation = validationResult.state.kv.get('validation');

              if (validation?.passed) {
                taskComplete = true;
                await updateTask(task.id, {
                  status: 'completed',
                  output,
                  completed_at: new Date().toISOString(),
                });

                await inngest.send({
                  name: 'workspace/progress',
                  data: {
                    projectId,
                    message: `✅ ${dbAgent.name} completed: ${task.title}`,
                    timestamp: Date.now(),
                  },
                });
              } else if (attempts < maxAttempts) {
                console.log(`[Workflow] Logic check failed (attempt ${attempts}):`, validation?.feedback);
                await inngest.send({
                  name: 'workspace/progress',
                  data: {
                    projectId,
                    message: `${dbAgent.name} is addressing validation feedback...`,
                    timestamp: Date.now(),
                  },
                });
              }
            }

            if (!taskComplete) {
              await updateTask(task.id, { status: 'failed' });
              throw new Error(`Task failed after ${maxAttempts} attempts: ${task.title}`);
            }
          })
        );
      }

      return { success: true, tasks_completed: tasks.length };
    });

    // Step 8: Mark Complete
    await step.run('complete', async () => {
      await updateExecution(execution.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      await inngest.send({
        name: 'workspace/task-complete',
        data: {
          projectId,
          summary: '🎉 Workflow completed successfully!',
          timestamp: Date.now(),
        },
      });

      console.log('[Workflow] Execution completed successfully');
    });

    return { success: true, executionId: execution.id };
  }
);
