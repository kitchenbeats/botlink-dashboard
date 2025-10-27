'use client'

import { Sparkles } from 'lucide-react'
import { Markdown } from '../markdown'

interface SummaryCardProps {
  content: string
  summary?: string
}

export function SummaryCard({ content, summary }: SummaryCardProps) {
  return (
    <div className="group relative">
      <div className="relative rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/10 p-6 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />

        <div className="relative space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <Markdown content={content} />
            </div>
          </div>

          {summary && summary !== content && (
            <div className="text-sm text-gray-400 font-mono bg-white/5 rounded-lg px-3 py-2 border border-white/5">
              {summary}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
