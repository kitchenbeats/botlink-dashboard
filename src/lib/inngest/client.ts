/**
 * Inngest Client Configuration
 * Used for realtime streaming and event-driven workflows
 */

import { realtimeMiddleware } from '@inngest/realtime/middleware'
import { EventSchemas, Inngest } from 'inngest'

type Events = {
  'workspace/progress': {
    data: {
      projectId: string
      message: string
      timestamp: number
    }
  }
  'workspace/file-changed': {
    data: {
      projectId: string
      path: string
      action: 'create' | 'update' | 'delete'
      timestamp: number
    }
  }
  'workspace/terminal-output': {
    data: {
      projectId: string
      command: string
      output: string
      timestamp: number
    }
  }
  'workspace/task-complete': {
    data: {
      projectId: string
      summary: string
      timestamp: number
    }
  }
  // Simple agent run event
  'workspace/agent/run': {
    data: {
      projectId: string
      query: string
      mode: 'simple' | 'agents'
    }
  }
  // Workflow agent run event
  'workspace/workflow/run': {
    data: {
      projectId: string
      query: string
      workflowId?: string
      executionId: string
    }
  }
  // Workflow resume event (human approval)
  'workspace/workflow/resume': {
    data: {
      executionId: string
      approved: boolean
      approvedBy: string
      approvedAt: string
    }
  }
}

export const inngest = new Inngest({
  id: 'reactwrite-workspace',
  schemas: new EventSchemas().fromRecord<Events>(),
  middleware: [realtimeMiddleware()],
})

/**
 * Create a channel for workspace realtime updates
 * Pattern: workspace-{projectId}
 */
export function workspaceChannel(projectId: string) {
  return `workspace-${projectId}`
}
