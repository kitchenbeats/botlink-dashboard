import { query, type Query } from '@anthropic-ai/claude-agent-sdk';
import { updateTask } from '@/lib/db';
import { getAnthropicApiKey } from '@/lib/config/env';
import { withRateLimit } from '@/lib/utils/rate-limiter';
import { getModelById } from '@/lib/config/models';
import { executeOpenAIAgent } from './openai-executor';
import { loadTool } from './tool-loader';
import type { Agent, Task, TaskStatus } from '@/lib/types';
import type { SystemAgent } from './system-agents';

const DEFAULT_MAX_ATTEMPTS = 3;

export class AgentExecutorSDK {
  private agent: Agent | SystemAgent;
  private task: Task;

  constructor(agent: Agent | SystemAgent, task: Task) {
    this.agent = agent;
    this.task = task;
  }

  async execute(): Promise<string> {
    // Wrap execution in rate limiter
    return withRateLimit(async () => {
      // Ensure API key is set in environment
      const apiKey = getAnthropicApiKey();
      if (!process.env.ANTHROPIC_API_KEY) {
        process.env.ANTHROPIC_API_KEY = apiKey;
      }

      // Build user prompt from template or use task description directly
      const userPrompt = this.buildUserPrompt(this.task.description || '');

      // Load tools for system agents
      const tools = this.getTools();

      // Use Claude Agent SDK's query function
      const queryStream: Query = query({
        prompt: userPrompt,
        options: {
          model: this.agent.model,
          systemPrompt: this.agent.system_prompt,
          ...(tools.length > 0 && {
            tools,
            // Force the specific tool use for system agents
            tool_choice: { type: 'tool', name: tools[0].name }
          }),
        },
      });

      // Collect the full response
      let fullResponse = '';
      let toolOutput: unknown = null;

      for await (const message of queryStream) {
        // Type guard for assistant messages with text content
        if (message.type === 'assistant' && message.message.content) {
          for (const content of message.message.content) {
            if (content.type === 'text') {
              fullResponse += content.text;
            } else if (content.type === 'tool_use') {
              // Tool use content - extract the structured input
              toolOutput = content.input;
            }
          }
        }
      }

      // If tool was used, return the structured output
      if (toolOutput) {
        return JSON.stringify(toolOutput);
      }

      if (!fullResponse) {
        throw new Error('No response received from Claude SDK');
      }

      return fullResponse;
    });
  }

  private getTools() {
    // Map agent types to their tool names
    const toolMap: Record<string, string> = {
      'planner': 'task-planner',
      'orchestrator': 'orchestrator',
      'logic_checker': 'logic-checker',
    };

    const toolName = toolMap[this.agent.type];
    if (!toolName) {
      return [];
    }

    try {
      const tool = loadTool(toolName);
      return [tool];
    } catch (error) {
      console.error(`Failed to load tool for ${this.agent.type}:`, error);
      return [];
    }
  }

  async executeWithRetry(maxAttempts: number = DEFAULT_MAX_ATTEMPTS): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await this.updateTaskStatus('running');

        const response = await this.execute();

        // Determine result type from agent type
        const resultType = this.getResultType();

        // Update task with output and result type
        await updateTask(this.task.id, {
          output: response,
          result_type: resultType,
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

  private getResultType(): string | null {
    // Map agent types to result types
    const resultTypeMap: Record<string, string> = {
      'planner': 'task_plan',
      'logic_checker': 'logic_check',
      'system-clarifier': 'clarification',
    };

    return resultTypeMap[this.agent.type] || null;
  }

  private buildUserPrompt(input: string): string {
    // Check if this is a SystemAgent with user_prompt_template
    if ('user_prompt_template' in this.agent && this.agent.user_prompt_template) {
      // Replace {{input}} placeholder with actual input
      return this.agent.user_prompt_template.replace(/\{\{input\}\}/g, input);
    }
    return input;
  }

  private async updateTaskStatus(status: TaskStatus): Promise<void> {
    await updateTask(this.task.id, { status });
  }
}

export async function executeAgentSDK(agent: Agent | SystemAgent, task: Task): Promise<string> {
  // Determine provider based on model
  const modelInfo = getModelById(agent.model);

  if (modelInfo?.provider === 'openai') {
    // Use OpenAI Responses API
    return executeOpenAIAgent(agent, task);
  }

  // Default to Anthropic Agent SDK
  const executor = new AgentExecutorSDK(agent, task);
  return executor.executeWithRetry();
}
