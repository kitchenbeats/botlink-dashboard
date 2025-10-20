/**
 * Redis-based realtime pub/sub service
 * Replaces Inngest realtime subscriptions with Redis pub/sub
 *
 * Structure mimics Inngest:
 * - Channel: workspace:project123
 * - Topics: messages, status, file-changes, terminal
 * - Redis channels: workspace:project123:messages, workspace:project123:status, etc.
 */

import { createClient } from 'redis';

export interface RealtimeMessage {
  channel: string;
  topic: string;
  data: unknown;
  timestamp: number;
}

/**
 * Get Redis client for pub/sub
 * Uses native Redis pub/sub with streaming
 */
function getRedisClient() {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  client.on('error', (err) => console.error('[Redis] Client error:', err));

  return client;
}

/**
 * Generate a subscription token for a channel
 * This mimics Inngest's token structure
 */
export async function generateSubscriptionToken(
  channel: string,
  topics: string[]
): Promise<{ token: string; channel: string; topics: string[] }> {
  // Create a simple token
  const tokenData = {
    channel,
    topics,
    exp: Date.now() + 3600000, // 1 hour expiry
  };

  const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');

  return { token, channel, topics };
}

/**
 * Publish a message to a channel/topic
 * Uses native Redis pub/sub
 */
export async function publishMessage(
  channel: string,
  topic: string,
  data: unknown
): Promise<void> {
  const redis = getRedisClient();

  try {
    await redis.connect();

    const message: RealtimeMessage = {
      channel,
      topic,
      data,
      timestamp: Date.now(),
    };

    // Publish to Redis channel with pattern: workspace:project123:messages
    const redisChannel = `${channel}:${topic}`;
    await redis.publish(redisChannel, JSON.stringify(message));

    console.log(`[Redis Realtime] Published to ${redisChannel}`, { topic, channel });
  } finally {
    await redis.quit();
  }
}

/**
 * Subscribe to messages (used by SSE endpoint)
 * Returns subscriber client with message handler setup
 */
export async function subscribeToMessages(
  channel: string,
  topics: string[],
  onMessage: (message: RealtimeMessage) => void
): Promise<ReturnType<typeof getRedisClient>> {
  const subscriber = getRedisClient();
  await subscriber.connect();

  // Subscribe to all topics for this channel with message handler
  const redisChannels = topics.map((topic) => `${channel}:${topic}`);

  await subscriber.pSubscribe(redisChannels, (message, channelPattern) => {
    try {
      const parsed = JSON.parse(message) as RealtimeMessage;
      onMessage(parsed);
    } catch (e) {
      console.error('[Redis Realtime] Failed to parse message:', e);
    }
  });

  console.log(`[Redis Realtime] Subscribed to channels:`, redisChannels);

  return subscriber;
}

/**
 * Helper to create workspace channel name
 */
export function workspaceChannel(projectId: string): string {
  return `workspace:${projectId}`;
}

/**
 * Publish workspace message
 */
export async function publishWorkspaceMessage(
  projectId: string,
  topic: 'messages' | 'status' | 'file-changes' | 'terminal' | 'claude-output' | 'claude-login' | 'file-change' | 'claude-crash',
  data: unknown
): Promise<void> {
  await publishMessage(workspaceChannel(projectId), topic, data);
}

/**
 * Store Claude PTY PID in Redis (with TTL)
 */
export async function setClaudePtyPid(projectId: string, pid: number): Promise<void> {
  const redis = getRedisClient();
  try {
    await redis.connect();
    const key = `claude:pty:${projectId}`;
    // Store with 4 hour expiry (matches E2B timeout)
    await redis.set(key, pid.toString(), { EX: 4 * 60 * 60 });
    console.log(`[Redis] Stored Claude PTY PID for ${projectId}: ${pid}`);
  } finally {
    await redis.quit();
  }
}

/**
 * Get Claude PTY PID from Redis
 */
export async function getClaudePtyPid(projectId: string): Promise<number | null> {
  const redis = getRedisClient();
  try {
    await redis.connect();
    const key = `claude:pty:${projectId}`;
    const pid = await redis.get(key);
    return pid ? parseInt(pid, 10) : null;
  } finally {
    await redis.quit();
  }
}

/**
 * Delete Claude PTY PID from Redis
 */
export async function deleteClaudePtyPid(projectId: string): Promise<void> {
  const redis = getRedisClient();
  try {
    await redis.connect();
    const key = `claude:pty:${projectId}`;
    await redis.del(key);
    console.log(`[Redis] Deleted Claude PTY PID for ${projectId}`);
  } finally {
    await redis.quit();
  }
}
