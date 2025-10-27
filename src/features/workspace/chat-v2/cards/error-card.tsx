'use client'

import { AlertCircle } from 'lucide-react'

interface ErrorCardProps {
  errors: string[]
}

export function ErrorCard({ errors }: ErrorCardProps) {
  return (
    <div className="group relative">
      <div className="relative rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 backdrop-blur-xl border border-red-500/20 p-4 shadow-2xl overflow-hidden">
        <div className="relative space-y-2">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {errors.length === 1 ? 'Error' : `${errors.length} Errors`}
            </span>
          </div>

          <ul className="space-y-1 text-sm text-red-300/80">
            {errors.map((error, i) => (
              <li key={i} className="font-mono">• {error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
