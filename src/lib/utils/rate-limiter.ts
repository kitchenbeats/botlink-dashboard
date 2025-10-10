import PQueue from 'p-queue';

/**
 * Rate limiter for Anthropic API calls
 * Prevents hitting API rate limits by queuing requests
 *
 * Current limits (adjust based on your Anthropic plan):
 * - 5 concurrent requests max
 * - 50 requests per minute
 */
const anthropicQueue = new PQueue({
  concurrency: 5, // Max 5 concurrent requests
  interval: 60000, // Per 60 seconds (1 minute)
  intervalCap: 50, // Max 50 requests per interval
});

/**
 * Wrap an async function with rate limiting
 * @param fn - The async function to rate limit
 * @returns Promise with the function result
 */
export async function withRateLimit<T>(
  fn: () => Promise<T>
): Promise<T> {
  return anthropicQueue.add(fn) as Promise<T>;
}

/**
 * Get current queue stats for monitoring
 */
export function getQueueStats() {
  return {
    size: anthropicQueue.size,
    pending: anthropicQueue.pending,
    isPaused: anthropicQueue.isPaused,
  };
}
