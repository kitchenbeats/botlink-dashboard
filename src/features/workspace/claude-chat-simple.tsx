'use client';

/**
 * Simple Claude Chat Interface
 * Clean, readable, scrollable UI with setup-token flow
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/ui/primitives/button';
import { Textarea } from '@/ui/primitives/textarea';
import { Send, Bot, Loader2, AlertCircle, User, X, ChevronDown, ChevronRight, Terminal, FileEdit } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamic import to avoid SSR issues with xterm.js
const ClaudeSetupTerminal = dynamic(
  () => import('./claude-setup-terminal').then(mod => ({ default: mod.ClaudeSetupTerminal })),
  { ssr: false }
);

interface ClaudeChatSimpleProps {
  projectId: string;
}

interface ThinkingBlock {
  type: 'thinking';
  text: string;
}

interface ToolUseBlock {
  type: 'tool_use';
  name: string;
  input: Record<string, unknown>;
}

interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  name: string;
  result: unknown;
}

interface TextBlock {
  type: 'text';
  text: string;
}

interface StatsBlock {
  type: 'done';
  iterations: number;
  changes: number;
}

type AssistantContent = ThinkingBlock | ToolUseBlock | ToolResultBlock | TextBlock | StatsBlock;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | AssistantContent[];
  timestamp: number;
}

/**
 * Renders a single content block from assistant's response
 */
function AssistantContentBlock({ block }: { block: AssistantContent }) {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  if (block.type === 'thinking') {
    return (
      <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <button
          onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/40 rounded-lg transition-colors"
        >
          {isThinkingExpanded ? (
            <ChevronDown className="h-3 w-3 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
          )}
          <Bot className="h-3 w-3 flex-shrink-0" />
          <span className="font-medium">Thinking...</span>
        </button>
        {isThinkingExpanded && (
          <div className="px-3 pb-2">
            <pre className="text-xs whitespace-pre-wrap font-sans text-purple-900 dark:text-purple-100">
              {block.text}
            </pre>
          </div>
        )}
      </div>
    );
  }

  if (block.type === 'tool_use') {
    return (
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">
            {block.name}
          </span>
        </div>
        <pre className="text-xs bg-blue-100 dark:bg-blue-950/40 rounded px-2 py-1 overflow-x-auto font-mono text-blue-900 dark:text-blue-100">
          {JSON.stringify(block.input, null, 2)}
        </pre>
      </div>
    );
  }

  if (block.type === 'tool_result') {
    return (
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2 mb-2">
          <FileEdit className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
          <span className="text-xs font-semibold text-green-900 dark:text-green-100">
            {block.name} result
          </span>
        </div>
        <pre className="text-xs bg-green-100 dark:bg-green-950/40 rounded px-2 py-1 overflow-x-auto font-mono text-green-900 dark:text-green-100 max-h-40 overflow-y-auto">
          {typeof block.result === 'string'
            ? block.result
            : JSON.stringify(block.result, null, 2)}
        </pre>
      </div>
    );
  }

  if (block.type === 'text') {
    return (
      <div className="bg-muted rounded-lg px-3 py-2">
        <pre className="text-sm whitespace-pre-wrap font-sans">{block.text}</pre>
      </div>
    );
  }

  if (block.type === 'done') {
    return (
      <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/50 rounded text-xs text-muted-foreground">
        <span>Completed in {block.iterations} iteration{block.iterations !== 1 ? 's' : ''}</span>
        <span>•</span>
        <span>{block.changes} change{block.changes !== 1 ? 's' : ''} made</span>
      </div>
    );
  }

  return null;
}

