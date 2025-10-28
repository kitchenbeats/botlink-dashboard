'use server';

import { createClient } from '@/lib/clients/supabase/server';
import { createMessage, listMessages } from '@/lib/db/messages';
import { createTask, updateTask } from '@/lib/db/tasks';
import { getSystemAgentByType } from '@/lib/db/agents';
import type { Tables } from '@/types/database.types';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { E2BService } from '@/lib/services/e2b-service';
import { publishWorkspaceMessage } from '@/lib/services/redis-realtime';
import { getProject } from '@/lib/db/projects';
import { runCodingTask } from '@/lib/services/coding-agent';
import { saveConversationToFile, convertMessagesToHistory } from '@/lib/services/conversation-history';
import type { ProjectTemplate } from '@/lib/types/database';

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
  mode: ExecutionMode = 'simple',
  reviewMode: 'off' | 'limited' | 'loop' = 'off',
  maxIterations?: number,
  conversationId?: string,
  coderModel?: string,
  reviewerModel?: string,
  maxToolCalls?: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  if (!conversationId) {
    throw new Error('Conversation ID is required');
  }

  // Save user message to database
  await createMessage({
    project_id: projectId,
    conversation_id: conversationId,
    role: 'user',
    content: userMessage,
    metadata: { executionMode: mode },
  });

  // SIMPLE MODE: Use Inngest Agent-Kit coding agent with E2B tools
  if (mode === 'simple') {
    try {
      // Get project to find template and working directory
      const projectData = await getProject(projectId);
      if (!projectData) {
        throw new Error(`Project ${projectId} not found`);
      }
      const project = projectData as Tables<'projects'>

      // Get existing sandbox (should already be created by workspace page)
      const sandboxResult = await E2BService.getSandbox(projectId, supabase);
      if (!sandboxResult) {
        throw new Error('No active sandbox. Please refresh the workspace.');
      }
      const { sandbox } = sandboxResult;

      // Get working directory for this template
      const workDir = E2BService.getTemplateWorkDir(project.template);

      // Save conversation history to sandbox file BEFORE running agent
      // This includes all previous messages + the new user message
      try {
        const allMessages = await listMessages(projectId, conversationId);
        await saveConversationToFile(sandbox, workDir, allMessages);
      } catch (error) {
        console.error('[Chat] Failed to save conversation before agent run:', error);
      }

      // Run coding task using Inngest Agent-Kit
      // User's slider = max review cycles (coder → reviewer → repeat)
      // Agent should finish in 1-2 cycles ideally, but can go up to user's max
      const result = await runCodingTask(userMessage, {
        sandbox,
        projectId,
        template: project.template as ProjectTemplate, // Template-specific prompt configuration
        workDir,
        model: coderModel, // User-selected model for coder (e.g., 'claude-haiku-4-5', 'claude-sonnet-4-5', 'gpt-5-mini', 'gpt-5')
        reviewerModel: reviewerModel, // User-selected model for reviewer
        reviewMode, // User-selected review mode
        maxReviewIterations: maxIterations || 3, // USER CONTROLS: Max review cycles
        maxIterations: maxToolCalls || 30, // USER CONTROLS: Max tool calls per round
      });

      // Save assistant response
      await createMessage({
        project_id: projectId,
        conversation_id: conversationId,
        role: 'assistant',
        content: result.output,
        metadata: {
          executionMode: mode,
          success: result.success,
          error: result.error,
        },
      });

      // Save full conversation history to sandbox file
      try {
        const allMessages = await listMessages(projectId, conversationId);
        await saveConversationToFile(sandbox, workDir, allMessages);
      } catch (error) {
        console.error('[Chat] Failed to save conversation to file:', error);
        // Don't fail the request if file save fails
      }

      return {
        success: result.success,
        content: result.output,
        structured: result.structured,
      };
    } catch (error) {
      console.error('[Chat] Simple agent error:', error);

      // Save error message
      await createMessage({
        project_id: projectId,
        conversation_id: conversationId,
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

  // AGENTS MODE: Use orchestrator with dynamic agent creation
  try {
    // Get project to find template and working directory
    const project = await getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Get existing sandbox (should already be created by workspace page)
    const sandboxResult = await E2BService.getSandbox(projectId, supabase);
    if (!sandboxResult) {
      throw new Error('No active sandbox. Please refresh the workspace.');
    }
    const { sandbox } = sandboxResult;

    // Get working directory for this template
    const workDir = E2BService.getTemplateWorkDir(project.template);

    // Save conversation history to sandbox file BEFORE running orchestrator
    try {
      const allMessages = await listMessages(projectId, conversationId);
      await saveConversationToFile(sandbox, workDir, allMessages);
    } catch (error) {
      console.error('[Chat] Failed to save conversation before orchestrator:', error);
    }

    // Run orchestrator task with dynamic agent creation
    const { runOrchestratorTask } = await import('@/lib/services/orchestrator-agent');

    const result = await runOrchestratorTask(userMessage, {
      projectId,
      sandbox,
      workDir,
      model: coderModel || 'claude-sonnet-4-5', // Orchestrator uses more powerful model
      maxIterations: maxToolCalls || 30,
    });

    // Save assistant response
    await createMessage({
      project_id: projectId,
      conversation_id: conversationId,
      role: 'assistant',
      content: result.output,
      metadata: {
        executionMode: mode,
        success: result.success,
        error: result.error,
      },
    });

    // Save full conversation history to sandbox file
    try {
      const allMessages = await listMessages(projectId, conversationId);
      await saveConversationToFile(sandbox, workDir, allMessages);
    } catch (error) {
      console.error('[Chat] Failed to save conversation to file:', error);
    }

    return {
      success: result.success,
      content: result.output,
    };
  } catch (error) {
    console.error('[Chat] Orchestrator error:', error);

    // Save error message
    await createMessage({
      project_id: projectId,
      conversation_id: conversationId,
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
