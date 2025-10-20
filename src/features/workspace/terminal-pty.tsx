'use client';

/**
 * PTY Terminal Component
 *
 * Real persistent PTY terminal using E2B v2 native PTY support.
 * Maintains session state - perfect for interactive CLIs like `claude`, `vim`, etc.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import 'xterm/css/xterm.css';

export interface TerminalPtyProps {
  /** Project ID */
  projectId: string;
  /** Callback when terminal is ready */
  onReady?: () => void;
  /** Callback when terminal encounters error */
  onError?: (error: Error) => void;
}

export function TerminalPty({
  projectId,
  onReady,
  onError,
}: TerminalPtyProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isConnectedRef = useRef(false);
  const inputBufferRef = useRef<string>('');
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [ptyPid, setPtyPid] = useState<number | null>(null);

  /**
   * Connect to PTY output stream
   */
  const connectToPtyStream = useCallback((xterm: XTerm, fitAddon: FitAddon) => {
    console.log('[Terminal PTY] Connecting to stream...');

    const eventSource = new EventSource(`/api/workspace/${projectId}/terminal/pty-stream`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'connected':
            console.log('[Terminal PTY] Connected, PID:', message.pid);
            setPtyPid(message.pid);
            isConnectedRef.current = true;  // Set ref for input handler
            setIsConnected(true);
            setIsInitializing(false);
            onReady?.();

            // Send initial resize
            if (xterm.cols && xterm.rows) {
              fetch(`/api/workspace/${projectId}/terminal/pty-stream`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cols: xterm.cols, rows: xterm.rows }),
              }).catch(console.error);
            }
            break;

          case 'data':
            // Write PTY output to terminal
            if (message.data) {
              xterm.write(message.data);
            }
            break;

          case 'error':
            console.error('[Terminal PTY] Error:', message.message);
            xterm.writeln(`\r\n\x1b[1;31m✗ PTY Error: ${message.message}\x1b[0m\r\n`);
            onError?.(new Error(message.message));
            break;
        }
      } catch (error) {
        console.error('[Terminal PTY] Failed to parse event:', error);
      }
    });

    eventSource.addEventListener('error', (error) => {
      console.error('[Terminal PTY] EventSource error:', error);
      isConnectedRef.current = false;  // Unset ref
      setIsConnected(false);
      setIsInitializing(false);

      xterm.writeln(`\r\n\x1b[1;31m✗ Connection lost. Retrying...\x1b[0m\r\n`);
      onError?.(new Error('PTY connection failed'));

      // Auto-reconnect after 2 seconds
      setTimeout(() => {
        if (!isConnectedRef.current && terminalRef.current && xtermRef.current) {
          connectToPtyStream(xtermRef.current, fitAddon);
        }
      }, 2000);
    });
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
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',
      },
      allowProposedApi: true,
      convertEol: false, // PTY handles this
    });

    // Add fit addon to auto-resize terminal
    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    // Add web links addon to make URLs clickable
    const webLinksAddon = new WebLinksAddon();
    xterm.loadAddon(webLinksAddon);

    // Open terminal in DOM
    xterm.open(terminalRef.current);

    // Store refs
    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Fit terminal after DOM is ready
    requestAnimationFrame(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        console.warn('[Terminal PTY] Failed to fit on mount:', e);
      }
    });

    // Connect to PTY stream
    connectToPtyStream(xterm, fitAddon);

    // Flush buffered input to server
    const flushInput = () => {
      if (inputBufferRef.current.length === 0) return;

      const bufferedData = inputBufferRef.current;
      inputBufferRef.current = '';

      // Send to server (fire and forget)
      fetch(`/api/workspace/${projectId}/terminal/pty-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: bufferedData }),
      }).catch(error => {
        console.error('[Terminal PTY] Failed to send input:', error);
      });
    };

    // Handle user input - batch keystrokes for better performance
    xterm.onData((data) => {
      // Use ref to get current connection status
      if (!isConnectedRef.current) {
        console.log('[Terminal PTY] Not connected yet, ignoring input');
        return;
      }

      // Add to buffer
      inputBufferRef.current += data;

      // Clear existing flush timeout
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }

      // Flush immediately on Enter, otherwise batch
      if (data === '\r' || data === '\n') {
        flushInput();
      } else {
        // Batch other keystrokes - flush after 16ms (~60fps)
        flushTimeoutRef.current = setTimeout(flushInput, 16);
      }
    });

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();

      // Send resize to PTY
      if (isConnected && xterm.cols && xterm.rows) {
        fetch(`/api/workspace/${projectId}/terminal/pty-stream`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cols: xterm.cols, rows: xterm.rows }),
        }).catch(console.error);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);

      // Clear flush timeout
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }

      // Flush any remaining input
      flushInput();

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      xterm.dispose();
    };
  }, [projectId, isConnected, connectToPtyStream]);

  return (
    <div className="relative h-full w-full bg-[#1e1e1e]">
      {/* Connection status indicator */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-2 rounded-md bg-black/50 px-2 py-1 text-xs">
        <div
          className={`h-2 w-2 rounded-full ${
            isConnected ? 'bg-green-500' : isInitializing ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
          }`}
        />
        <span className="text-gray-300">
          {isConnected ? `PTY ${ptyPid}` : isInitializing ? 'Connecting...' : 'Disconnected'}
        </span>
      </div>

      {/* Terminal container */}
      <div ref={terminalRef} className="h-full w-full p-2" />
    </div>
  );
}
