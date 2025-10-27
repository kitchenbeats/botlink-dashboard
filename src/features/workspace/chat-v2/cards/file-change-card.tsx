'use client'

import { FileCode } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileChangeCardProps {
  path: string
  action: 'created' | 'updated' | 'deleted'
  language?: string
}

const languageColors: Record<string, string> = {
  typescript: 'text-blue-400',
  javascript: 'text-yellow-400',
  python: 'text-green-400',
  html: 'text-orange-400',
  css: 'text-pink-400',
  json: 'text-purple-400',
  markdown: 'text-gray-400',
}

export function FileChangeCard({ path, action, language }: FileChangeCardProps) {
  return (
    <div className="group relative">
      <div className="relative rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/10 p-4 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <FileCode className="w-4 h-4 text-white" />
          </div>

          <div className="flex-1 flex items-center gap-3">
            <div className={cn(
              'flex-shrink-0 w-2 h-2 rounded-full',
              action === 'created' ? 'bg-green-400' :
              action === 'updated' ? 'bg-blue-400' :
              'bg-red-400'
            )} />

            <code className={cn(
              'flex-1 font-mono text-sm',
              language ? languageColors[language] : 'text-gray-300'
            )}>
              {path}
            </code>

            <span className="text-xs text-gray-500 uppercase tracking-wider">
              {action}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
