/**
 * Chat V2 Service
 * Handles all chat API communication
 */

import type { ExecutionMode, ReviewMode } from './types'

export interface SendMessageOptions {
  projectId: string
  message: string
  mode?: ExecutionMode
  reviewMode?: ReviewMode
  maxIterations?: number
  coderModel?: string
  reviewerModel?: string
  maxToolCalls?: number
  conversationId?: string
}

export interface SendMessageResponse {
  success: boolean
  content: string
  structured?: {
    summary: string
    fileChanges: Array<{
      path: string
      action: 'created' | 'updated' | 'deleted'
      language?: string
    }>
    commandsRun: Array<{
      command: string
      output: string
      success: boolean
    }>
    toolsUsed: string[]
    thinkingProcess?: string
    errors: string[]
  }
}

export class ChatService {
  /**
   * Send a message to the agent
   */
  static async sendMessage(options: SendMessageOptions): Promise<SendMessageResponse> {
    const {
      projectId,
      message,
      mode = 'simple',
      reviewMode = 'off',
      maxIterations,
      coderModel,
      reviewerModel,
      maxToolCalls,
      conversationId
    } = options

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        message,
        mode,
        reviewMode,
        maxIterations,
        coderModel,
        reviewerModel,
        maxToolCalls,
        conversationId,
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send message')
    }

    return response.json()
  }

  /**
   * Load chat history from database
   */
  static async loadHistory(projectId: string, conversationId?: string): Promise<Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    created_at: string
    metadata?: Record<string, unknown>
  }>> {
    const url = conversationId
      ? `/api/projects/${projectId}/messages?conversationId=${conversationId}`
      : `/api/projects/${projectId}/messages`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to load chat history')
    }

    return response.json()
  }

  /**
   * Stop an ongoing agent execution
   */
  static async stopAgent(projectId: string): Promise<void> {
    const response = await fetch('/api/chat/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to stop agent')
    }
  }

  /**
   * Save a message to the database (for real-time messages)
   */
  static async saveMessage(options: {
    projectId: string
    conversationId: string
    role: 'user' | 'assistant' | 'system'
    content: string
    metadata?: Record<string, unknown>
  }): Promise<void> {
    const response = await fetch(`/api/projects/${options.projectId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: options.conversationId,
        role: options.role,
        content: options.content,
        metadata: options.metadata || {},
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[ChatService] Failed to save message:', error)
      // Don't throw - we don't want to interrupt the UI if message save fails
    }
  }
}
