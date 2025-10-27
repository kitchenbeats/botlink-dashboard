'use client'

import { Terminal, CheckCircle2, AlertCircle } from 'lucide-react'

interface TerminalCardProps {
  output: string
  command?: string
  success?: boolean
}

export function TerminalCard({ output, command, success = true }: TerminalCardProps) {
  return (
    <div className="group relative">
      <div className="relative rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/10 p-4 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />

        <div className="relative space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-300">Terminal</span>
          </div>

          {command && (
            <div className="bg-black/40 rounded-lg border border-white/5 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border-b border-white/5">
                {success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                )}
                <code className="flex-1 text-xs font-mono text-gray-300">
                  $ {command}
                </code>
              </div>
              <pre className="px-3 py-2 text-[11px] text-gray-400 font-mono leading-relaxed overflow-x-auto">
                {output}
              </pre>
            </div>
          )}

          {!command && (
            <div className="text-sm text-gray-300 font-mono bg-black/20 rounded-lg px-3 py-2">
              {output}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
