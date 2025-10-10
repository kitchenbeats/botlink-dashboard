import { EventEmitter } from 'events';

/**
 * Global event emitter for streaming execution updates
 * This allows the orchestrator to emit events that SSE clients can listen to
 */
class ExecutionEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Allow many concurrent SSE connections
  }

  emitExecutionUpdate(executionId: string, data: {
    type: 'execution_update' | 'task_update' | 'agent_start' | 'agent_complete' | 'agent_error';
    payload: unknown;
    timestamp: string;
  }) {
    this.emit(`execution:${executionId}`, data);
  }

  subscribeToExecution(executionId: string, callback: (data: unknown) => void) {
    this.on(`execution:${executionId}`, callback);

    // Return unsubscribe function
    return () => {
      this.off(`execution:${executionId}`, callback);
    };
  }

  // Alias for better semantics
  onExecutionUpdate(executionId: string, callback: (data: unknown) => void) {
    return this.subscribeToExecution(executionId, callback);
  }
}

// Singleton instance
export const executionEvents = new ExecutionEventEmitter();
