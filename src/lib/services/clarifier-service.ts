import Anthropic from '@anthropic-ai/sdk';
import { getSystemAgentById } from './system-agents';
import { loadTool } from './tool-loader';
import { updateExecution } from '@/lib/db';
import { getAnthropicApiKey } from '@/lib/config/env';
import type { Execution } from '@/lib/types';

interface ClarificationResult {
  status: 'needs_clarification' | 'ready';
  questions: string[];
  summary: string;
}

export async function processClarification(
  teamId: string,
  execution: Execution,
  conversationHistory?: string
): Promise<ClarificationResult> {
  const clarifierAgent = getSystemAgentById('system-clarifier');
  if (!clarifierAgent) {
    throw new Error('Clarifier system agent not found');
  }

  // Build prompt with conversation history if available
  let prompt = execution.input;
  if (conversationHistory) {
    prompt += `\n\nPrevious conversation:\n${conversationHistory}`;
  }

  // Load tool definition
  const tool = loadTool('clarifier');

  // Use Anthropic SDK with tool calling for guaranteed JSON structure
  const anthropic = new Anthropic({
    apiKey: getAnthropicApiKey(),
  });

  const response = await anthropic.messages.create({
    model: clarifierAgent.model,
    max_tokens: 1024,
    system: clarifierAgent.system_prompt,
    tools: [tool],
    tool_choice: { type: 'tool', name: tool.name },
    messages: [{
      role: 'user',
      content: prompt,
    }],
  });

  // Extract tool use result
  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('No tool use in response');
  }

  const result = toolUse.input as ClarificationResult;

  // If ready, update execution to pending to start orchestrator
  if (result.status === 'ready') {
    await updateExecution(execution.id, {
      status: 'pending',
      output: JSON.stringify({ clarification_summary: result.summary }),
    });
  }

  return result;
}
