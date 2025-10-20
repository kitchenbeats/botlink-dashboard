'use server';

import { createClient } from '@/lib/clients/supabase/server';
import { createMessage } from '@/lib/db/messages';
import { createTask, updateTask } from '@/lib/db/tasks';
import { getSystemAgentByType } from '@/lib/db/agents';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { E2BService } from '@/lib/services/e2b-service';
import { publishWorkspaceMessage } from '@/lib/services/redis-realtime';
import { getProject } from '@/lib/db/projects';
import {
  startClaudeSession,
  sendToClaudeSession,
  getClaudeSession,
} from '@/lib/services/claude-session-manager';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

type ExecutionMode = 'simple' | 'agents';

/**
 * Send a message and get AI response with streaming
 */
export async function sendChatMessage(
  projectId: string,
  userMessage: string,
  conversationHistory: ChatMessage[],
  mode: ExecutionMode = 'simple'
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Save user message to database
  await createMessage({
    project_id: projectId,
    role: 'user',
    content: userMessage,
    metadata: { executionMode: mode },
  });

  // SIMPLE MODE: Interactive Claude Code session with persistent context
  if (mode === 'simple') {
    try {
      // Get project to find template and working directory
      const project = await getProject(projectId);
      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      // Get or create sandbox for this project
      const { sandbox } = await E2BService.getOrCreateSandbox(projectId, supabase);

      // Get working directory for this template
      const workDir = E2BService.getTemplateWorkDir(project.template);

      // Check if we have an active Claude session
      let session = getClaudeSession(projectId);

      // If no session exists, start one
      if (!session) {
        console.log('[Chat] Starting new Claude session for project:', projectId);
        session = await startClaudeSession({
          sandbox,
          projectId,
          workDir,
        });
      }

      // Send the user's message to Claude
      await sendToClaudeSession(sandbox, projectId, userMessage);

      // Response will stream via Redis pubsub (handled by claude-session-manager)
      // The chat UI subscribes to 'claude-output' and 'file-change' topics

      return {
        success: true,
        content: 'Message sent to Claude. Response streaming via realtime connection.',
        sessionId: session.id,
      };
    } catch (error) {
      console.error('[Chat] Simple agent error:', error);

      // Save error message
      await createMessage({
        project_id: projectId,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          executionMode: mode,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  // AGENTS MODE: Use workflow orchestration with dynamic agents
  try {
    const { runWorkflowAgents } = await import('./workspace');

    // Trigger workflow orchestration
    const result = await runWorkflowAgents(projectId, userMessage);

    if (!result.success) {
      throw new Error('Failed to start workflow orchestration');
    }

    // Return success response with execution ID
    return {
      success: true,
      content: '🤖 Starting workflow orchestration with specialized agents...',
      executionId: result.executionId,
    };
  } catch (error) {
    console.error('[Chat] Workflow orchestration error:', error);
    throw error;
  }
}

/**
 * Execute a planned task
 */
export async function executeTask(
  projectId: string,
  taskId: string,
  taskDescription: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Update task to running
  await updateTask(taskId, { status: 'running' });

  try {
    // Get the executor agent
    const executorAgent = await getSystemAgentByType('executor');

    if (!executorAgent) {
      throw new Error('Executor agent not found');
    }

    // Execute the task with the executor agent
    const result = await streamText({
      model: openai(executorAgent.model),
      messages: [
        {
          role: 'system',
          content: executorAgent.system_prompt,
        },
        {
          role: 'user',
          content: `Execute this task: ${taskDescription}`,
        },
      ],
      temperature: 0.5,
    });

    // Mark task as completed
    await updateTask(taskId, { status: 'completed' });

    return result.toTextStreamResponse();
  } catch (error) {
    // Mark task as failed
    await updateTask(taskId, { status: 'failed' });
    throw error;
  }
}
