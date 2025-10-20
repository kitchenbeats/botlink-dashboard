/**
 * Inngest Functions for Workspace Agent Execution
 * Based on: https://github.com/inngest/agent-kit/tree/main/examples/realtime-ui-nextjs
 */

import { inngest, workspaceChannel } from './client';
import { createCodingAgent } from '../services/coding-agent';
import { E2BService } from '../services/e2b-service';
import { createMessage } from '../db/messages';
import { createClient } from '@/lib/clients/supabase/server';

/**
 * Simple Agent Function - Direct code execution with E2B sandbox
 */
export const simpleAgentFunction = inngest.createFunction(
  {
    id: 'workspace-simple-agent',
    name: 'Workspace Simple Agent',
  },
  { event: 'workspace/agent/run' },
  async ({ event, step }) => {
    const { projectId, query } = event.data;
    const channel = workspaceChannel(projectId);

    // Get authenticated Supabase client (works in Inngest just like server actions)
    const supabase = await createClient();

    // Step 1: Publish running status
    await step.run('publish-status-running', async () => {
      await inngest.send({
        name: 'workspace/progress',
        data: {
          projectId,
          message: 'Starting agent...',
          timestamp: Date.now(),
        },
      });
    });

    // Step 2: Get or create sandbox
    // NOTE: Sandbox instance cannot be serialized through step.run()
    // so we get it directly without wrapping in a step
    // Use authenticated client with user's access token
    const { sandbox, session } = await E2BService.getOrCreateSandbox(projectId, supabase);

    // Step 3: Create and run coding agent with streaming
    const result = await step.run('run-coding-agent', async () => {
      const network = await createCodingAgent({
        sandbox,
        projectId,
        model: 'claude',
        maxIterations: 15,
        onProgress: async (message: string) => {
          // Stream progress updates
          await inngest.send({
            name: 'workspace/progress',
            data: {
              projectId,
              message,
              timestamp: Date.now(),
            },
          });
        },
      });

      // Execute the network
      const output = await network.run(query);

      return {
        success: true,
        output: output.state.kv.get('task_summary') as string || 'Task completed',
      };
    });

    // Step 4: Save assistant message
    await step.run('save-message', async () => {
      await createMessage({
        project_id: projectId,
        role: 'assistant',
        content: result.output,
        metadata: {
          executionMode: 'simple',
          success: result.success,
        },
      });
    });

    // Step 5: Publish completion status
    await step.run('publish-status-completed', async () => {
      await inngest.send({
        name: 'workspace/task-complete',
        data: {
          projectId,
          summary: result.output,
          timestamp: Date.now(),
        },
      });
    });

    return result;
  }
);

/**
 * Export all functions for registration
 */
import { workflowOrchestrationFunction } from './workflow-function';

export const functions = [simpleAgentFunction, workflowOrchestrationFunction];
