'use client';

/**
 * Terminal Component
 *
 * Browser-based terminal using xterm.js that provides interactive shell access
 * to the E2B sandbox for advanced users.
 *
 * Used for:
 * - Running `claude login` to authenticate with Claude.ai account
 * - Manual command execution and debugging
 * - Advanced file operations
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import 'xterm/css/xterm.css';

export interface TerminalProps {
  /** Project ID */
  projectId: string;
  /** Callback when terminal is ready */
  onReady?: () => void;
  /** Callback when terminal encounters error */
  onError?: (error: Error) => void;
}

export function Terminal({
  projectId,
  onReady,
  onError,
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const commandBufferRef = useRef<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  /**
   * Initialize terminal session
   * Creates an interactive bash shell in the E2B sandbox
   */
  const initializeTerminal = useCallback(async (xterm: XTerm) => {
    try {
      // Display welcome message
      xterm.writeln('\x1b[1;36m╔══════════════════════════════════════════════════════════╗\x1b[0m');
      xterm.writeln('\x1b[1;36m║\x1b[0m  \x1b[1;37mE2B Sandbox Terminal\x1b[0m                                 \x1b[1;36m║\x1b[0m');
      xterm.writeln('\x1b[1;36m╚══════════════════════════════════════════════════════════╝\x1b[0m');
      xterm.writeln('');
      xterm.writeln('\x1b[2mConnecting to sandbox shell...\x1b[0m');
      xterm.writeln('');

      // Create terminal session via API
      const response = await fetch(`/api/workspace/${projectId}/terminal/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cols: xterm.cols,
          rows: xterm.rows,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create terminal session');
      }

      const result = await response.json();
      console.log('[Terminal] Session created:', result);

      xterm.writeln('\x1b[1;32m✓ Shell connected\x1b[0m');
      xterm.writeln('\x1b[2mYou can now run commands in your E2B sandbox environment.\x1b[0m');
      xterm.writeln('');

      setIsConnected(true);
      setIsInitializing(false);
      onReady?.();
    } catch (error) {
      console.error('[Terminal] Failed to initialize:', error);
      xterm.writeln('\x1b[1;31m✗ Failed to connect to sandbox\x1b[0m');
      xterm.writeln(`\x1b[2m${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`);
      setIsInitializing(false);
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    }
  }, [projectId, onReady, onError]);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        selectionBackground: '#264f78',
      },
      allowProposedApi: true, // Required for some addons
    });

    // Add fit addon to auto-resize terminal
    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    // Add web links addon to make URLs clickable
    const webLinksAddon = new WebLinksAddon();
    xterm.loadAddon(webLinksAddon);

    // Open terminal in DOM
    xterm.open(terminalRef.current);
    fitAddon.fit();

    // Store refs
    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Initialize terminal session
    initializeTerminal(xterm);

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      xterm.dispose();
    };
  }, [projectId, initializeTerminal]);

  /**
   * Handle terminal input (keystrokes)
   */
  const handleTerminalInput = (xterm: XTerm, data: string) => {
    const code = data.charCodeAt(0);

    // Handle Enter key (execute command)
    if (code === 13) {
      const command = commandBufferRef.current;
      commandBufferRef.current = '';

      xterm.write('\r\n');

      if (command.trim()) {
        executeCommand(xterm, command);
      } else {
        xterm.write('$ ');
      }
      return;
    }

    // Handle Backspace
    if (code === 127) {
      if (commandBufferRef.current.length > 0) {
        commandBufferRef.current = commandBufferRef.current.slice(0, -1);
        xterm.write('\b \b');
      }
      return;
    }

    // Handle Ctrl+C
    if (code === 3) {
      commandBufferRef.current = '';
      xterm.write('^C\r\n$ ');
      return;
    }

    // Regular character
    commandBufferRef.current += data;
    xterm.write(data);
  };

  /**
   * Execute a command in the sandbox
   */
  const executeCommand = async (xterm: XTerm, command: string) => {
    try {
      const response = await fetch(`/api/workspace/${projectId}/terminal/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      if (!response.ok) {
        throw new Error('Command execution failed');
      }

      const { stdout, stderr, exitCode } = await response.json();

      // Write output with proper line endings
      if (stdout && stdout.trim()) {
        // Ensure output ends with newline
        const output = stdout.endsWith('\n') ? stdout : stdout + '\n';
        xterm.write(output.replace(/\n/g, '\r\n'));
      }

      // Write stderr in red
      if (stderr && stderr.trim()) {
        const output = stderr.endsWith('\n') ? stderr : stderr + '\n';
        xterm.write(`\x1b[1;31m${output.replace(/\n/g, '\r\n')}\x1b[0m`);
      }

      // Show exit code if non-zero
      if (exitCode !== 0) {
        xterm.write(`\x1b[1;31m[Exit code: ${exitCode}]\x1b[0m\r\n`);
      }

      // Show prompt
      xterm.write('\x1b[1;32m$\x1b[0m ');
    } catch (error) {
      console.error('[Terminal] Command execution error:', error);
      xterm.write(`\x1b[1;31mError: ${error instanceof Error ? error.message : String(error)}\x1b[0m\r\n`);
      xterm.write('\x1b[1;32m$\x1b[0m ');
    }
  };

  return (
    <div className="relative h-full w-full bg-[#1e1e1e]">
      {/* Connection status indicator */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-2 rounded-md bg-black/50 px-2 py-1 text-xs">
        <div
          className={`h-2 w-2 rounded-full ${
            isConnected ? 'bg-green-500' : isInitializing ? 'bg-yellow-500' : 'bg-red-500'
          }`}
        />
        <span className="text-gray-300">
          {isConnected ? 'Connected' : isInitializing ? 'Connecting...' : 'Disconnected'}
        </span>
      </div>

      {/* Terminal container */}
      <div ref={terminalRef} className="h-full w-full p-2" />
    </div>
  );
}
