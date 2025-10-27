'use client'

import { useState } from 'react'
import { Settings, Zap, Network, User, X, Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/primitives/dialog'
import { Button } from '@/ui/primitives/button'
import { Label } from '@/ui/primitives/label'
import { cn } from '@/lib/utils'
import type { ExecutionMode, ReviewMode } from '@/lib/services/chat-v2/types'

export type AgentModel = 'claude-haiku-4-5' | 'gpt-5-mini' | 'claude-sonnet-4-5' | 'gpt-5'

interface AgentSettingsModalProps {
  mode: ExecutionMode
  reviewMode: ReviewMode
  maxIterations: number
  coderModel: AgentModel
  reviewerModel: AgentModel
  maxToolCalls: number
  onModeChange: (mode: ExecutionMode) => void
  onReviewModeChange: (mode: ReviewMode) => void
  onMaxIterationsChange: (iterations: number) => void
  onCoderModelChange: (model: AgentModel) => void
  onReviewerModelChange: (model: AgentModel) => void
  onMaxToolCallsChange: (maxCalls: number) => void
  trigger?: React.ReactNode
}

export function AgentSettingsModal({
  mode,
  reviewMode,
  maxIterations,
  coderModel,
  reviewerModel,
  maxToolCalls,
  onModeChange,
  onReviewModeChange,
  onMaxIterationsChange,
  onCoderModelChange,
  onReviewerModelChange,
  onMaxToolCallsChange,
  trigger,
}: AgentSettingsModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-gray-300"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agent Settings</DialogTitle>
          <DialogDescription>
            Configure how the AI agent executes your requests
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Execution Mode */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Execution Mode</Label>
            <p className="text-sm text-muted-foreground">
              Choose how the AI processes your requests
            </p>

            <div className="grid grid-cols-1 gap-3">
              {/* Simple Mode */}
              <button
                onClick={() => onModeChange('simple')}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left',
                  mode === 'simple'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-border hover:border-blue-500/50 hover:bg-blue-500/5'
                )}
              >
                <div className={cn(
                  'p-2 rounded-lg',
                  mode === 'simple' ? 'bg-blue-500/20' : 'bg-muted'
                )}>
                  <Zap className={cn(
                    'w-5 h-5',
                    mode === 'simple' ? 'text-blue-500' : 'text-muted-foreground'
                  )} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">Fast (Simple Agent)</div>
                  <p className="text-sm text-muted-foreground">
                    Direct execution with Inngest Agent-Kit. Best for quick tasks and file edits.
                  </p>
                </div>
              </button>

              {/* Agents Mode */}
              <button
                onClick={() => onModeChange('agents')}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left',
                  mode === 'agents'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-border hover:border-purple-500/50 hover:bg-purple-500/5'
                )}
              >
                <div className={cn(
                  'p-2 rounded-lg',
                  mode === 'agents' ? 'bg-purple-500/20' : 'bg-muted'
                )}>
                  <Network className={cn(
                    'w-5 h-5',
                    mode === 'agents' ? 'text-purple-500' : 'text-muted-foreground'
                  )} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">Agents (Multi-Agent Workflow)</div>
                  <p className="text-sm text-muted-foreground">
                    Uses system agents (Planner, Orchestrator, Logic Checker). Best for complex tasks.
                  </p>
                </div>
              </button>

              {/* Custom Mode */}
              <button
                onClick={() => onModeChange('custom')}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left',
                  mode === 'custom'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-border hover:border-green-500/50 hover:bg-green-500/5'
                )}
              >
                <div className={cn(
                  'p-2 rounded-lg',
                  mode === 'custom' ? 'bg-green-500/20' : 'bg-muted'
                )}>
                  <User className={cn(
                    'w-5 h-5',
                    mode === 'custom' ? 'text-green-500' : 'text-muted-foreground'
                  )} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">Custom Workflow</div>
                  <p className="text-sm text-muted-foreground">
                    Run your custom agent workflow. Configure workflows in the Workflows tab.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Review Mode (only for Simple mode) */}
          {mode === 'simple' && (
            <>
              <div className="border-t pt-6 space-y-3">
                <Label className="text-base font-semibold">Review Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Control how the AI reviews and improves its work
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => onReviewModeChange('off')}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-center',
                      reviewMode === 'off'
                        ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                        : 'border-border hover:border-blue-500/50 hover:bg-blue-500/5'
                    )}
                  >
                    <div className={cn(
                      'font-semibold mb-1',
                      reviewMode === 'off' ? 'text-blue-400' : ''
                    )}>No Review</div>
                    <p className="text-xs text-muted-foreground">
                      Direct execution, no self-review
                    </p>
                  </button>

                  <button
                    onClick={() => onReviewModeChange('limited')}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-center',
                      reviewMode === 'limited'
                        ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                        : 'border-border hover:border-blue-500/50 hover:bg-blue-500/5'
                    )}
                  >
                    <div className={cn(
                      'font-semibold mb-1',
                      reviewMode === 'limited' ? 'text-blue-400' : ''
                    )}>Limited</div>
                    <p className="text-xs text-muted-foreground">
                      Review with max iterations
                    </p>
                  </button>

                  <button
                    onClick={() => onReviewModeChange('loop')}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-center',
                      reviewMode === 'loop'
                        ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                        : 'border-border hover:border-blue-500/50 hover:bg-blue-500/5'
                    )}
                  >
                    <div className={cn(
                      'font-semibold mb-1',
                      reviewMode === 'loop' ? 'text-blue-400' : ''
                    )}>Loop</div>
                    <p className="text-xs text-muted-foreground">
                      Keep improving until perfect
                    </p>
                  </button>
                </div>
              </div>

              {/* Max Rounds (only for Limited mode) */}
              {reviewMode === 'limited' && (
                <div className="border-t pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Max Editing Rounds</Label>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                      <span className="text-2xl font-bold text-blue-400">{maxIterations}</span>
                      <span className="text-sm text-blue-300">rounds</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Maximum editing rounds allowed. Agent will stop early if task is complete (goal: finish in 1-2 rounds).
                  </p>

                  <div className="space-y-2 pt-2">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={maxIterations}
                      onChange={(e) => onMaxIterationsChange(parseInt(e.target.value))}
                      className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-500"
                      style={{
                        background: `linear-gradient(to right, rgb(59 130 246 / 0.5) 0%, rgb(59 130 246 / 0.5) ${((maxIterations - 1) / 19) * 100}%, rgb(255 255 255 / 0.1) ${((maxIterations - 1) / 19) * 100}%, rgb(255 255 255 / 0.1) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground px-1">
                      <span>1</span>
                      <span>10</span>
                      <span>20</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Each round: agent edits code → reviewer checks quality → if issues found, start new round. Higher = more refinement, but slower. Recommended: 2-3 rounds.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Model Selection (only for Simple mode) */}
          {mode === 'simple' && (
            <>
              {/* Coder Model */}
              <div className="border-t pt-6 space-y-3">
                <Label className="text-base font-semibold">Coding Agent Model</Label>
                <p className="text-sm text-muted-foreground">
                  Choose the AI model for writing code
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onCoderModelChange('claude-haiku-4-5')}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all text-left',
                      coderModel === 'claude-haiku-4-5'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-border hover:border-blue-500/50 hover:bg-blue-500/5'
                    )}
                  >
                    <div className="font-semibold text-sm mb-1">Claude Haiku 4.5</div>
                    <p className="text-xs text-muted-foreground">Fast & economical</p>
                  </button>

                  <button
                    onClick={() => onCoderModelChange('claude-sonnet-4-5')}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all text-left',
                      coderModel === 'claude-sonnet-4-5'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-border hover:border-blue-500/50 hover:bg-blue-500/5'
                    )}
                  >
                    <div className="font-semibold text-sm mb-1">Claude Sonnet 4.5</div>
                    <p className="text-xs text-muted-foreground">More capable</p>
                  </button>

                  <button
                    onClick={() => onCoderModelChange('gpt-5-mini')}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all text-left',
                      coderModel === 'gpt-5-mini'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-border hover:border-blue-500/50 hover:bg-blue-500/5'
                    )}
                  >
                    <div className="font-semibold text-sm mb-1">GPT-5 Mini</div>
                    <p className="text-xs text-muted-foreground">OpenAI fast</p>
                  </button>

                  <button
                    onClick={() => onCoderModelChange('gpt-5')}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all text-left',
                      coderModel === 'gpt-5'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-border hover:border-blue-500/50 hover:bg-blue-500/5'
                    )}
                  >
                    <div className="font-semibold text-sm mb-1">GPT-5</div>
                    <p className="text-xs text-muted-foreground">OpenAI advanced</p>
                  </button>
                </div>
              </div>

              {/* Reviewer Model (only if review mode is on) */}
              {reviewMode !== 'off' && (
                <div className="border-t pt-6 space-y-3">
                  <Label className="text-base font-semibold">Code Reviewer Model</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose the AI model for reviewing code quality
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => onReviewerModelChange('claude-haiku-4-5')}
                      className={cn(
                        'p-3 rounded-lg border-2 transition-all text-left',
                        reviewerModel === 'claude-haiku-4-5'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-border hover:border-purple-500/50 hover:bg-purple-500/5'
                      )}
                    >
                      <div className="font-semibold text-sm mb-1">Claude Haiku 4.5</div>
                      <p className="text-xs text-muted-foreground">Fast & economical</p>
                    </button>

                    <button
                      onClick={() => onReviewerModelChange('claude-sonnet-4-5')}
                      className={cn(
                        'p-3 rounded-lg border-2 transition-all text-left',
                        reviewerModel === 'claude-sonnet-4-5'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-border hover:border-purple-500/50 hover:bg-purple-500/5'
                      )}
                    >
                      <div className="font-semibold text-sm mb-1">Claude Sonnet 4.5</div>
                      <p className="text-xs text-muted-foreground">More capable</p>
                    </button>

                    <button
                      onClick={() => onReviewerModelChange('gpt-5-mini')}
                      className={cn(
                        'p-3 rounded-lg border-2 transition-all text-left',
                        reviewerModel === 'gpt-5-mini'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-border hover:border-purple-500/50 hover:bg-purple-500/5'
                      )}
                    >
                      <div className="font-semibold text-sm mb-1">GPT-5 Mini</div>
                      <p className="text-xs text-muted-foreground">OpenAI fast</p>
                    </button>

                    <button
                      onClick={() => onReviewerModelChange('gpt-5')}
                      className={cn(
                        'p-3 rounded-lg border-2 transition-all text-left',
                        reviewerModel === 'gpt-5'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-border hover:border-purple-500/50 hover:bg-purple-500/5'
                      )}
                    >
                      <div className="font-semibold text-sm mb-1">GPT-5</div>
                      <p className="text-xs text-muted-foreground">OpenAI advanced</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Tool Use Limit */}
              <div className="border-t pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Tool Call Limit</Label>
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
                    <span className="text-2xl font-bold text-green-400">{maxToolCalls}</span>
                    <span className="text-sm text-green-300">calls</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Maximum number of tool calls (file reads/writes, commands) per editing round. Higher = agent can do more work, but slower.
                </p>

                <div className="space-y-2 pt-2">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={maxToolCalls}
                    onChange={(e) => onMaxToolCallsChange(parseInt(e.target.value))}
                    className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-green-500"
                    style={{
                      background: `linear-gradient(to right, rgb(34 197 94 / 0.5) 0%, rgb(34 197 94 / 0.5) ${((maxToolCalls - 10) / 90) * 100}%, rgb(255 255 255 / 0.1) ${((maxToolCalls - 10) / 90) * 100}%, rgb(255 255 255 / 0.1) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>10</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Agent stops when either: task complete, editing rounds max reached, OR tool calls max reached. Recommended: 30-50 calls.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
