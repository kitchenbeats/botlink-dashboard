import { NextRequest } from 'next/server';
import { subscribeToMessages } from '@/lib/services/redis-realtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Server-Sent Events endpoint for workspace realtime updates
 * Streams messages from Redis pub/sub in real-time
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return new Response('Missing token', { status: 401 });
  }

  // Decode token to get channel and topics
  let channel: string;
  let topics: string[];
  try {
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    channel = tokenData.channel;
    topics = tokenData.topics;

    // Check expiry
    if (tokenData.exp < Date.now()) {
      return new Response('Token expired', { status: 401 });
    }
  } catch (e) {
    return new Response('Invalid token', { status: 401 });
  }

  console.log('[SSE] Client connected to channel:', channel, 'topics:', topics);

  // Create SSE stream
  const encoder = new TextEncoder();
  let subscriber: Awaited<ReturnType<typeof subscribeToMessages>> | undefined;
  let heartbeatInterval: NodeJS.Timeout;
  let isCleanedUp = false;

  // Cleanup function to avoid duplicate calls
  const cleanup = async () => {
    if (isCleanedUp) return;
    isCleanedUp = true;

    clearInterval(heartbeatInterval);
    if (subscriber) {
      try {
        await subscriber.quit();
      } catch (error) {
        // Ignore errors if client is already closed
        console.log('[SSE] Subscriber already closed');
      }
    }
    console.log('[SSE] Client disconnected');
  };

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', channel, topics })}\n\n`)
      );

      // Subscribe to Redis channels with message handler
      subscriber = await subscribeToMessages(channel, topics, (message) => {
        try {
          const data = JSON.stringify({
            type: 'message',
            topic: message.topic,
            data: message.data,
            timestamp: message.timestamp,
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          console.error('[SSE] Error encoding message:', error);
        }
      });

      // Start heartbeat interval
      heartbeatInterval = setInterval(() => {
        controller.enqueue(encoder.encode(`: heartbeat\n\n`));
      }, 30000);
    },

    // Cleanup on client disconnect
    async cancel() {
      await cleanup();
    },
  });

  // Handle request abort (page refresh, navigation, etc)
  req.signal.addEventListener('abort', async () => {
    await cleanup();
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
