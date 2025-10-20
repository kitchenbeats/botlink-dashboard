import 'server-only';
import { createClient } from 'redis';

// Create Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL,
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    await redisClient.connect();
  }

  return redisClient;
}

// Create a wrapper that matches the @vercel/kv API
export const kv = {
  async get<T = string>(key: string): Promise<T | null> {
    const client = await getRedisClient();
    const value = await client.get(key);

    if (value === null) return null;

    // Try to parse as JSON, fall back to string
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },

  async set(
    key: string,
    value: unknown,
    options?: { ex?: number; px?: number; exat?: number; pxat?: number }
  ): Promise<string | null> {
    const client = await getRedisClient();
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    if (options?.ex) {
      return await client.set(key, serialized, { EX: options.ex });
    } else if (options?.px) {
      return await client.set(key, serialized, { PX: options.px });
    } else if (options?.exat) {
      return await client.set(key, serialized, { EXAT: options.exat });
    } else if (options?.pxat) {
      return await client.set(key, serialized, { PXAT: options.pxat });
    } else {
      return await client.set(key, serialized);
    }
  },

  async del(...keys: string[]): Promise<number> {
    const client = await getRedisClient();
    return await client.del(keys);
  },

  async exists(...keys: string[]): Promise<number> {
    const client = await getRedisClient();
    return await client.exists(keys);
  },

  async expire(key: string, seconds: number): Promise<number> {
    const client = await getRedisClient();
    return await client.expire(key, seconds) ? 1 : 0;
  },

  // Atomic SET if Not eXists with expiration (for distributed locks)
  async setNX(key: string, value: unknown, expirySeconds: number): Promise<boolean> {
    const client = await getRedisClient();
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const result = await client.set(key, serialized, { NX: true, EX: expirySeconds });
    return result === 'OK';
  },

  // Pub/Sub methods
  async publish(channel: string, message: string): Promise<number> {
    const client = await getRedisClient();
    return await client.publish(channel, message);
  },
};
