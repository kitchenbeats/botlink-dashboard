/**
 * Agent-Kit Event Emitter
 *
 * Emulates Inngest's Agent-Kit event streaming using Redis pub/sub.
 * Based on Agent-Kit event types: https://agentkit.inngest.com/advanced-patterns/legacy-ui-streaming
 */

import { publishWorkspaceMessage } from './redis-realtime';

export type AgentEventType =
  | 'run.started'      // Agent execution started
  | 'run.completed'    // Agent execution finished
  | 'run.failed'       // Agent execution failed
  | 'text.delta'       // Streaming text chunk
  | 'text.completed'   // Full text message completed
  | 'tool.called'      // Tool invocation started
  | 'tool.completed'   // Tool execution finished
  | 'tool.failed'      // Tool execution failed
  | 'part.created'     // New message part created
  | 'step.started'     // Multi-step tool step started
  | 'step.completed'   // Multi-step tool step completed
  | 'step.failed';     // Multi-step tool step failed

export interface AgentEvent {
  type: AgentEventType;
  timestamp: number;
  data: any;
}

export class AgentEventEmitter {
  constructor(private projectId: string) {}

  /**
   * Emit a run.started event
   */
  async emitRunStarted(data: { agentName: string; prompt: string }) {
    await this.emit('run.started', data);
  }

  /**
   * Emit a run.completed event
   */
  async emitRunCompleted(data: { agentName: string; output: string; duration?: number }) {
    await this.emit('run.completed', data);
  }

  /**
   * Emit a run.failed event
   */
  async emitRunFailed(data: { agentName: string; error: string }) {
    await this.emit('run.failed', data);
  }

  /**
   * Emit a text.delta event (streaming text chunk)
   */
  async emitTextDelta(data: { text: string; role?: 'assistant' | 'user' }) {
    await this.emit('text.delta', data);
  }

  /**
   * Emit a text.completed event
   */
  async emitTextCompleted(data: { text: string; role?: 'assistant' | 'user' }) {
    await this.emit('text.completed', data);
  }

  /**
   * Emit a tool.called event
   */
  async emitToolCalled(data: { name: string; args: any }) {
    await this.emit('tool.called', data);
  }

  /**
   * Emit a tool.completed event
   */
  async emitToolCompleted(data: { name: string; result: any; duration?: number }) {
    await this.emit('tool.completed', data);
  }

  /**
   * Emit a tool.failed event
   */
  async emitToolFailed(data: { name: string; error: string }) {
    await this.emit('tool.failed', data);
  }

  /**
   * Emit a step.started event (for multi-step tools)
   */
  async emitStepStarted(data: { toolName: string; step: number; total: number; description: string }) {
    await this.emit('step.started', data);
  }

  /**
   * Emit a step.completed event (for multi-step tools)
   */
  async emitStepCompleted(data: { toolName: string; step: number; total: number; description: string }) {
    await this.emit('step.completed', data);
  }

  /**
   * Emit a step.failed event (for multi-step tools)
   */
  async emitStepFailed(data: { toolName: string; step: number; total: number; error: string }) {
    await this.emit('step.failed', data);
  }

  /**
   * Generic emit method - publishes to Redis
   */
  private async emit(type: AgentEventType, data: any) {
    const event: AgentEvent = {
      type,
      timestamp: Date.now(),
      data,
    };

    // Publish to Redis stream
    await publishWorkspaceMessage(this.projectId, 'agent-event', event);
  }
}

/**
 * Helper to create an event emitter for a project
 */
export function createAgentEventEmitter(projectId: string): AgentEventEmitter {
  return new AgentEventEmitter(projectId);
}
