'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2, Wrench, Zap, Network } from 'lucide-react';
import { cn } from '@/lib/utils';

type ExecutionMode = 'simple' | 'agents';

interface ChatPanelProps {
  projectId: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  executionMode?: ExecutionMode;
}

interface ToolExecution {
  tool: string;
  input: Record<string, unknown>;
  result?: {
    success: boolean;
    [key: string]: unknown;
  };
}

interface OrchestratorPlan {
  executionId: string;
  plan?: {
    overall_strategy: string;
    tasks: Array<{
      title: string;
      description: string;
    }>;
  };
  specialized_agents?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

interface AgentProgress {
  agentName: string;
  taskId: string;
  status: 'running' | 'completed';
  message: string;
}

export function ChatPanel({ projectId }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('simple');
  const [currentToolExecution, setCurrentToolExecution] = useState<ToolExecution | null>(null);
  const [orchestratorPlan, setOrchestratorPlan] = useState<OrchestratorPlan | null>(null);
  const [agentProgress, setAgentProgress] = useState<AgentProgress[]>([]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentToolExecution]);

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          message: input,
          mode: executionMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Chat API error:', errorData);
        throw new Error(errorData || `Failed to send message: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantMessageId = crypto.randomUUID();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              break;
            }

            try {
              const event = JSON.parse(data);

              if (event.type === 'text') {
                // Append text to assistant message
                assistantContent += event.content;
                setMessages((prev) => {
                  const existing = prev.find((m) => m.id === assistantMessageId);
                  if (existing) {
                    return prev.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: assistantContent }
                        : m
                    );
                  } else {
                    return [
                      ...prev,
                      {
                        id: assistantMessageId,
                        role: 'assistant' as const,
                        content: assistantContent,
                        createdAt: new Date(),
                        executionMode,
                      },
                    ];
                  }
                });
              } else if (event.type === 'orchestrator_paused') {
                // Show plan for approval
                setOrchestratorPlan({
                  executionId: event.executionId,
                  plan: event.plan,
                  specialized_agents: event.specialized_agents,
                });
              } else if (event.type === 'agent_start' || event.type === 'task_update') {
                // Track agent progress
                setAgentProgress((prev) => [
                  ...prev,
                  {
                    agentName: event.payload?.agentName || event.payload?.agent || 'Unknown',
                    taskId: event.payload?.taskId || crypto.randomUUID(),
                    status: event.payload?.status || 'running',
                    message: event.payload?.message || event.message || '',
                  },
                ]);
              } else if (event.type === 'execution_completed') {
                // Clear plan approval UI
                setOrchestratorPlan(null);
                setAgentProgress([]);
                assistantContent += '\n\n✅ All tasks completed successfully!';
              } else if (event.type === 'tool_use') {
                // Show tool execution
                setCurrentToolExecution({
                  tool: event.tool,
                  input: event.input,
                });
              } else if (event.type === 'tool_result') {
                // Update tool execution with result
                setCurrentToolExecution((prev) =>
                  prev
                    ? {
                        ...prev,
                        result: event.result,
                      }
                    : null
                );
                // Clear tool execution after 2 seconds
                setTimeout(() => {
                  setCurrentToolExecution(null);
                }, 2000);
              } else if (event.type === 'error') {
                console.error('Chat error:', event.message);
                setMessages((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    role: 'assistant' as const,
                    content: `Error: ${event.message}`,
                    createdAt: new Date(),
                  },
                ]);
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: 'Sorry, I encountered an error. Please try again.',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setCurrentToolExecution(null);
    }
  };

  const handleApproveExecution = async () => {
    if (!orchestratorPlan) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          executionId: orchestratorPlan.executionId,
          projectId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resume execution');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              break;
            }

            try {
              const event = JSON.parse(data);

              if (event.type === 'task_update') {
                setAgentProgress((prev) => [
                  ...prev,
                  {
                    agentName: event.payload?.agentName || 'Unknown',
                    taskId: event.payload?.taskId || crypto.randomUUID(),
                    status: event.payload?.status || 'running',
                    message: event.payload?.message || '',
                  },
                ]);
              } else if (event.type === 'execution_completed') {
                setOrchestratorPlan(null);
                setAgentProgress([]);

                setMessages((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    role: 'assistant' as const,
                    content: '✅ All tasks completed successfully!',
                    createdAt: new Date(),
                    executionMode: 'agents',
                  },
                ]);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
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
        <h2 className="font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Assistant
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Ask me to help build your project
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="p-4 space-y-4">
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

          {/* Orchestrator Plan Approval */}
          {orchestratorPlan && (
            <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-start gap-3 mb-3">
                <Network className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                    🤖 Plan Ready for Review
                  </h3>
                  {orchestratorPlan.plan && (
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {orchestratorPlan.plan.overall_strategy}
                    </p>
                  )}
                </div>
              </div>

              {orchestratorPlan.plan?.tasks && (
                <div className="space-y-2 mb-3">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                    Tasks ({orchestratorPlan.plan.tasks.length}):
                  </p>
                  {orchestratorPlan.plan.tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-background rounded text-xs border"
                    >
                      <p className="font-medium">{task.title}</p>
                      <p className="text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {orchestratorPlan.specialized_agents && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Specialized Agents ({orchestratorPlan.specialized_agents.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {orchestratorPlan.specialized_agents.map((agent) => (
                      <span
                        key={agent.id}
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

          {/* Agent Progress */}
          {agentProgress.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Agent Execution Progress:
              </p>
              {agentProgress.slice(-3).map((progress, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-2 bg-muted/50 rounded border"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {progress.status === 'completed' ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{progress.agentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {progress.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tool Execution Indicator */}
          {currentToolExecution && (
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-muted">
              <div className="flex-shrink-0 mt-0.5">
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  Executing: {currentToolExecution.tool}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {JSON.stringify(currentToolExecution.input)}
                </p>
                {currentToolExecution.result && (
                  <div className="mt-2 p-2 bg-background rounded text-xs">
                    {currentToolExecution.result.success ? (
                      <span className="text-green-600">✓ Success</span>
                    ) : (
                      <span className="text-red-600">✗ Failed</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {isLoading && !currentToolExecution && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex-shrink-0">
                <Bot className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your AI assistant..."
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
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
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Mode Description */}
          <p className="text-xs text-muted-foreground">
            {executionMode === 'simple' ? (
              <>⚡ Fast mode - Direct tool execution</>
            ) : (
              <>🤖 Agents mode - Plan, review, then execute with specialized agents</>
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
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
