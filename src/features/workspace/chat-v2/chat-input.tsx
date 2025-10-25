'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Zap, Network, User, Loader2, StopCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExecutionMode, ReviewMode } from '@/lib/services/chat-v2/types'

interface ChatInputProps {
  onSend: (message: string, mode: ExecutionMode, reviewMode: ReviewMode, maxIterations?: number) => void
  onStop?: () => void
  isLoading: boolean
}

export function ChatInput({ onSend, onStop, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState<ExecutionMode>('simple')
  const [reviewMode, setReviewMode] = useState<ReviewMode>('off')
  const [maxIterations, setMaxIterations] = useState(2)
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

    onSend(message.trim(), mode, reviewMode, maxIterations)
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
        {/* Mode selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setMode('simple')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                mode === 'simple'
                  ? 'bg-blue-500/20 text-blue-300 shadow-lg shadow-blue-500/20'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Fast</span>
            </button>
            <button
              onClick={() => setMode('agents')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                mode === 'agents'
                  ? 'bg-purple-500/20 text-purple-300 shadow-lg shadow-purple-500/20'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
              )}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Agents</span>
            </button>
            <button
              onClick={() => setMode('custom')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                mode === 'custom'
                  ? 'bg-green-500/20 text-green-300 shadow-lg shadow-green-500/20'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
              )}
            >
              <User className="w-3.5 h-3.5" />
              <span>Custom</span>
            </button>
          </div>

          {/* Review mode for Simple */}
          {mode === 'simple' && (
            <>
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => setReviewMode('off')}
                  className={cn(
                    'px-2.5 py-1 rounded text-[11px] font-medium transition-all',
                    reviewMode === 'off'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-500 hover:text-gray-400'
                  )}
                >
                  No Review
                </button>
                <button
                  onClick={() => setReviewMode('limited')}
                  className={cn(
                    'px-2.5 py-1 rounded text-[11px] font-medium transition-all',
                    reviewMode === 'limited'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-500 hover:text-gray-400'
                  )}
                >
                  Limited
                </button>
                <button
                  onClick={() => setReviewMode('loop')}
                  className={cn(
                    'px-2.5 py-1 rounded text-[11px] font-medium transition-all',
                    reviewMode === 'loop'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-500 hover:text-gray-400'
                  )}
                >
                  Loop
                </button>
              </div>

              {/* Max iterations selector (only for limited mode) */}
              {reviewMode === 'limited' && (
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1 border border-white/10">
                  <span className="text-[11px] text-gray-400">Max:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => setMaxIterations(num)}
                        className={cn(
                          'w-6 h-6 rounded text-[11px] font-medium transition-all',
                          maxIterations === num
                            ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

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
               reviewMode === 'limited' ? `🔄 ${maxIterations} review iteration${maxIterations !== 1 ? 's' : ''} max` :
               '♾️ Loop until perfect'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
