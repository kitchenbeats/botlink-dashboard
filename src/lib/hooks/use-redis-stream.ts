import { useEffect, useState, useCallback, useRef } from 'react';

interface StreamMessage {
  type: 'message' | 'connected' | 'error';
  topic?: string;
  data?: unknown;
  timestamp?: number;
  channel?: string;
  topics?: string[];
  error?: string;
}

interface UseRedisStreamOptions {
  projectId: string;
  enabled?: boolean;
}

interface UseRedisStreamResult {
  messages: StreamMessage[];
  latestMessage: StreamMessage | null;
  isConnected: boolean;
  error: string | null;
}

/**
 * Custom hook for Redis SSE streaming
 * Replaces Inngest realtime with our Redis pub/sub solution
 */
export function useRedisStream({
  projectId,
  enabled = true,
}: UseRedisStreamOptions): UseRedisStreamResult {
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [latestMessage, setLatestMessage] = useState<StreamMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const tokenRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isReconnectingRef = useRef(false);

  const connect = useCallback(async () => {
    if (!enabled || !projectId) return;

    // Prevent multiple simultaneous connection attempts
    if (isReconnectingRef.current) {
      console.log('[Redis Stream] Already reconnecting, skipping...');
      return;
    }

    isReconnectingRef.current = true;

    try {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Fetch subscription token
      const response = await fetch('/api/workspace/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error('Failed to get subscription token');
      }

      const data = await response.json();
      const token = data.token || data; // Handle both {token: "..."} and direct token response
      tokenRef.current = token;

      // Connect to SSE stream
      const streamUrl = `/api/workspace/stream?token=${encodeURIComponent(token)}`;
      const eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        console.log('[Redis Stream] Connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on success
        isReconnectingRef.current = false;
      };

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as StreamMessage;

          setMessages((prev) => [...prev, message]);
          setLatestMessage(message);

          if (message.type === 'connected') {
            console.log('[Redis Stream] Subscribed to:', message.channel, message.topics);
          }
        } catch (err) {
          console.error('[Redis Stream] Failed to parse message:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('[Redis Stream] Connection error:', err);
        setIsConnected(false);
        setError('Connection lost');
        eventSource.close();
        isReconnectingRef.current = false;

        // Exponential backoff: 3s, 6s, 12s, max 30s
        const delay = Math.min(3000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;

        console.log(`[Redis Stream] Reconnecting in ${delay / 1000}s (attempt ${reconnectAttemptsRef.current})...`);

        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        // Attempt reconnect with exponential backoff
        reconnectTimeoutRef.current = setTimeout(() => {
          if (enabled) {
            console.log('[Redis Stream] Attempting reconnect...');
            connect();
          }
        }, delay);
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error('[Redis Stream] Failed to connect:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      isReconnectingRef.current = false;

      // Retry with backoff on connection failure
      const delay = Math.min(3000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current++;

      reconnectTimeoutRef.current = setTimeout(() => {
        if (enabled) {
          connect();
        }
      }, delay);
    }
  }, [projectId, enabled]);

  // Connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);

  return {
    messages,
    latestMessage,
    isConnected,
    error,
  };
}
