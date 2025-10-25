'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'
import { ChatService } from '@/lib/services/chat-v2/chat-service'
import { useRedisStream } from '@/lib/hooks/use-redis-stream'
import type { ChatMessage, ExecutionMode, ReviewMode, StructuredResponse, FileChange } from '@/lib/services/chat-v2/types'
import { toast } from 'sonner'

interface ChatV2Props {
  projectId: string
}

export function ChatV2({ projectId }: ChatV2Props) {
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
    try {
      const history = await ChatService.loadHistory(projectId)

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
  }, [projectId])

  // Load chat history on mount
  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Handle real-time updates from Redis stream
  useEffect(() => {
    if (!latestMessage) return
    console.log('[Chat V2] Received message:', latestMessage)

    if (latestMessage.type !== 'message') return

    // Handle file changes
    if (latestMessage.topic === 'file-changes') {
      const data = latestMessage.data as { path?: string; action?: string }

      if (data?.path && data.action) {
        setMessages((prev) => {
          const lastIndex = prev.length - 1
          if (lastIndex < 0) return prev
          const lastMsg = prev[lastIndex]

          if (!lastMsg || lastMsg.role !== 'assistant' || !lastMsg.isStreaming || !lastMsg.structured) return prev
          if (!data.path) return prev // Type guard

          const fileChange: FileChange = {
            path: data.path,
            action: data.action as 'created' | 'updated' | 'deleted',
            language: data.path.split('.').pop() || undefined,
          }

          const exists = lastMsg.structured.fileChanges.some(fc => fc.path === data.path)
          if (exists) return prev

          const updatedMsg: ChatMessage = {
            ...lastMsg,
            structured: {
              ...lastMsg.structured,
              fileChanges: [...lastMsg.structured.fileChanges, fileChange],
            },
          }

          return [...prev.slice(0, -1), updatedMsg]
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

      if (data && typeof data.approved !== 'undefined') {
        // Add review message to chat
        const reviewMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.approved
            ? `✅ **Code Review Passed** (Iteration ${data.iteration})\n\n${data.feedback}`
            : `🔍 **Code Review Feedback** (Iteration ${data.iteration})\n\n${data.feedback}${data.willRetry ? '\n\n🔄 Making corrections...' : ''}`,
          timestamp: new Date(),
        }

        setMessages(prev => [...prev, reviewMessage])
      }
    }

    // Handle agent stopped event
    if (latestMessage.topic === 'agent-stopped') {
      const data = latestMessage.data as { reason?: string }

      setIsLoading(false)

      // Add stop message to chat
      const stopMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `⏹️ **Agent Stopped**\n\n${data.reason || 'Execution was stopped by user request.'}`,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, stopMessage])
    }

    // Handle terminal/progress updates
    if (latestMessage.topic === 'terminal') {
      const data = latestMessage.data as { output?: string; command?: string }

      if (data?.output) {
        setMessages((prev) => {
          const lastIndex = prev.length - 1
          if (lastIndex < 0) return prev
          const lastMsg = prev[lastIndex]

          // Update the streaming placeholder message with progress
          if (!lastMsg || lastMsg.role !== 'assistant' || !lastMsg.isStreaming) return prev
          if (!data.output) return prev // Type guard

          const updatedMsg: ChatMessage = {
            ...lastMsg,
            content: data.output,
          }

          return [...prev.slice(0, -1), updatedMsg]
        })
      }
    }
  }, [latestMessage])

  const handleSend = async (content: string, mode: ExecutionMode, reviewMode: ReviewMode, maxIterations?: number) => {
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    // Add placeholder assistant message for real-time updates
    const assistantMessageId = crypto.randomUUID()
    const placeholderAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: 'Processing...',
      timestamp: new Date(),
      isStreaming: true,
      structured: {
        summary: '',
        fileChanges: [],
        commandsRun: [],
        toolsUsed: [],
        thinkingProcess: '',
        errors: [],
      }
    }

    setMessages(prev => [...prev, userMessage, placeholderAssistantMessage])
    setIsLoading(true)
    setError(null)

    try {
      const response = await ChatService.sendMessage({
        projectId,
        message: content,
        mode,
        reviewMode,
        maxIterations
      })

      // Update the placeholder message with final response
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: response.content,
              isStreaming: false,
              structured: response.structured || msg.structured,
            }
          : msg
      ))
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send message'
      setError(errorMsg)

      // Update placeholder message with error
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: `Error: ${errorMsg}`,
              isStreaming: false,
            }
          : msg
      ))
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
        <div className="px-4 py-3 flex items-center justify-between">
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

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      <ChatInput onSend={handleSend} onStop={handleStop} isLoading={isLoading} />
    </div>
  )
}
