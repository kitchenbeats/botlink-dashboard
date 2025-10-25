'use client'

import { useEffect, useRef } from 'react'
import { User } from 'lucide-react'
import { AgentResponseCard } from './agent-response-card'
import { Markdown } from './markdown'
import type { ChatMessage } from '@/lib/services/chat-v2/types'

interface MessageListProps {
  messages: ChatMessage[]
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center border border-white/10">
            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-200">
              Start a conversation
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Ask me to build features, fix bugs, or explain code.
              I'll track everything and give you detailed insights.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            <div className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
              File tracking
            </div>
            <div className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
              Command history
            </div>
            <div className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
              Code review
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {msg.role === 'user' ? (
            <div className="flex items-start gap-3 justify-end">
              <div className="max-w-[80%] bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg">
                <Markdown content={msg.content} className="text-sm text-white" />
              </div>
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-white/10">
                <User className="w-4 h-4 text-gray-300" />
              </div>
            </div>
          ) : (
            <AgentResponseCard
              message={msg.content}
              structured={msg.structured}
            />
          )}
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  )
}
