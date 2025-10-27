'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Zap, Network, User, Loader2, StopCircle, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExecutionMode, ReviewMode } from '@/lib/services/chat-v2/types'
import { AgentSettingsModal, type AgentModel } from './agent-settings-modal'

interface ChatInputProps {
  onSend: (
    message: string,
    mode: ExecutionMode,
    reviewMode: ReviewMode,
    maxIterations?: number,
    coderModel?: AgentModel,
    reviewerModel?: AgentModel,
    maxToolCalls?: number
  ) => void
  onStop?: () => void
  isLoading: boolean
}

export function ChatInput({ onSend, onStop, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState<ExecutionMode>('simple')
  const [reviewMode, setReviewMode] = useState<ReviewMode>('off')
  const [maxIterations, setMaxIterations] = useState(3) // Default to 3 review cycles
  const [coderModel, setCoderModel] = useState<AgentModel>('claude-haiku-4-5') // Default: Claude Haiku
  const [reviewerModel, setReviewerModel] = useState<AgentModel>('claude-haiku-4-5') // Default: Claude Haiku
  const [maxToolCalls, setMaxToolCalls] = useState(30) // Default: 30 tool calls per round
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSend = () => {
    if (!message.trim() || isLoading) return

    onSend(message.trim(), mode, reviewMode, maxIterations, coderModel, reviewerModel, maxToolCalls)
    setMessage('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-white/10 bg-gradient-to-b from-black/20 to-black/40 backdrop-blur-xl">
      <div className="p-4 space-y-3">
        {/* Agent Settings - Clickable indicator */}
        <AgentSettingsModal
          mode={mode}
          reviewMode={reviewMode}
          maxIterations={maxIterations}
          coderModel={coderModel}
          reviewerModel={reviewerModel}
          maxToolCalls={maxToolCalls}
          onModeChange={setMode}
          onReviewModeChange={setReviewMode}
          onMaxIterationsChange={setMaxIterations}
          onCoderModelChange={setCoderModel}
          onReviewerModelChange={setReviewerModel}
          onMaxToolCallsChange={setMaxToolCalls}
          trigger={
            <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all group">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/20 rounded">
                <Settings className="w-3 h-3 text-blue-400 group-hover:text-blue-300" />
                <span className="text-xs font-medium text-blue-300">Agent Settings</span>
              </div>
              {mode === 'simple' && (
                <>
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-medium text-gray-300">Fast</span>
                  <span className="text-[10px] text-gray-500">•</span>
                  <span className="text-xs text-gray-400">
                    {reviewMode === 'off' ? 'No Review' :
                     reviewMode === 'limited' ? `${maxIterations} rounds` :
                     'Loop'}
                  </span>
                </>
              )}
              {mode === 'agents' && (
                <>
                  <Network className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-medium text-gray-300">Multi-Agent</span>
                </>
              )}
              {mode === 'custom' && (
                <>
                  <User className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs font-medium text-gray-300">Custom Workflow</span>
                </>
              )}
            </button>
          }
        />

        {/* Input area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={isLoading}
            rows={1}
            className={cn(
              'w-full resize-none rounded-xl bg-white/5 border border-white/10 px-4 py-3 pr-12',
              'text-sm text-gray-100 placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200',
              'max-h-[200px] overflow-y-auto'
            )}
          />

          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            {isLoading && onStop && (
              <button
                onClick={onStop}
                className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:scale-105 transition-all"
                title="Stop agent execution"
              >
                <StopCircle className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className={cn(
                'p-2 rounded-lg transition-all',
                !message.trim() || isLoading
                  ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Helper text */}
        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {mode === 'simple' && (
            <span className="text-blue-400/60">
              {reviewMode === 'off' ? '⚡ Direct execution' :
               reviewMode === 'limited' ? `🔄 ${maxIterations} editing round${maxIterations !== 1 ? 's' : ''} max` :
               '♾️ Loop until perfect'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
