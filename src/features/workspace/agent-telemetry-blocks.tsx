'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Brain, Wrench, CheckCircle2, AlertCircle, Code, Terminal, FileEdit, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentThinkingBlockProps {
  content: string;
  timestamp: number;
}

export function AgentThinkingBlock({ content, timestamp }: AgentThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
        )}
        <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
            Agent Thinking
          </p>
          <p className="text-xs text-purple-700 dark:text-purple-300">
            {new Date(timestamp).toLocaleTimeString()}
          </p>
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-purple-200 dark:border-purple-800">
          <div className="mt-3 p-3 bg-background rounded text-xs font-mono whitespace-pre-wrap text-muted-foreground">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

interface ToolUseBlockProps {
  tool: string;
  input: any;
  result?: any;
  timestamp: number;
}

export function ToolUseBlock({ tool, input, result, timestamp }: ToolUseBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'terminal':
        return <Terminal className="h-4 w-4" />;
      case 'createOrUpdateFiles':
        return <FileEdit className="h-4 w-4" />;
      case 'readFiles':
        return <Code className="h-4 w-4" />;
      case 'runCode':
        return <PlayCircle className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };

  const getToolColor = (toolName: string) => {
    switch (toolName) {
      case 'terminal':
        return 'blue';
      case 'createOrUpdateFiles':
        return 'green';
      case 'readFiles':
        return 'yellow';
      case 'runCode':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const color = getToolColor(tool);
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400',
    orange: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400',
    gray: 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400',
  };

  const bgClasses = {
    blue: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
    green: 'hover:bg-green-100 dark:hover:bg-green-900/30',
    yellow: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
    orange: 'hover:bg-orange-100 dark:hover:bg-orange-900/30',
    gray: 'hover:bg-gray-100 dark:hover:bg-gray-900/30',
  };

  const textClasses = {
    blue: 'text-blue-900 dark:text-blue-100',
    green: 'text-green-900 dark:text-green-100',
    yellow: 'text-yellow-900 dark:text-yellow-100',
    orange: 'text-orange-900 dark:text-orange-100',
    gray: 'text-gray-900 dark:text-gray-100',
  };

  const subtextClasses = {
    blue: 'text-blue-700 dark:text-blue-300',
    green: 'text-green-700 dark:text-green-300',
    yellow: 'text-yellow-700 dark:text-yellow-300',
    orange: 'text-orange-700 dark:text-orange-300',
    gray: 'text-gray-700 dark:text-gray-300',
  };

  return (
    <div className={cn('border rounded-lg overflow-hidden', colorClasses[color])}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn('w-full flex items-center gap-3 p-3 transition-colors', bgClasses[color])}
      >
        {isExpanded ? (
          <ChevronDown className={cn('h-4 w-4 flex-shrink-0', colorClasses[color])} />
        ) : (
          <ChevronRight className={cn('h-4 w-4 flex-shrink-0', colorClasses[color])} />
        )}
        <div className={cn('flex-shrink-0', colorClasses[color])}>
          {getToolIcon(tool)}
        </div>
        <div className="flex-1 text-left">
          <p className={cn('text-sm font-medium', textClasses[color])}>
            {tool}
          </p>
          <p className={cn('text-xs', subtextClasses[color])}>
            {new Date(timestamp).toLocaleTimeString()}
          </p>
        </div>
      </button>

      {isExpanded && (
        <div className={cn('px-3 pb-3 border-t', colorClasses[color])}>
          <div className="mt-3 space-y-3">
            <div>
              <p className={cn('text-xs font-medium mb-2', textClasses[color])}>Input:</p>
              <pre className="p-3 bg-background rounded text-xs font-mono overflow-x-auto">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>

            {result && (
              <div>
                <p className={cn('text-xs font-medium mb-2', textClasses[color])}>Result:</p>
                <div className="p-3 bg-background rounded text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ReviewFeedbackBlockProps {
  approved: boolean;
  iteration: number;
  feedback: string;
  willRetry?: boolean;
  timestamp: number;
}

export function ReviewFeedbackBlock({ approved, iteration, feedback, willRetry, timestamp }: ReviewFeedbackBlockProps) {
  const [isExpanded, setIsExpanded] = useState(!approved); // Auto-expand if not approved

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden',
      approved
        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
        : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
    )}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-3 p-3 transition-colors',
          approved
            ? 'hover:bg-green-100 dark:hover:bg-green-900/30'
            : 'hover:bg-orange-100 dark:hover:bg-orange-900/30'
        )}
      >
        {isExpanded ? (
          <ChevronDown className={cn(
            'h-4 w-4 flex-shrink-0',
            approved ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
          )} />
        ) : (
          <ChevronRight className={cn(
            'h-4 w-4 flex-shrink-0',
            approved ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
          )} />
        )}
        {approved ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
        )}
        <div className="flex-1 text-left">
          <p className={cn(
            'text-sm font-medium',
            approved ? 'text-green-900 dark:text-green-100' : 'text-orange-900 dark:text-orange-100'
          )}>
            {approved ? '✅ Code Approved' : `⚠️ Review Iteration ${iteration}`}
          </p>
          <p className={cn(
            'text-xs',
            approved ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'
          )}>
            {new Date(timestamp).toLocaleTimeString()}
            {!approved && willRetry !== undefined && (
              <span className="ml-2">• {willRetry ? 'Retrying...' : 'Final attempt'}</span>
            )}
          </p>
        </div>
      </button>

      {isExpanded && (
        <div className={cn(
          'px-3 pb-3 border-t',
          approved ? 'border-green-200 dark:border-green-800' : 'border-orange-200 dark:border-orange-800'
        )}>
          <div className="mt-3 p-3 bg-background rounded text-sm whitespace-pre-wrap">
            {feedback}
          </div>
        </div>
      )}
    </div>
  );
}

interface AgentIterationSummaryProps {
  iteration: number;
  status: 'coding' | 'reviewing' | 'approved' | 'fixing';
}

export function AgentIterationSummary({ iteration, status }: AgentIterationSummaryProps) {
  const statusConfig = {
    coding: {
      icon: <Code className="h-4 w-4" />,
      label: 'Coding',
      color: 'blue',
    },
    reviewing: {
      icon: <Brain className="h-4 w-4" />,
      label: 'Reviewing',
      color: 'purple',
    },
    approved: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: 'Approved',
      color: 'green',
    },
    fixing: {
      icon: <Wrench className="h-4 w-4" />,
      label: 'Fixing Issues',
      color: 'orange',
    },
  };

  const config = statusConfig[status];
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
    green: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg border', colorClasses[config.color])}>
      <div className={colorClasses[config.color]}>
        {config.icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">
          Iteration {iteration}: {config.label}
        </p>
      </div>
    </div>
  );
}
