'use client';

/**
 * Mode-Aware Panel Component
 *
 * Switches between:
 * - Simple Mode: Terminal Chat (Claude Code CLI with xterm.js)
 * - Agents Mode: Execution Panel (multi-agent orchestration)
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { useWorkspaceMode } from './workspace-mode-context';
import { ClaudeChatSimple } from './claude-chat-simple';
import { startWorkflowExecutionAction, resumeWorkflowExecutionAction } from '@/server/actions/executions';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Clock, AlertCircle, PlayCircle, MessageSquare, Terminal } from 'lucide-react';
import { Button } from '@/ui/primitives/button';

// Dynamically import terminal to avoid SSR issues with xterm.js
const TerminalPty = lazy(() =>
  import('./terminal-pty').then(mod => ({ default: mod.TerminalPty }))
);

interface StreamMessage {
  type: 'message' | 'connected' | 'error';
  topic?: string;
  data?: unknown;
  timestamp?: number;
  channel?: string;
  topics?: string[];
  error?: string;
}

interface ExecutionMessageData {
  type?: string;
  payload?: {
    status?: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
    message?: string;
    agent?: string;
    taskId?: string;
    agentName?: string;
    summary?: string;
  };
}

interface ModePanelProps {
  projectId: string;
  teamId: string;
  streamMessages: StreamMessage[];
  isConnected: boolean;
  streamError: string | null;
}

export function ModePanel({
  projectId,
  teamId,
  streamMessages,
  isConnected,
  streamError,
}: ModePanelProps) {
  const { mode, activeExecutionId } = useWorkspaceMode();
  const [simpleView, setSimpleView] = useState<'chat' | 'terminal'>('chat');

  // Simple Mode: Show chat or terminal interface based on user preference
  if (mode === 'simple') {
    return (
      <div className="h-full flex flex-col">
        {/* View Toggle */}
        <div className="border-b px-4 py-2 flex items-center justify-between bg-muted/20">
          <span className="text-xs font-medium text-muted-foreground">Simple Mode</span>
          <div className="flex gap-1 bg-background rounded-md p-1">
            <Button
              variant={simpleView === 'chat' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSimpleView('chat')}
              className="h-7 text-xs gap-1.5"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </Button>
            <Button
              variant={simpleView === 'terminal' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSimpleView('terminal')}
              className="h-7 text-xs gap-1.5"
            >
              <Terminal className="h-3.5 w-3.5" />
              Terminal
            </Button>
          </div>
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-hidden">
          {simpleView === 'chat' ? (
            <ClaudeChatSimple projectId={projectId} />
          ) : (
            <Suspense fallback={
              <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading terminal...
              </div>
            }>
              <TerminalPty projectId={projectId} />
            </Suspense>
          )}
        </div>
      </div>
    );
  }

  // Agents Mode: Show execution panel
  return (
    <AgentsExecutionPanel
      projectId={projectId}
      teamId={teamId}
      activeExecutionId={activeExecutionId}
      streamMessages={streamMessages}
      isConnected={isConnected}
    />
  );
}

/**
 * Agents Mode Execution Panel
 * Shows:
 * - Active execution status
 * - Task breakdown with real-time progress
 * - Specialized agents working on tasks
 * - Workflow visualization
 */
