#!/usr/bin/env node

/**
 * Claude Setup PTY Manager
 *
 * Runs bash shell for claude setup-token
 * After auth, user can start the real Claude PTY
 */

const { spawn } = require('child_process');
const Redis = require('ioredis');

// Get config from environment
const PROJECT_ID = process.env.PROJECT_ID;
const REDIS_URL = process.env.REDIS_URL;
const WORK_DIR = process.env.WORK_DIR || process.cwd();

if (!PROJECT_ID || !REDIS_URL) {
  console.error('[Setup PTY] Missing required env vars: PROJECT_ID, REDIS_URL');
  process.exit(1);
}

console.log('[Setup PTY] Starting bash for Claude setup...');

// Connect to Redis
const redis = new Redis(REDIS_URL);
const redisSub = new Redis(REDIS_URL);

// Start bash shell for setup
const setupPty = spawn('bash', [], {
  cwd: WORK_DIR,
  env: {
    ...process.env,
    TERM: 'xterm-256color',
    FORCE_COLOR: '1',
    PS1: '\\[\\033[01;32m\\]claude-setup\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ ',
  },
});

console.log('[Setup PTY] Bash started with PID:', setupPty.pid);

// Stream stdout to Redis
setupPty.stdout.on('data', (data) => {
  const output = data.toString();
  redis.publish(
    `workspace:${PROJECT_ID}:claude-output`,
    JSON.stringify({
      channel: `workspace:${PROJECT_ID}`,
      topic: 'claude-output',
      data: {
        type: 'stdout',
        data: output,
      },
      timestamp: Date.now(),
    })
  );
});

// Stream stderr to Redis
setupPty.stderr.on('data', (data) => {
  const output = data.toString();
  redis.publish(
    `workspace:${PROJECT_ID}:claude-output`,
    JSON.stringify({
      channel: `workspace:${PROJECT_ID}`,
      topic: 'claude-output',
      data: {
        type: 'stderr',
        data: output,
      },
      timestamp: Date.now(),
    })
  );
});

// Listen for input from Redis
redisSub.subscribe(`workspace:${PROJECT_ID}:claude-input`, (err) => {
  if (err) {
    console.error('[Setup PTY] Redis subscribe error:', err);
    return;
  }
  console.log('[Setup PTY] Subscribed to input channel');
});

redisSub.on('message', (channel, message) => {
  try {
    const { data } = JSON.parse(message);
    if (setupPty && !setupPty.killed) {
      setupPty.stdin.write(data);
    }
  } catch (error) {
    console.error('[Setup PTY] Message parse error:', error);
  }
});

// Handle exit
setupPty.on('exit', (code, signal) => {
  console.log('[Setup PTY] Bash exited with code:', code, 'signal:', signal);
  redis.publish(
    `workspace:${PROJECT_ID}:claude-output`,
    JSON.stringify({
      channel: `workspace:${PROJECT_ID}`,
      topic: 'claude-output',
      data: {
        type: 'exit',
        code,
        signal,
      },
      timestamp: Date.now(),
    })
  );
  process.exit(code || 0);
});

// Cleanup on exit
process.on('SIGTERM', () => {
  console.log('[Setup PTY] Received SIGTERM, cleaning up...');
  if (setupPty && !setupPty.killed) {
    setupPty.kill();
  }
  redis.disconnect();
  redisSub.disconnect();
  process.exit(0);
});