export function ClaudeChatSimple({ projectId }: ClaudeChatSimpleProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSetupTerminal, setShowSetupTerminal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  /**
   * Check if Claude is authenticated (token file exists)
   */
  const checkAuthentication = useCallback(async () => {
    console.log('[Claude Chat] Checking authentication...');
    setIsCheckingAuth(true);

    try {
      const response = await fetch(`/api/workspace/${projectId}/claude/check-auth`);
      const data = await response.json();

      console.log('[Claude Chat] Auth check result:', data);

      if (data.authenticated) {
        setIsAuthenticated(true);
        console.log('[Claude Chat] ✓ Already authenticated');
      } else {
        setIsAuthenticated(false);
        console.log('[Claude Chat] ✗ Not authenticated');
      }
    } catch (error) {
      console.error('[Claude Chat] Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  }, [projectId]);

  /**
   * Check authentication on mount
   */
  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  /**
   * Handle setup complete - close modal and update auth status
   */
  const handleSetupComplete = useCallback(() => {
    console.log('[Claude Chat] Setup complete');
    setShowSetupTerminal(false);
    setIsAuthenticated(true);
  }, []);

  /**
   * Start setup flow - show setup terminal modal
   */
  const handleStartSetup = useCallback(() => {
    console.log('[Claude Chat] Starting setup flow...');
    setShowSetupTerminal(true);
  }, []);

  /**
   * Send message to Claude via SDK
   */
  const handleSendMessage = async () => {
    if (!input.trim() || isSending || !isAuthenticated) return;

    const userMessage = input.trim();
    setInput('');
    setIsSending(true);

    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    }]);

    try {
      console.log('[Claude Chat] Sending message to SDK:', userMessage);

      const response = await fetch(`/api/workspace/${projectId}/claude/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Read NDJSON stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream');
      }

      let buffer = '';
      const contentBlocks: AssistantContent[] = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const chunk = JSON.parse(line);

            if (chunk.type === 'thinking') {
              contentBlocks.push({ type: 'thinking', text: chunk.text });
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'assistant' && Array.isArray(last.content)) {
                  return [...prev.slice(0, -1), {
                    ...last,
                    content: [...last.content, { type: 'thinking', text: chunk.text }]
                  }];
                }
                return [...prev, {
                  role: 'assistant',
                  content: [{ type: 'thinking', text: chunk.text }],
                  timestamp: Date.now(),
                }];
              });
            } else if (chunk.type === 'tool_use') {
              contentBlocks.push({ type: 'tool_use', name: chunk.name, input: chunk.input });
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'assistant' && Array.isArray(last.content)) {
                  return [...prev.slice(0, -1), {
                    ...last,
                    content: [...last.content, { type: 'tool_use', name: chunk.name, input: chunk.input }]
                  }];
                }
                return [...prev, {
                  role: 'assistant',
                  content: [{ type: 'tool_use', name: chunk.name, input: chunk.input }],
                  timestamp: Date.now(),
                }];
              });
            } else if (chunk.type === 'tool_result') {
              contentBlocks.push({
                type: 'tool_result',
                tool_use_id: chunk.tool_use_id,
                name: chunk.name,
                result: chunk.result
              });
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'assistant' && Array.isArray(last.content)) {
                  return [...prev.slice(0, -1), {
                    ...last,
                    content: [...last.content, {
                      type: 'tool_result',
                      tool_use_id: chunk.tool_use_id,
                      name: chunk.name,
                      result: chunk.result
                    }]
                  }];
                }
                return [...prev, {
                  role: 'assistant',
                  content: [{
                    type: 'tool_result',
                    tool_use_id: chunk.tool_use_id,
                    name: chunk.name,
                    result: chunk.result
                  }],
                  timestamp: Date.now(),
                }];
              });
            } else if (chunk.type === 'text' && chunk.text) {
              contentBlocks.push({ type: 'text', text: chunk.text });
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'assistant' && Array.isArray(last.content)) {
                  return [...prev.slice(0, -1), {
                    ...last,
                    content: [...last.content, { type: 'text', text: chunk.text }]
                  }];
                }
                return [...prev, {
                  role: 'assistant',
                  content: [{ type: 'text', text: chunk.text }],
                  timestamp: Date.now(),
                }];
              });
            } else if (chunk.type === 'done') {
              console.log('[Claude Chat] Stream complete - iterations:', chunk.iterations, 'changes:', chunk.changes);
              contentBlocks.push({ type: 'done', iterations: chunk.iterations, changes: chunk.changes });
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'assistant' && Array.isArray(last.content)) {
                  return [...prev.slice(0, -1), {
                    ...last,
                    content: [...last.content, { type: 'done', iterations: chunk.iterations, changes: chunk.changes }]
                  }];
                }
                return prev;
              });
            } else if (chunk.type === 'error') {
              throw new Error(chunk.error);
            }
          } catch (parseError) {
            console.error('[Claude Chat] Failed to parse chunk:', parseError);
          }
        }
      }

    } catch (error) {
      console.error('[Claude Chat] Send error:', error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Handle Enter key
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b px-4 py-3 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <div>
              <h2 className="font-semibold text-sm">Claude Code</h2>
              <p className="text-xs text-muted-foreground">AI coding assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {/* Authentication status */}
            {!isCheckingAuth && (
              <div className="flex items-center gap-1.5">
                {isAuthenticated ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Authenticated</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-muted-foreground">Not authenticated</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Authentication Banner */}
      {!isAuthenticated && (
        <div className="flex-shrink-0 border-b px-4 py-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {isCheckingAuth ? (
                <>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Checking Authentication...
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Verifying Claude Code setup
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Authentication Required
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Connect your Anthropic API key to use Claude Code
                  </p>
                  <Button
                    onClick={handleStartSetup}
                    size="sm"
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Authenticate Claude Code
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages - FIXED SCROLL */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ minHeight: 0 }} // CRITICAL: allows flex child to shrink
      >
        <div className="space-y-3 max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
              <Bot className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">Welcome to Claude Code!</p>
              <p className="text-xs mt-2">
                {isAuthenticated ? 'Start chatting below!' : 'Authenticate to begin'}
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index}>
              {message.role === 'user' && (
                <div className="flex gap-2 justify-end">
                  <div className="bg-blue-600 text-white rounded-lg px-3 py-2 max-w-[80%]">
                    <pre className="text-sm whitespace-pre-wrap font-sans">{message.content as string}</pre>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {message.role === 'assistant' && (
                <div className="flex gap-2">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="space-y-2 max-w-[80%]">
                    {Array.isArray(message.content) ? (
                      message.content.map((block, blockIdx) => (
                        <AssistantContentBlock key={blockIdx} block={block} />
                      ))
                    ) : (
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <pre className="text-sm whitespace-pre-wrap font-sans">{message.content}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {message.role === 'system' && (
                <div className="flex justify-center">
                  <div className="bg-muted/50 rounded-lg px-3 py-1.5 text-xs text-muted-foreground max-w-[90%]">
                    <pre className="whitespace-pre-wrap font-mono">{message.content as string}</pre>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isSending && (
            <div className="flex gap-2">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - FIXED */}
      <div className="flex-shrink-0 border-t p-4 bg-background">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isAuthenticated
                ? 'Type your message... (Enter to send, Shift+Enter for new line)'
                : 'Authenticate to begin...'
            }
            disabled={!isAuthenticated || isSending}
            className="min-h-[60px] max-h-[120px] resize-none"
            rows={2}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || !isAuthenticated || isSending}
            size="sm"
            className="self-end"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Setup Terminal Modal */}
      {showSetupTerminal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-[90vw] h-[80vh] max-w-5xl bg-background border rounded-lg shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <div>
                  <h2 className="font-semibold text-sm">Claude Setup</h2>
                  <p className="text-xs text-muted-foreground">Enter your Anthropic API key</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSetupTerminal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Terminal */}
            <div className="h-[calc(100%-60px)]">
              <ClaudeSetupTerminal
                projectId={projectId}
                onSetupComplete={handleSetupComplete}
                onError={(error) => {
                  console.error('[Claude Setup] Error:', error);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
