'use client';

/**
 * Simple Chat Interface
 *
 * Beginner-friendly chat bubble interface for Claude Code
 * Hides terminal complexity and presents clean conversation UI
 */

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/ui/primitives/button';
import { Textarea } from '@/ui/primitives/textarea';
import { ScrollArea } from '@/ui/primitives/scroll-area';
import { Send, Bot, User, Loader2, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleChatInterfaceProps {
  projectId: string;
  streamMessages: Array<{
    type: 'message' | 'connected' | 'error';
    topic?: string;
    data?: unknown;
    timestamp?: number;
  }>;
  isConnected: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export function SimpleChatInterface({
  projectId,
  streamMessages,
  isConnected,
}: SimpleChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: 'Welcome to Claude Code! Click "Start Claude" below to begin. You can ask me to build features, fix bugs, or modify your code.',
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isClaudeStarted, setIsClaudeStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const currentResponseRef = useRef<string>('');

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Claude output streaming from Redis
  useEffect(() => {
    if (streamMessages.length === 0) return;

    const latestMessage = streamMessages[streamMessages.length - 1];
    if (!latestMessage || latestMessage.type !== 'message') return;

    // Handle Claude output
    if (latestMessage.topic === 'claude-output') {
      const outputData = latestMessage.data as { type: 'stdout' | 'stderr'; data: string };

      if (outputData.data) {
        // Strip ANSI codes for clean chat display
        const cleanText = stripAnsiCodes(outputData.data);

        // Accumulate output in current response
        currentResponseRef.current += cleanText;

        // Update or create assistant message
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];

          // If last message is from assistant, append to it
          if (lastMsg?.role === 'assistant') {
            return prev.slice(0, -1).concat({
              ...lastMsg,
              content: currentResponseRef.current,
            });
          }

          // Otherwise create new assistant message
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: currentResponseRef.current,
              createdAt: new Date(),
            },
          ];
        });
      }
    }

    // Handle file changes - show as system messages
    if (latestMessage.topic === 'file-change') {
      const fileData = latestMessage.data as { type: string; path: string };
      const icon = fileData.type === 'create' ? '✓' : fileData.type === 'update' ? '↻' : '✗';

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: `${icon} ${fileData.type}: ${fileData.path}`,
          createdAt: new Date(),
        },
      ]);
    }
  }, [streamMessages]);

  // Start Claude Code session
  const handleStartClaude = async () => {
    setIsStarting(true);

    try {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: 'Starting Claude Code CLI...',
          createdAt: new Date(),
        },
      ]);

      const response = await fetch(`/api/workspace/${projectId}/claude/start-pm2`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start Claude');
      }

      setIsClaudeStarted(true);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: '✓ Claude Code is ready! Ask me anything.',
          createdAt: new Date(),
        },
      ]);
    } catch (error) {
      console.error('[Simple Chat] Start error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsStarting(false);
    }
  };

  // Send message to Claude
  const handleSendMessage = async () => {
    if (!input.trim() || isSending || !isClaudeStarted) return;

    const userMessage = input.trim();
    setInput('');
    setIsSending(true);

    // Reset current response accumulator
    currentResponseRef.current = '';

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: userMessage,
        createdAt: new Date(),
      },
    ]);

    try {
      const response = await fetch(`/api/workspace/${projectId}/claude/send-input`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage + '\n', // Add newline for chat messages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Response will stream via Redis claude-output topic
    } catch (error) {
      console.error('[Simple Chat] Send error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: `✗ Error: ${errorMessage}`,
          createdAt: new Date(),
        },
      ]);

      // If session expired, reset to allow restart
      if (errorMessage.includes('expired') || errorMessage.includes('not found')) {
        setIsClaudeStarted(false);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Handle Enter key to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col border-l bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Claude Code
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              AI coding assistant
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
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Authentication Banner */}
      {!isClaudeStarted && (
        <div className="border-b px-4 py-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Claude Code Not Started
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Start Claude Code to begin coding. Uses your Claude.ai subscription ($20/month).
              </p>
              <Button
                onClick={handleStartClaude}
                size="sm"
                disabled={isStarting}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Terminal className="h-3.5 w-3.5 mr-2" />
                    Start Claude Code
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Loading indicator */}
          {isSending && (
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Claude is thinking...</span>
              </div>
            </div>
          )}

          {/* Invisible div at end for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isClaudeStarted
                ? 'Ask Claude to help with your code... (Enter to send, Shift+Enter for new line)'
                : 'Start Claude Code to begin chatting...'
            }
            disabled={!isClaudeStarted || isSending}
            className="min-h-[80px] resize-none"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || !isClaudeStarted || isSending}
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
        <p className="text-xs text-muted-foreground mt-2">
          ⚡ Simple Mode - Clean chat interface for beginners
        </p>
      </div>
    </div>
  );
}

interface ChatMessageProps {
  message: Message;
}

function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="px-4 py-2 rounded-full bg-muted/50 text-xs text-muted-foreground max-w-md text-center">
          {message.content}
        </div>
      </div>
    );
  }

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
          'flex-1 rounded-lg px-4 py-2 max-w-[80%]',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={cn(
            'text-xs mt-1',
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {message.createdAt.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

/**
 * Strip ANSI color codes and escape sequences from terminal output
 */
function stripAnsiCodes(text: string): string {
  return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}
