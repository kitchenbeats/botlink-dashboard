import { Agent, Task } from './database';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface AgentExecutionContext {
  agent: Agent;
  task: Task;
  messages: Message[];
}

export interface TaskPlannerOutput {
  tasks: {
    title: string;
    description: string;
    estimated_complexity: 'low' | 'medium' | 'high';
    dependencies: number[];
  }[];
  overall_strategy: string;
}

export interface OrchestratorAgentCreation {
  name: string;
  system_prompt: string;
  user_prompt_template: string;
  model: string;
  config: {
    temperature?: number;
    max_tokens?: number;
  };
}

export interface OrchestratorOutput {
  agents: OrchestratorAgentCreation[];
  task_assignments: {
    task_index: number;
    agent_index: number;
  }[];
}
