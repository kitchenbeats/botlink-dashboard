'use server';

import { createClient } from '@/lib/supabase/server';
import { createMessage } from '@/lib/db/messages';
import { createTask, updateTask } from '@/lib/db/tasks';
import { getSystemAgentByType } from '@/lib/db/agents';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { E2BService } from '@/lib/services/e2b-service';
import { runCodingTask } from '@/lib/services/coding-agent';

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

  // SIMPLE MODE: Use coding agent with E2B sandbox
  if (mode === 'simple') {
    try {
      // Get or create sandbox for this project
      const { sandbox } = await E2BService.getOrCreateSandbox(projectId);

      // Run coding task
      const result = await runCodingTask(userMessage, {
        sandbox,
        model: 'claude',
        onProgress: (message) => {
          console.log('[Chat] Coding agent progress:', message);
          // TODO: Stream progress to client
        },
      });

      // Save assistant response
      const responseContent = result.success
        ? result.output
        : `Error: ${result.error}`;

      await createMessage({
        project_id: projectId,
        role: 'assistant',
        content: responseContent,
        metadata: {
          executionMode: mode,
          success: result.success,
        },
      });

      return { success: result.success, content: responseContent };
    } catch (error) {
      console.error('[Chat] Coding agent error:', error);
      throw error;
    }
  }

  // AGENTS MODE: Use multi-agent orchestration (existing logic)
  const plannerAgent = await getSystemAgentByType('planner');

  if (!plannerAgent) {
    throw new Error('Planner agent not found');
  }

  // Build conversation with system prompt
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: plannerAgent.system_prompt,
    },
    ...conversationHistory,
    {
      role: 'user',
      content: userMessage,
    },
  ];

  // Stream the response
  const result = await streamText({
    model: openai(plannerAgent.model),
    messages,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
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
