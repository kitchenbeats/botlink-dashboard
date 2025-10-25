'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/ui/primitives/button';
import { Textarea } from '@/ui/primitives/textarea';
import { ScrollArea } from '@/ui/primitives/scroll-area';
import { Send, Bot, User, Loader2, Zap, Network, Workflow, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AgentThinkingBlock,
  ToolUseBlock,
  ReviewFeedbackBlock,
  AgentIterationSummary,
} from './agent-telemetry-blocks';

type ExecutionMode = 'simple' | 'agents' | 'custom';

interface StreamMessage {
  type: 'message' | 'connected' | 'error';
  topic?: string;
  data?: unknown;
  timestamp?: number;
  channel?: string;
  topics?: string[];
  error?: string;
}

interface ChatPanelProps {
  projectId: string;
  teamId: string;
  streamMessages: StreamMessage[];
  isConnected: boolean;
  streamError: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  executionMode?: ExecutionMode;
}

interface DbMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  metadata?: {
    executionMode?: ExecutionMode;
  };
}

interface WorkflowPlan {
  overall_strategy: string;
  task_categories: Array<{
    category: string;
    tasks: Array<{
      title: string;
      description: string;
    }>;
  }>;
  total_tasks: number;
}

interface WorkflowAgents {
  name: string;
  type: string;
  skills: string[];
}

interface UserWorkflow {
  id: string;
  name: string;
  description?: string;
}

