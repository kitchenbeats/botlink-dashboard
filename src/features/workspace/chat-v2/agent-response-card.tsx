'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, FileCode, Terminal, Brain, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Markdown } from './markdown'
import type { StructuredResponse } from '@/lib/services/chat-v2/types'

interface AgentResponseCardProps {
  message: string
  structured?: StructuredResponse
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

export function AgentResponseCard({ message, structured }: AgentResponseCardProps) {
  const [showFiles, setShowFiles] = useState(true)
  const [showCommands, setShowCommands] = useState(true)
  const [showThinking, setShowThinking] = useState(false)

  const hasFileChanges = structured && structured.fileChanges.length > 0
  const hasCommands = structured && structured.commandsRun.length > 0
  const hasErrors = structured && structured.errors.length > 0

  return (
    <div className="group relative">
      {/* Glass morphism card */}
      <div className="relative rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/10 p-6 shadow-2xl overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />

        {/* Content */}
        <div className="relative space-y-5">
          {/* Agent message */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <Markdown content={message} />
            </div>
          </div>

          {/* Technical summary */}
          {structured?.summary && structured.summary !== message && (
            <div className="pl-11">
              <div className="text-sm text-gray-400 font-mono bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                {structured.summary}
              </div>
            </div>
          )}

          {/* File Changes Section */}
          {hasFileChanges && (
            <div className="pl-11 space-y-2">
              <button
                onClick={() => setShowFiles(!showFiles)}
                className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                {showFiles ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <FileCode className="w-4 h-4" />
                <span>Files Changed ({structured!.fileChanges.length})</span>
              </button>

              {showFiles && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  {structured!.fileChanges.map((file, i) => (
                    <div
                      key={i}
                      className="group/file flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 border border-white/5 transition-all"
                    >
                      <div className={cn(
                        'flex-shrink-0 w-1.5 h-1.5 rounded-full',
                        file.action === 'created' ? 'bg-green-400' :
                        file.action === 'updated' ? 'bg-blue-400' :
                        'bg-red-400'
                      )} />
                      <code className={cn(
                        'flex-1 font-mono text-xs',
                        file.language ? languageColors[file.language] : 'text-gray-300'
                      )}>
                        {file.path}
                      </code>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                        {file.action}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Command Executions */}
          {hasCommands && (
            <div className="pl-11 space-y-2">
              <button
                onClick={() => setShowCommands(!showCommands)}
                className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                {showCommands ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <Terminal className="w-4 h-4" />
                <span>Commands Run ({structured!.commandsRun.length})</span>
              </button>

              {showCommands && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  {structured!.commandsRun.map((cmd, i) => (
                    <div
                      key={i}
                      className="bg-black/40 rounded-lg border border-white/5 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border-b border-white/5">
                        {cmd.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        )}
                        <code className="flex-1 text-xs font-mono text-gray-300">
                          $ {cmd.command}
                        </code>
                      </div>
                      {cmd.output && (
                        <pre className="px-3 py-2 text-[11px] text-gray-400 font-mono leading-relaxed overflow-x-auto">
                          {cmd.output}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Thinking Process */}
          {structured?.thinkingProcess && (
            <div className="pl-11 space-y-2">
              <button
                onClick={() => setShowThinking(!showThinking)}
                className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                {showThinking ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <Brain className="w-4 h-4" />
                <span>Thinking Process</span>
              </button>

              {showThinking && (
                <div className="text-xs text-gray-400 bg-white/5 rounded-lg px-3 py-2 border border-white/5 font-mono leading-relaxed whitespace-pre-wrap animate-in slide-in-from-top-2 duration-200">
                  {structured.thinkingProcess}
                </div>
              )}
            </div>
          )}

          {/* Errors */}
          {hasErrors && (
            <div className="pl-11">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-medium text-red-400 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Errors Encountered</span>
                </div>
                <ul className="space-y-1 text-xs text-red-300/80">
                  {structured!.errors.map((error, i) => (
                    <li key={i} className="font-mono">• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tools Used */}
          {structured && structured.toolsUsed.length > 0 && (
            <div className="pl-11 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">Tools:</span>
              {structured.toolsUsed.map((tool, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
