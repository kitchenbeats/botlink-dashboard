'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/ui/primitives/button';
import { Textarea } from '@/ui/primitives/textarea';
import { ScrollArea } from '@/ui/primitives/scroll-area';
import { Send, Bot, User, Loader2, Zap, Network, Workflow, Terminal, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [isClaudeAuthenticated, setIsClaudeAuthenticated] = useState<boolean | null>(null);

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

  // Show "Start Claude Code" button in Simple mode
  useEffect(() => {
    if (executionMode === 'simple') {
      setIsClaudeAuthenticated(false);
    }
  }, [executionMode]);

  // Handle Redis stream messages
  useEffect(() => {
    if (!streamMessages || streamMessages.length === 0) return;

    const latestMessage = streamMessages[streamMessages.length - 1];
    if (!latestMessage || latestMessage.type !== 'message') return;

    // Handle Claude login output streaming
    if (latestMessage.topic === 'claude-login') {
      const loginData = latestMessage.data as {
        type: 'status' | 'output' | 'error' | 'url-found';
        message?: string;
        data?: string;
        url?: string;
      };

      console.log('[Chat] Claude login event:', loginData);

      // Show login output in chat
      if (loginData.type === 'output') {
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];

          // If last message is a login status message, append to it
          if (lastMsg && lastMsg.content.includes('🔑')) {
            return prev.slice(0, -1).concat({
              ...lastMsg,
              content: lastMsg.content + '\n' + (loginData.data || ''),
            });
          }

          // Otherwise create new message
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: loginData.data || '',
              createdAt: new Date(),
            },
          ];
        });
      }

      return;
    }

    // Handle Claude output streaming (Simple Mode)
    if (latestMessage.topic === 'claude-output') {
      const outputData = latestMessage.data as { type: 'stdout' | 'stderr'; data: string };
      console.log('[Chat] Received claude-output:', outputData);

      // Append to current Claude output message or create new one
      setMessages((prev) => {
        console.log('[Chat] Current messages:', prev.length, 'Last message:', prev[prev.length - 1]);
        // Find the last Claude output message (look for messages with Claude content)
        const lastMsg = prev[prev.length - 1];

        // If last message is from assistant AND contains Claude-like content, append to it
        if (lastMsg && lastMsg.role === 'assistant' &&
           (lastMsg.content.includes('Claude Code') || lastMsg.content.includes('🔑') ||
            lastMsg.content.includes('Welcome') || lastMsg.content.includes('Choose the text style'))) {
          return prev.slice(0, -1).concat({
            ...lastMsg,
            content: lastMsg.content + (outputData.data || ''),
          });
        }

        // Otherwise create new Claude output message
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: outputData.data || '',
            createdAt: new Date(),
            executionMode: 'simple',
          },
        ];
      });

      // Clear loading state
      setIsLoading(false);
      setCurrentStatus(null);
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
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.status}`);
        }

        const result = await response.json();

        // Simple mode - message sent to Claude PTY, response will stream via redis
        if (executionMode === 'simple') {
          // Just clear loading - the real Claude output will stream via 'claude-output' topic
          setIsLoading(false);
          console.log('[Chat] Message sent to Claude PTY, waiting for streaming response...');
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

      {/* Claude Authentication Banner - Only in Simple Mode */}
      {executionMode === 'simple' && isClaudeAuthenticated !== null && (
        <div className={cn(
          'border-b px-4 py-3',
          isClaudeAuthenticated
            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
            : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
        )}>
          <div className="flex items-start gap-3">
            {isClaudeAuthenticated ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              {isClaudeAuthenticated ? (
                <>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Claude Code Authenticated
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Using your Claude.ai subscription ($20/month unlimited usage)
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    Authentication Required
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Authenticate with your Claude.ai account to use Simple Mode with your $20/month subscription
                  </p>
                  <Button
                    onClick={async () => {
                      try {
                        setIsLoading(true);

                        // Send 'claude' command to the already-open PTY
                        const response = await fetch(`/api/workspace/${projectId}/claude/start`, {
                          method: 'POST',
                        });

                        const result = await response.json();
                        console.log('[Claude Start] Server response:', result);

                        if (!response.ok) {
                          throw new Error(result.error || 'Failed to start Claude');
                        }
                      } catch (error) {
                        console.error('Start Claude error:', error);
                        setMessages((prev) => [
                          ...prev,
                          {
                            id: crypto.randomUUID(),
                            role: 'assistant',
                            content: `❌ Failed to start Claude: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            createdAt: new Date(),
                          },
                        ]);
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    size="sm"
                    disabled={isLoading}
                    className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                        Starting Claude Code...
                      </>
                    ) : (
                      <>
                        <Terminal className="h-3.5 w-3.5 mr-2" />
                        Start Claude Code
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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

          {/* Mode Description */}
          <p className="text-xs text-muted-foreground">
            {executionMode === 'simple' ? (
              <>⚡ Fast mode - Direct tool execution</>
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