export function ChatPanel({
  projectId,
  teamId,
  streamMessages,
  isConnected,
  streamError,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('simple');
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [workflowPlan, setWorkflowPlan] = useState<WorkflowPlan | null>(null);
  const [workflowAgents, setWorkflowAgents] = useState<WorkflowAgents[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [userWorkflows, setUserWorkflows] = useState<UserWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState<'off' | 'limited' | 'loop'>('off');

  // Agent telemetry state
  const [agentThinking, setAgentThinking] = useState<Array<{ content: string; timestamp: number }>>([]);
  const [toolUses, setToolUses] = useState<Map<string, { tool: string; input: any; result?: any; timestamp: number }>>(new Map());
  const [reviewResults, setReviewResults] = useState<Array<{ approved: boolean; iteration: number; feedback: string; willRetry?: boolean; timestamp: number }>>([]);
  const [currentIteration, setCurrentIteration] = useState<number>(1);
  const [iterationStatus, setIterationStatus] = useState<'coding' | 'reviewing' | 'approved' | 'fixing'>('coding');

  // Load user workflows on mount to check if Custom button should show
  useEffect(() => {
    async function loadWorkflows() {
      try {
        const response = await fetch(`/api/workflows?teamId=${teamId}`);
        if (!response.ok) throw new Error('Failed to load workflows');
        const workflows = await response.json();
        setUserWorkflows(workflows);

        // Auto-select first workflow if available and in custom mode
        if (workflows.length > 0 && !selectedWorkflow && executionMode === 'custom') {
          setSelectedWorkflow(workflows[0].id);
        }

        // If no workflows exist and user is in custom mode, switch to simple
        if (workflows.length === 0 && executionMode === 'custom') {
          setExecutionMode('simple');
        }
      } catch (error) {
        console.error('[Chat] Failed to load workflows:', error);
        setUserWorkflows([]);
        // On error, switch to simple mode if in custom
        if (executionMode === 'custom') {
          setExecutionMode('simple');
        }
      }
    }
    loadWorkflows();
  }, [teamId, executionMode, selectedWorkflow]); // Run when teamId, executionMode, or selectedWorkflow changes

  // Load message history on mount
  useEffect(() => {
    async function loadMessages() {
      try {
        const response = await fetch(`/api/projects/${projectId}/messages`);
        if (!response.ok) {
          console.error('[Chat] Failed to load messages:', response.status);
          return;
        }
        const dbMessages = await response.json() as DbMessage[];

        // Convert DB messages to component Message format
        const formattedMessages: Message[] = dbMessages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: new Date(msg.created_at),
          executionMode: msg.metadata?.executionMode,
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error('[Chat] Failed to load messages:', error);
      }
    }
    loadMessages();
  }, [projectId]); // Only run on mount when projectId is available

  // Remove old Claude Code authentication logic - not needed anymore

  // Handle Redis stream messages
  useEffect(() => {
    if (!streamMessages || streamMessages.length === 0) return;

    const latestMessage = streamMessages[streamMessages.length - 1];
    if (!latestMessage || latestMessage.type !== 'message') return;

    // Old Claude Code CLI streaming removed - no longer used

    // Handle agent telemetry
    if (latestMessage.topic === 'agent-thinking') {
      const data = latestMessage.data as { content: string; timestamp: number };
      setAgentThinking((prev) => [...prev, data]);
      return;
    }

    if (latestMessage.topic === 'tool-use') {
      const data = latestMessage.data as { tool: string; input: any; id: string; timestamp: number };
      setToolUses((prev) => {
        const newMap = new Map(prev);
        newMap.set(data.id, { tool: data.tool, input: data.input, timestamp: data.timestamp });
        return newMap;
      });
      setIterationStatus('coding');
      return;
    }

    if (latestMessage.topic === 'tool-result') {
      const data = latestMessage.data as { toolCallId: string; result: any; timestamp: number };
      setToolUses((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(data.toolCallId);
        if (existing) {
          newMap.set(data.toolCallId, { ...existing, result: data.result });
        }
        return newMap;
      });
      return;
    }

    if (latestMessage.topic === 'review-result') {
      const data = latestMessage.data as { approved: boolean; iteration: number; feedback: string; willRetry?: boolean; timestamp: number };
      setReviewResults((prev) => [...prev, data]);
      setCurrentIteration(data.iteration);

      if (data.approved) {
        setIterationStatus('approved');
      } else if (data.willRetry) {
        setIterationStatus('fixing');
      } else {
        setIterationStatus('reviewing');
      }
      return;
    }

    // Handle different event topics
    if (latestMessage.topic === 'messages') {
      const messageData = latestMessage.data as { message: string };
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: messageData.message,
          createdAt: new Date(),
          executionMode,
        },
      ]);
    } else if (latestMessage.topic === 'status') {
      const statusData = latestMessage.data as {
        message?: string;
        summary?: string;
        error?: string;
        plan?: WorkflowPlan;
        agents?: WorkflowAgents[];
      };

      // Check for pause state with plan and agents
      if (statusData.message?.includes('paused') && statusData.plan && statusData.agents) {
        setWorkflowPlan(statusData.plan);
        setWorkflowAgents(statusData.agents);
        setIsPaused(true);
      } else if (statusData.message?.includes('completed')) {
        setIsPaused(false);
        setWorkflowPlan(null);
        setWorkflowAgents([]);
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: statusData.summary || '✅ All tasks completed successfully!',
            createdAt: new Date(),
            executionMode: 'agents',
          },
        ]);
      } else if (statusData.message && !statusData.error) {
        // Update current status for real-time display
        setCurrentStatus(statusData.message);
        console.log('[Chat] Status update:', statusData.message);

        // Clear status after completion
        if (statusData.message.includes('completed')) {
          setTimeout(() => setCurrentStatus(null), 2000);
        }
      } else if (statusData.error) {
        setCurrentStatus(null);
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `❌ Error: ${statusData.error}`,
            createdAt: new Date(),
          },
        ]);
      }
    }
  }, [streamMessages, executionMode]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, workflowPlan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      createdAt: new Date(),
      executionMode,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Custom workflow mode - validate workflow selection
      if (executionMode === 'custom') {
        if (!selectedWorkflow) {
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: '⚠️ Please select a workflow first',
              createdAt: new Date(),
            },
          ]);
          setIsLoading(false);
          return;
        }

        // Call custom workflow execution endpoint
        const response = await fetch('/api/chat/custom-workflow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            message: input,
            workflowId: selectedWorkflow,
            teamId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to execute workflow: ${response.status}`);
        }

        const result = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: result.content || '✅ Workflow completed',
            createdAt: new Date(),
            executionMode,
          },
        ]);
      } else {
        // Simple/Agents mode - existing logic
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            message: input,
            mode: executionMode,
            reviewMode: executionMode === 'simple' ? reviewMode : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.status}`);
        }

        const result = await response.json();

        // Simple mode - direct agent execution
        if (executionMode === 'simple') {
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: result.content || '🤖 Executing task...',
              createdAt: new Date(),
              executionMode,
            },
          ]);
        } else {
          // Agents mode - store execution ID and wait for realtime events
          setCurrentExecutionId(result.executionId);
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: result.content || '🤖 Starting workflow orchestration...',
              createdAt: new Date(),
              executionMode,
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveExecution = async () => {
    if (!currentExecutionId) return;

    setIsLoading(true);
    setIsPaused(false);

    try {
      const response = await fetch('/api/chat/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionId: currentExecutionId,
          projectId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resume execution');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '▶️ Executing workflow with specialized agents...',
          createdAt: new Date(),
          executionMode: 'agents',
        },
      ]);
    } catch (error) {
      console.error('Failed to resume execution:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col border-l">
      {/* Chat Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Assistant
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Ask me to help build your project
            </p>
          </div>
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-red-500'
              )}
            />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : streamError ? 'Error' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* No authentication banner needed - using server-side AI agents */}

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Start a conversation with your AI assistant
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Try: &quot;Create a simple React component&quot;
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}

          {/* Workflow Plan Approval */}
          {isPaused && workflowPlan && (
            <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-start gap-3 mb-3">
                <Network className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                    🤖 Plan Ready for Review
                  </h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {workflowPlan.overall_strategy}
                  </p>
                </div>
              </div>

              {workflowPlan.task_categories && (
                <div className="space-y-2 mb-3">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                    Tasks ({workflowPlan.total_tasks}):
                  </p>
                  {workflowPlan.task_categories.map((category, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                        {category.category}
                      </p>
                      {category.tasks.slice(0, 3).map((task, taskIdx) => (
                        <div
                          key={taskIdx}
                          className="p-2 bg-background rounded text-xs border ml-2"
                        >
                          <p className="font-medium">{task.title}</p>
                          <p className="text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {workflowAgents.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Specialized Agents ({workflowAgents.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {workflowAgents.map((agent, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded text-xs"
                      >
                        {agent.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleApproveExecution}
                disabled={isLoading}
                className="w-full"
                size="sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>✓ Approve and Execute</>
                )}
              </Button>
            </div>
          )}

          {/* Realtime Progress */}
          {streamMessages && streamMessages.slice(-5).map((msg, idx: number) => {
            if (msg.type !== 'message') return null;

            if (msg.topic === 'file-changes') {
              const fileData = msg.data as { path: string; action: string };
              return (
                <div key={idx} className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                  📁 {fileData.action}: {fileData.path}
                </div>
              );
            }
            if (msg.topic === 'terminal') {
              const termData = msg.data as { command: string; output: string };
              return (
                <div key={idx} className="text-xs font-mono p-2 bg-muted/50 rounded">
                  $ {termData.command}
                </div>
              );
            }
            return null;
          })}

          {/* Real-time Status Indicator */}
          {currentStatus && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-900 dark:text-blue-100">{currentStatus}</span>
            </div>
          )}

          {isLoading && !currentStatus && executionMode !== 'simple' && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Bot className="h-6 w-6" />
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            </div>
          )}

          {/* Invisible div at end for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            placeholder="Ask your AI assistant..."
            className="min-h-[80px] resize-none"
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const formEvent = new Event('submit', { bubbles: true, cancelable: true }) as unknown as React.FormEvent;
                handleSubmit(formEvent);
              }
            }}
          />

          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1 bg-muted rounded-md p-1">
              <button
                type="button"
                onClick={() => setExecutionMode('simple')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors',
                  executionMode === 'simple'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Zap className="h-3.5 w-3.5" />
                Simple
              </button>
              <button
                type="button"
                onClick={() => setExecutionMode('agents')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors',
                  executionMode === 'agents'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Network className="h-3.5 w-3.5" />
                Agents
              </button>
              {/* Only show Custom button if user has workflows */}
              {userWorkflows.length > 0 && (
                <button
                  type="button"
                  onClick={() => setExecutionMode('custom')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors',
                    executionMode === 'custom'
                      ? 'bg-background shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Workflow className="h-3.5 w-3.5" />
                  Custom
                </button>
              )}
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Workflow Selector for Custom Mode */}
          {executionMode === 'custom' && (
            <div className="space-y-2">
              <label htmlFor="workflow-select" className="text-xs font-medium">
                Select Workflow:
              </label>
              <select
                id="workflow-select"
                value={selectedWorkflow}
                onChange={(e) => setSelectedWorkflow(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                disabled={isLoading}
              >
                {userWorkflows.length === 0 ? (
                  <option value="">No workflows available</option>
                ) : (
                  <>
                    <option value="">Choose a workflow...</option>
                    {userWorkflows.map((workflow) => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.name}
                        {workflow.description && ` - ${workflow.description}`}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          )}

          {/* Review Mode Selector - Only for Simple Mode */}
          {executionMode === 'simple' && (
            <div className="flex items-center gap-2 pt-2">
              <label className="text-xs text-muted-foreground">Review:</label>
              <div className="flex-1 flex items-center gap-1 bg-muted rounded-md p-1">
                <button
                  type="button"
                  onClick={() => setReviewMode('off')}
                  className={cn(
                    'flex-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                    reviewMode === 'off'
                      ? 'bg-background shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Off
                </button>
                <button
                  type="button"
                  onClick={() => setReviewMode('limited')}
                  className={cn(
                    'flex-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                    reviewMode === 'limited'
                      ? 'bg-background shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Limited
                </button>
                <button
                  type="button"
                  onClick={() => setReviewMode('loop')}
                  className={cn(
                    'flex-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                    reviewMode === 'loop'
                      ? 'bg-background shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Loop
                </button>
              </div>
            </div>
          )}

          {/* Mode Description */}
          <p className="text-xs text-muted-foreground">
            {executionMode === 'simple' ? (
              reviewMode === 'off' ? (
                <>⚡ Fast mode - Direct execution, no code review</>
              ) : reviewMode === 'limited' ? (
                <>⚡ Fast mode - Execute with limited code review (2 iterations max)</>
              ) : (
                <>⚡ Fast mode - Execute with continuous review until code passes</>
              )
            ) : executionMode === 'agents' ? (
              <>🤖 Agents mode - Plan, review, then execute with specialized agents</>
            ) : (
              <>🎨 Custom mode - Execute your own custom agent workflows</>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}

interface ChatMessageProps {
  message: Message;
}

function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
        ) : (
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
            <Bot className="h-4 w-4" />
          </div>
        )}
      </div>

      <div
        className={cn(
          'flex-1 rounded-lg px-4 py-2',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
          // Add max height and scroll for long Claude output
          message.content.includes('Claude Code') || message.content.includes('Welcome') ? 'max-h-[400px] overflow-y-auto' : ''
        )}
      >
        <p className={cn(
          'text-sm whitespace-pre-wrap',
          // Use monospace font for Claude output
          message.content.includes('Claude Code') || message.content.includes('Welcome') ? 'font-mono text-xs' : ''
        )}>{message.content}</p>
        {message.createdAt && (
          <p
            className={cn(
              'text-xs mt-1',
              isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            {new Date(message.createdAt).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
