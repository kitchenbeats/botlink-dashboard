'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'
import { ChatService } from '@/lib/services/chat-v2/chat-service'
import { useRedisStream } from '@/lib/hooks/use-redis-stream'
import type { ChatMessage, ExecutionMode, ReviewMode, StructuredResponse, FileChange } from '@/lib/services/chat-v2/types'
import { toast } from 'sonner'
import { ConversationSelector } from '../conversation-selector'
import { createNewConversation } from '@/server/actions/conversations'
import { generateConversationTitle } from '@/lib/utils/conversation-title'

interface ChatV2Props {
  projectId: string
  currentConversationId: string | null
  onConversationChange: (conversationId: string) => void
}

export function ChatV2({ projectId, currentConversationId, onConversationChange }: ChatV2Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Connect to Redis stream for real-time updates
  const { latestMessage, isConnected, error: streamError } = useRedisStream({
    projectId,
    enabled: true,
  })

  // Debug logging
  useEffect(() => {
    console.log('[Chat V2] Redis Stream Status:', { isConnected, streamError, projectId })
  }, [isConnected, streamError, projectId])

  const loadHistory = useCallback(async () => {
    // Only load if we have a conversation selected
    if (!currentConversationId) {
      setMessages([])
      return
    }

    try {
      const history = await ChatService.loadHistory(projectId, currentConversationId)

      const chatMessages: ChatMessage[] = history.map((msg) => ({
        id: msg.id,
        role: msg.role === 'system' ? 'assistant' : msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        structured: msg.metadata?.structured as StructuredResponse | undefined
      }))

      setMessages(chatMessages)
    } catch (err) {
      console.error('Failed to load chat history:', err)
      setError('Failed to load chat history')
    }
  }, [projectId, currentConversationId])

  // Load chat history when conversation changes
  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Handle Agent-Kit events (run.started, tool.called, step.started, etc.)
  const handleAgentEvent = (event: { type: string; timestamp: number; data: any }) => {
    console.log('[Chat V2] Agent event:', event)

    switch (event.type) {
      case 'run.started':
        setIsLoading(true)
        toast.info(`${event.data.agentName} started`)
        break

      case 'run.completed':
        setIsLoading(false)
        if (event.data.duration) {
          toast.success(`Completed in ${(event.data.duration / 1000).toFixed(1)}s`)
        }
        break

      case 'run.failed':
        setIsLoading(false)
        toast.error(`Agent failed: ${event.data.error}`)
        break

      case 'tool.called':
        toast.info(`Running: ${event.data.name}`)
        break

      case 'tool.completed':
        // Don't spam UI, just log
        console.log('[Chat V2] Tool completed:', event.data.name)
        break

      case 'tool.failed':
        toast.error(`Tool failed: ${event.data.name}`)
        break

      case 'step.started':
        // Multi-step tool progress
        toast.info(`[${event.data.step}/${event.data.total}] ${event.data.description}`, {
          id: `step-${event.data.toolName}`, // Same ID updates existing toast
        })
        break

      case 'step.completed':
        // Update the toast with success
        toast.success(`[${event.data.step}/${event.data.total}] ${event.data.description}`, {
          id: `step-${event.data.toolName}`,
        })
        break

      case 'step.failed':
        toast.error(`Step ${event.data.step} failed: ${event.data.error}`, {
          id: `step-${event.data.toolName}`,
        })
        break
    }
  }

  // Handle real-time updates from Redis stream
  useEffect(() => {
    if (!latestMessage) return
    console.log('[Chat V2] Received message:', latestMessage)

    if (latestMessage.type !== 'message') return

    // Handle Agent-Kit events
    if (latestMessage.topic === 'agent-event') {
      const event = latestMessage.data as {
        type: string
        timestamp: number
        data: any
      }

      handleAgentEvent(event)
      return
    }

    // Handle file changes - ADD NEW CARD
    if (latestMessage.topic === 'file-changes') {
      const data = latestMessage.data as { path?: string; action?: string }

      if (data?.path && data.action && currentConversationId) {
        const content = `${data.action === 'created' ? '📝 Created' : data.action === 'updated' ? '✏️ Updated' : '🗑️ Deleted'}: ${data.path}`
        const structured = {
          summary: '',
          fileChanges: [{
            path: data.path,
            action: data.action as 'created' | 'updated' | 'deleted',
            language: data.path.split('.').pop() || undefined,
          }],
          commandsRun: [],
          toolsUsed: [],
          thinkingProcess: '',
          errors: [],
        }

        const fileChangeMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content,
          timestamp: new Date(),
          structured,
        }

        setMessages(prev => [...prev, fileChangeMessage])

        // Save to database
        ChatService.saveMessage({
          projectId,
          conversationId: currentConversationId,
          role: 'assistant',
          content,
          metadata: { structured },
        })
      }
    }

    // Handle review results
    if (latestMessage.topic === 'review-result') {
      const data = latestMessage.data as {
        approved?: boolean
        iteration?: number
        feedback?: string
        willRetry?: boolean
      }

      if (data && typeof data.approved !== 'undefined' && currentConversationId) {
        // Add review message to chat
        const content = data.approved
          ? `✅ **Code Review Passed** (Iteration ${data.iteration})\n\n${data.feedback}`
          : `🔍 **Code Review Feedback** (Iteration ${data.iteration})\n\n${data.feedback}${data.willRetry ? '\n\n🔄 Making corrections...' : ''}`

        const reviewMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content,
          timestamp: new Date(),
        }

        setMessages(prev => [...prev, reviewMessage])

        // Save to database
        ChatService.saveMessage({
          projectId,
          conversationId: currentConversationId,
          role: 'assistant',
          content,
          metadata: { reviewResult: data },
        })
      }
    }

    // Handle agent stopped event
    if (latestMessage.topic === 'agent-stopped') {
      const data = latestMessage.data as { reason?: string }

      setIsLoading(false)

      if (currentConversationId) {
        // Add stop message to chat
        const content = `⏹️ **Agent Stopped**\n\n${data.reason || 'Execution was stopped by user request.'}`

        const stopMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content,
          timestamp: new Date(),
        }

        setMessages(prev => [...prev, stopMessage])

        // Save to database
        ChatService.saveMessage({
          projectId,
          conversationId: currentConversationId,
          role: 'assistant',
          content,
          metadata: { agentStopped: data },
        })
      }
    }

    // Handle terminal/progress updates - ADD NEW CARD
    if (latestMessage.topic === 'terminal') {
      const data = latestMessage.data as { output?: string; command?: string }

      if (data?.output && currentConversationId) {
        const structured = {
          summary: '',
          fileChanges: [],
          commandsRun: data.command ? [{
            command: data.command,
            output: data.output,
            success: true
          }] : [],
          toolsUsed: [],
          thinkingProcess: '',
          errors: [],
        }

        const terminalMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.output,
          timestamp: new Date(),
          structured,
        }

        setMessages(prev => [...prev, terminalMessage])

        // Save to database
        ChatService.saveMessage({
          projectId,
          conversationId: currentConversationId,
          role: 'assistant',
          content: data.output,
          metadata: { structured },
        })
      }
    }
  }, [latestMessage, currentConversationId, projectId])

  const handleSend = async (
    content: string,
    mode: ExecutionMode,
    reviewMode: ReviewMode,
    maxIterations?: number,
    coderModel?: string,
    reviewerModel?: string,
    maxToolCalls?: number
  ) => {
    // Auto-create conversation if none selected (instead of showing error)
    let conversationId = currentConversationId;

    if (!conversationId) {
      console.log('[Chat V2] No conversation selected - auto-creating one');

      try {
        // Generate meaningful title from user's prompt
        const title = generateConversationTitle(content);

        // Create new conversation
        const result = await createNewConversation({
          projectId,
          name: title,
          description: 'Auto-created conversation',
        });

        if (result?.data?.conversation) {
          conversationId = result.data.conversation.id;

          // Update parent component to select this conversation
          onConversationChange(conversationId);

          console.log('[Chat V2] Auto-created conversation:', conversationId, 'with title:', title);
          toast.success(`Started new conversation: "${title}"`);
        } else {
          throw new Error('Failed to create conversation');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create conversation';
        toast.error(errorMsg);
        console.error('[Chat V2] Failed to auto-create conversation:', err);
        return;
      }
    }

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      const response = await ChatService.sendMessage({
        projectId,
        message: content,
        mode,
        reviewMode,
        maxIterations,
        coderModel,
        reviewerModel,
        maxToolCalls,
        conversationId: conversationId, // Use local variable (might be newly created)
      })

      // Add final response as NEW CARD (summary message)
      const finalMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        structured: response.structured,
      }

      setMessages(prev => [...prev, finalMessage])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send message'
      setError(errorMsg)

      // Add error as NEW CARD
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${errorMsg}`,
        timestamp: new Date(),
        structured: {
          summary: '',
          fileChanges: [],
          commandsRun: [],
          toolsUsed: [],
          thinkingProcess: '',
          errors: [errorMsg],
        }
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleStop = async () => {
    try {
      await ChatService.stopAgent(projectId)
      toast.success('Stopping agent...')
    } catch (err) {
      console.error('Failed to stop agent:', err)
      toast.error('Failed to stop agent')
    }
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-950 to-black">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="px-4 py-3 space-y-3">
          {/* Conversation Selector - Top Position */}
          <ConversationSelector
            projectId={projectId}
            currentConversationId={currentConversationId}
            onConversationChange={onConversationChange}
          />

          {/* Status Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
              <div>
                <h2 className="text-sm font-semibold text-gray-100">AI Assistant</h2>
                <p className="text-xs text-gray-500">
                  {isLoading ? 'Thinking...' : 'Ready to help'}
                </p>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      <ChatInput onSend={handleSend} onStop={handleStop} isLoading={isLoading} />
    </div>
  )
}