function AgentsExecutionPanel({
  projectId,
  teamId,
  activeExecutionId,
  streamMessages,
  isConnected,
}: {
  projectId: string;
  teamId: string;
  activeExecutionId: string | null;
  streamMessages: StreamMessage[];
  isConnected: boolean;
}) {
  const { setActiveExecutionId } = useWorkspaceMode();
  const [userInput, setUserInput] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<'pending' | 'running' | 'paused' | 'completed' | 'failed'>('pending');
  const [currentPhase, setCurrentPhase] = useState<string>('Initializing...');
  const [tasks, setTasks] = useState<Array<{ title: string; status: string; agent?: string }>>([]);
  const [agents, setAgents] = useState<Array<{ name: string; role: string }>>([]);

  async function handleStartExecution() {
    if (!userInput.trim()) {
      toast.error('Please describe what you want to build');
      return;
    }

    setIsStarting(true);
    try {
      const result = await startWorkflowExecutionAction(projectId, userInput.trim());

      if (result.success && result.id) {
        setActiveExecutionId(result.id);
        toast.success('Workflow execution started - planning tasks...');
      } else {
        toast.error(result.error || 'Failed to start execution');
      }
    } catch (error) {
      console.error('[Agents Mode] Start execution error:', error);
      toast.error('Failed to start execution');
    } finally {
      setIsStarting(false);
    }
  }

  async function handleResumeExecution() {
    if (!activeExecutionId) return;

    setIsResuming(true);
    try {
      const result = await resumeWorkflowExecutionAction(activeExecutionId);

      if (result.success) {
        setExecutionStatus('running');
        toast.success('Execution resumed - running tasks...');
      } else {
        toast.error(result.error || 'Failed to resume execution');
      }
    } catch (error) {
      console.error('[Agents Mode] Resume execution error:', error);
      toast.error('Failed to resume execution');
    } finally {
      setIsResuming(false);
    }
  }

  // Parse stream messages to update execution state
  useEffect(() => {
    if (!activeExecutionId || streamMessages.length === 0) return;

    const latestMessage = streamMessages[streamMessages.length - 1];
    if (!latestMessage || latestMessage.type !== 'message') return;

    const data = latestMessage.data as ExecutionMessageData;

    // Update execution status based on message type
    if (data.type === 'execution_update') {
      if (data.payload?.status) {
        setExecutionStatus(data.payload.status);
      }
      if (data.payload?.message) {
        setCurrentPhase(data.payload.message);
      }
    } else if (data.type === 'agent_start') {
      setCurrentPhase(`${data.payload?.agent || 'Agent'} working...`);
    } else if (data.type === 'agent_complete') {
      setCurrentPhase(data.payload?.message || 'Agent completed');
    } else if (data.type === 'task_update') {
      const taskId = data.payload?.taskId;
      const status = data.payload?.status;
      const agentName = data.payload?.agentName;

      if (taskId && status) {
        setTasks(prev => {
          const existing = prev.find(t => t.title === taskId);
          if (existing) {
            return prev.map(t => t.title === taskId ? { ...t, status, agent: agentName } : t);
          } else {
            return [...prev, { title: taskId, status, agent: agentName }];
          }
        });
      }
    }
  }, [streamMessages, activeExecutionId]);

  // No active execution - show start form
  if (!activeExecutionId) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="border-b p-4">
          <h2 className="font-semibold">Agents Mode</h2>
          <p className="text-sm text-muted-foreground">
            Multi-agent orchestration for complex projects
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Ready for Complex Tasks</h3>
            <p className="text-sm text-muted-foreground">
              Describe what you want to build, and I'll create specialized agents to break it down
              and execute in parallel.
            </p>

            <div className="pt-4">
              <textarea
                className="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Describe your project... (e.g., Build a full-stack e-commerce app with authentication, product catalog, and payment integration)"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isStarting}
              />
              <button
                className="mt-3 w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleStartExecution}
                disabled={isStarting || !userInput.trim()}
              >
                {isStarting ? 'Starting...' : 'Start Multi-Agent Workflow'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Has active execution - show execution panel
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with status and actions */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="font-semibold">Multi-Agent Execution</h2>
            <p className="text-xs text-muted-foreground font-mono">
              {activeExecutionId.substring(0, 8)}...
            </p>
          </div>
          {executionStatus === 'paused' && (
            <button
              className="bg-primary text-primary-foreground py-1.5 px-3 rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={handleResumeExecution}
              disabled={isResuming}
            >
              {isResuming ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Resuming...</>
              ) : (
                <><PlayCircle className="h-3 w-3" /> Approve & Resume</>
              )}
            </button>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-sm">
          {executionStatus === 'running' && (
            <><Loader2 className="h-4 w-4 animate-spin text-blue-500" /> <span className="text-blue-500">Running</span></>
          )}
          {executionStatus === 'paused' && (
            <><Clock className="h-4 w-4 text-yellow-500" /> <span className="text-yellow-500">Paused - Awaiting Approval</span></>
          )}
          {executionStatus === 'completed' && (
            <><CheckCircle2 className="h-4 w-4 text-green-500" /> <span className="text-green-500">Completed</span></>
          )}
          {executionStatus === 'failed' && (
            <><AlertCircle className="h-4 w-4 text-red-500" /> <span className="text-red-500">Failed</span></>
          )}
          {executionStatus === 'pending' && (
            <><Clock className="h-4 w-4 text-muted-foreground" /> <span className="text-muted-foreground">Pending</span></>
          )}
        </div>

        {/* Current phase */}
        <p className="text-xs text-muted-foreground mt-1">{currentPhase}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Specialized Agents */}
        {agents.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Specialized Agents</h3>
            <div className="grid gap-2">
              {agents.map((agent, i) => (
                <div key={i} className="p-2 bg-muted/30 rounded border border-border text-xs">
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-muted-foreground">{agent.role}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Progress */}
        {tasks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Task Progress</h3>
            <div className="space-y-1">
              {tasks.map((task, i) => (
                <div key={i} className="p-2 bg-muted/30 rounded border border-border text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {task.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                    {task.status === 'running' && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                    {task.status === 'pending' && <Clock className="h-3 w-3 text-muted-foreground" />}
                    {task.status === 'failed' && <AlertCircle className="h-3 w-3 text-red-500" />}
                    <span>{task.title}</span>
                  </div>
                  {task.agent && <span className="text-muted-foreground">{task.agent}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Feed */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Activity Log</h3>
          <div className="space-y-1 max-h-64 overflow-auto">
            {streamMessages.filter(msg => msg.type === 'message').slice(-10).reverse().map((msg, i) => {
              const data = msg.data as ExecutionMessageData;
              return (
                <div key={i} className="text-xs p-2 bg-muted/20 rounded border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{data.type || 'update'}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {data.payload?.message || data.payload?.summary || JSON.stringify(data.payload || data)}
                  </p>
                </div>
              );
            })}
            {streamMessages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {isConnected ? 'Waiting for orchestrator updates...' : 'Connecting to event stream...'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
