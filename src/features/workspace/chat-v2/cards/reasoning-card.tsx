'use client'

import { Brain } from 'lucide-react'

interface ReasoningCardProps {
  content: string
}

export function ReasoningCard({ content }: ReasoningCardProps) {
  return (
    <div className="group relative">
      <div className="relative rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/10 p-4 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5 pointer-events-none" />

        <div className="relative space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-300">Thinking Process</span>
          </div>

          <div className="text-sm text-gray-400 bg-white/5 rounded-lg px-3 py-2 border border-white/5 font-mono leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </div>
      </div>
    </div>
  )
}
