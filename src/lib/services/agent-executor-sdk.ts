import { query, type Query } from '@anthropic-ai/claude-agent-sdk';
import { updateTask } from '@/lib/db/tasks';
import type { Agent, Task } from '@/lib/types/database';
import type { SystemAgent } from './system-agents-config';

const DEFAULT_MAX_ATTEMPTS = 3;

export class AgentExecutorSDK {
  private agent: Agent | SystemAgent;
  private task: Task;

  constructor(agent: Agent | SystemAgent, task: Task) {
    this.agent = agent;
    this.task = task;
  }

  async execute(): Promise<string> {
    // Ensure API key is set in environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Build user prompt from template or use task description directly
    const userPrompt = this.buildUserPrompt(this.task.description || '');

    // Use Claude Agent SDK's query function (no tools for now - simplified)
    const queryStream: Query = query({
      prompt: userPrompt,
      options: {
        model: this.agent.model,
        systemPrompt: this.agent.system_prompt,
      },
    });

    // Collect the full response
    let fullResponse = '';

    for await (const message of queryStream) {
      // Type guard for assistant messages with text content
      if (message.type === 'assistant' && message.message.content) {
        for (const content of message.message.content) {
          if (content.type === 'text') {
            fullResponse += content.text;
          }
        }
      }
    }

    if (!fullResponse) {
      throw new Error('No response received from Claude SDK');
    }

    return fullResponse;
  }

  async executeWithRetry(maxAttempts: number = DEFAULT_MAX_ATTEMPTS): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await this.updateTaskStatus('running');

        const response = await this.execute();

        // Update task with output
        await updateTask(this.task.id, {
          output: response,
        });

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Track attempts
        await updateTask(this.task.id, {
          attempts: attempt + 1,
        });

        // If this isn't the last attempt, continue
        if (attempt < maxAttempts - 1) {
          continue;
        }
      }
    }

    // All attempts failed
    await this.updateTaskStatus('failed');
    throw lastError || new Error('Task execution failed');
  }

  private buildUserPrompt(input: string): string {
    // Check if this is a SystemAgent with user_prompt_template
    if ('user_prompt_template' in this.agent && this.agent.user_prompt_template) {
      // Replace {{input}} placeholder with actual input
      return this.agent.user_prompt_template.replace(/\{\{input\}\}/g, input);
    }
    return input;
  }

  private async updateTaskStatus(status: 'pending' | 'running' | 'completed' | 'failed'): Promise<void> {
    await updateTask(this.task.id, { status });
  }
}

export async function executeAgentSDK(agent: Agent | SystemAgent, task: Task): Promise<string> {
  // Use Anthropic Agent SDK
  const executor = new AgentExecutorSDK(agent, task);
  return executor.executeWithRetry();
}
