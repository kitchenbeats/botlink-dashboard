'use client';

/**
 * Simple Mode Terminal
 *
 * Real PTY terminal interface for Claude Code CLI using xterm.js
 * Advanced users can type directly into the Claude Code terminal
 */

import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Button } from '@/ui/primitives/button';
import { Loader2, Terminal, AlertCircle } from 'lucide-react';
import 'xterm/css/xterm.css';

interface SimpleModeTerminalChatProps {
  projectId: string;
  streamMessages: Array<{
    type: 'message' | 'connected' | 'error';
    topic?: string;
    data?: unknown;
    timestamp?: number;
  }>;
  isConnected: boolean;
}

export function SimpleModeTerminalChat({
  projectId,
  streamMessages,
  isConnected,
}: SimpleModeTerminalChatProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isClaudeStarted, setIsClaudeStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Use ref to access current state in callbacks without causing re-renders
  const isClaudeStartedRef = useRef(isClaudeStarted);
  useEffect(() => {
    isClaudeStartedRef.current = isClaudeStarted;
  }, [isClaudeStarted]);

  // Initialize xterm.js terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    // Wait for next tick to ensure DOM is fully ready
    const timer = setTimeout(() => {
      if (!terminalRef.current) return;

      const xterm = new XTerm({
        cursorBlink: false, // No cursor in output-only mode
        fontSize: 13,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: 'transparent', // Hide cursor
          selectionBackground: '#264f78',
          black: '#1e1e1e',
          red: '#f48771',
          green: '#a9dc76',
          yellow: '#ffd866',
          blue: '#78dce8',
          magenta: '#ab9df2',
          cyan: '#78dce8',
          white: '#fcfcfa',
          brightBlack: '#727072',
          brightRed: '#f48771',
          brightGreen: '#a9dc76',
          brightYellow: '#ffd866',
          brightBlue: '#78dce8',
          brightMagenta: '#ab9df2',
          brightCyan: '#78dce8',
          brightWhite: '#fcfcfa',
        },
        allowProposedApi: true,
        convertEol: true, // Convert \n to \r\n automatically
      });

      const fitAddon = new FitAddon();
      xterm.loadAddon(fitAddon);

      const webLinksAddon = new WebLinksAddon();
      xterm.loadAddon(webLinksAddon);

      xterm.open(terminalRef.current);

      // Use requestAnimationFrame to ensure dimensions are available
      requestAnimationFrame(() => {
        try {
          fitAddon.fit();
        } catch (error) {
          console.warn('[Terminal] Failed to fit terminal on init:', error);
        }
      });

      // Store refs
      xtermRef.current = xterm;
      fitAddonRef.current = fitAddon;

      // Welcome message
      xterm.writeln('\x1b[1;36m╔══════════════════════════════════════════════════════════╗\x1b[0m');
      xterm.writeln('\x1b[1;36m║\x1b[0m  \x1b[1;37mClaude Code CLI - Terminal Mode\x1b[0m                       \x1b[1;36m║\x1b[0m');
      xterm.writeln('\x1b[1;36m╚══════════════════════════════════════════════════════════╝\x1b[0m');
      xterm.writeln('');
      xterm.writeln('\x1b[2mAdvanced terminal interface - you can type directly into Claude Code.\x1b[0m');
      xterm.writeln('\x1b[2mClick "Start Claude Code" below to begin.\x1b[0m');
      xterm.writeln('');

      // Handle user input - send directly to PTY
      xterm.onData(async (data) => {
        if (!isClaudeStartedRef.current) return;

        try {
          // Send raw input to Claude PTY via Redis (no newline added - terminal controls that)
          const response = await fetch(`/api/workspace/${projectId}/claude/send-input`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: data }),
          });

          if (!response.ok) {
            const result = await response.json();
            const errorMsg = result.error || 'Failed to send input';
            xterm.write(`\x1b[1;31m✗ Error: ${errorMsg}\x1b[0m\r\n`);
          }
        } catch (error) {
          console.error('[Terminal] Input error:', error);
        }
      });

      // Handle window resize
      const handleResize = () => {
        try {
          fitAddon.fit();
        } catch (error) {
          console.warn('[Terminal] Failed to fit terminal on resize:', error);
        }
      };
      window.addEventListener('resize', handleResize);
    }, 0);

    return () => {
      clearTimeout(timer);
      const xterm = xtermRef.current;
      if (xterm) {
        xterm.dispose();
        xtermRef.current = null;
        fitAddonRef.current = null;
      }
    };
  }, [projectId]);

  // Handle Claude output streaming from Redis
  useEffect(() => {
    if (streamMessages.length === 0) return;

    const latestMessage = streamMessages[streamMessages.length - 1];
    if (!latestMessage || latestMessage.type !== 'message') return;

    // Handle Claude output
    if (latestMessage.topic === 'claude-output') {
      const outputData = latestMessage.data as { type: 'stdout' | 'stderr'; data: string };

      if (outputData.data) {
        // Write directly to terminal with raw ANSI codes
        const term = xtermRef.current;
        if (!term) {
          console.error('[CLIENT TERMINAL] No xterm instance available!');
          return;
        }

        try {
          if (outputData.type === 'stderr') {
            term.write(`\x1b[1;31m${outputData.data}\x1b[0m`);
          } else {
            term.write(outputData.data);
          }
        } catch (error) {
          console.error('[CLIENT TERMINAL] Failed to write to terminal:', error);
        }
      }
    }

    // Handle file changes
    if (latestMessage.topic === 'file-change') {
      const fileData = latestMessage.data as { type: string; path: string };
      const icon = fileData.type === 'create' ? '✓' : fileData.type === 'update' ? '↻' : '✗';
      xtermRef.current?.writeln(`\x1b[2m${icon} ${fileData.type}: ${fileData.path}\x1b[0m`);
    }
  }, [streamMessages]);

  // Start Claude Code session
  const handleStartClaude = async () => {
    setIsStarting(true);

    try {
      xtermRef.current?.writeln('\x1b[1;33m⟳ Starting Claude Code CLI...\x1b[0m');
      xtermRef.current?.writeln('');

      const response = await fetch(`/api/workspace/${projectId}/claude/start-pm2`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start Claude');
      }

      setIsClaudeStarted(true);
      xtermRef.current?.focus();
    } catch (error) {
      console.error('[Simple Mode] Start error:', error);
      xtermRef.current?.writeln(`\x1b[1;31m✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`);
      xtermRef.current?.writeln('');
    } finally {
      setIsStarting(false);
    }
  };


  return (
    <div className="h-full flex flex-col border-l bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Claude Code CLI
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Interactive terminal chat with Claude
          </p>
        </div>
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Authentication Banner */}
      {!isClaudeStarted && (
        <div className="border-b px-4 py-3 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Start Claude Code Session
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Uses your Claude.ai subscription ($20/month unlimited usage)
              </p>
              <Button
                onClick={handleStartClaude}
                size="sm"
                disabled={isStarting}
                className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white"
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

      {/* Terminal Output - Full screen terminal */}
      <div className="flex-1 bg-[#1e1e1e] overflow-hidden">
        <div ref={terminalRef} className="h-full w-full p-4" />
      </div>
    </div>
  );
}
