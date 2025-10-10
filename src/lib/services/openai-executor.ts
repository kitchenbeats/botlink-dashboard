import OpenAI from 'openai';
import { updateTask } from '@/lib/db';
import { getOpenAIApiKey } from '@/lib/config/env';
import { withRateLimit } from '@/lib/utils/rate-limiter';
import type { Agent, Task, TaskStatus } from '@/lib/types';
import type { SystemAgent } from './system-agents';

const DEFAULT_MAX_ATTEMPTS = 3;

export class OpenAIExecutor {
  private agent: Agent | SystemAgent;
  private task: Task;
  private client: OpenAI;

  constructor(agent: Agent | SystemAgent, task: Task) {
    this.agent = agent;
    this.task = task;

    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    this.client = new OpenAI({ apiKey });
  }

  async execute(): Promise<string> {
    return withRateLimit(async () => {
      const userPrompt = this.buildUserPrompt(this.task.input);

      // Use OpenAI Responses API
      const response = await this.client.responses.create({
        model: this.agent.model,
        instructions: this.agent.system_prompt,
        input: userPrompt,
        // Add any tools if needed in the future
        // tools: this.getTools(),
      });

      // Extract text from response output
      let fullResponse = '';

      for (const item of response.output) {
        if (item.type === 'message') {
          fullResponse += item.content;
        }
      }

      if (!fullResponse) {
        throw new Error('No response received from OpenAI Responses API');
      }

      return fullResponse;
    });
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
    if (this.agent.user_prompt_template) {
      return this.agent.user_prompt_template.replace(/\{\{input\}\}/g, input);
    }
    return input;
  }

  private async updateTaskStatus(status: TaskStatus): Promise<void> {
    await updateTask(this.task.id, { status });
  }
}

export async function executeOpenAIAgent(agent: Agent | SystemAgent, task: Task): Promise<string> {
  const executor = new OpenAIExecutor(agent, task);
  return executor.executeWithRetry();
}
