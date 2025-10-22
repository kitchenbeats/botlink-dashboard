#!/usr/bin/env node

/**
 * Claude PTY Manager
 *
 * Runs inside E2B sandbox, managed by PM2
 * Handles Claude Code PTY I/O via Redis pub/sub
 */

const { spawn } = require('child_process');
const Redis = require('ioredis');

// Get config from environment
const PROJECT_ID = process.env.PROJECT_ID;
const REDIS_URL = process.env.REDIS_URL;
const WORK_DIR = process.env.WORK_DIR || process.cwd();

if (!PROJECT_ID || !REDIS_URL) {
  console.error('[PTY Manager] Missing required env vars: PROJECT_ID, REDIS_URL');
  process.exit(1);
}

console.log('[PTY Manager] Starting for project:', PROJECT_ID);
console.log('[PTY Manager] Working directory:', WORK_DIR);
console.log('[PTY Manager] Redis URL:', REDIS_URL.replace(/:[^:]*@/, ':****@'));

// Connect to Redis
const redis = new Redis(REDIS_URL);
const redisSub = new Redis(REDIS_URL);

redis.on('error', (err) => {
  console.error('[PTY Manager] Redis error:', err);
});

redis.on('connect', () => {
  console.log('[PTY Manager] Connected to Redis');
});

// Start Claude Code PTY
let claudePty = null;

function startClaudePty() {
  console.log('[PTY Manager] Starting Claude Code PTY with structured output...');

  // Build Claude CLI arguments for structured JSON output
  const claudeArgs = [
    '--output-format', 'stream-json',  // Get structured JSON instead of raw text
    '--verbose',                        // Include all events (thinking, tool use, etc.)
    '--model', 'sonnet',               // Default to Sonnet model
  ];

  // Optional: Allow tool configuration via environment variables
  // This enables dynamic tool permissions per project
  if (process.env.ALLOWED_TOOLS) {
    const allowedTools = process.env.ALLOWED_TOOLS.split(',');
    allowedTools.forEach(tool => {
      claudeArgs.push('--allowedTools', tool.trim());
    });
    console.log('[PTY Manager] Allowed tools:', allowedTools);
  }

  if (process.env.DISALLOWED_TOOLS) {
    const disallowedTools = process.env.DISALLOWED_TOOLS.split(',');
    disallowedTools.forEach(tool => {
      claudeArgs.push('--disallowedTools', tool.trim());
    });
    console.log('[PTY Manager] Disallowed tools:', disallowedTools);
  }

  claudePty = spawn('claude', claudeArgs, {
    cwd: WORK_DIR,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      FORCE_COLOR: '1',
    },
  });

  console.log('[PTY Manager] Claude PTY started with PID:', claudePty.pid);
  console.log('[PTY Manager] Claude args:', claudeArgs.join(' '));

  // Publish PID to Redis for tracking
  redis.set(`claude-pty:${PROJECT_ID}:pid`, claudePty.pid, 'EX', 3600); // 1 hour expiry

  // Stream stdout to Redis
  claudePty.stdout.on('data', (data) => {
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
  claudePty.stderr.on('data', (data) => {
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

  // Handle process exit
  claudePty.on('exit', (code, signal) => {
    console.log('[PTY Manager] Claude PTY exited. Code:', code, 'Signal:', signal);

    // Publish exit event
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

    // Clean up PID from Redis
    redis.del(`claude-pty:${PROJECT_ID}:pid`);

    // Auto-restart after 2 seconds
    setTimeout(() => {
      console.log('[PTY Manager] Restarting Claude PTY...');
      startClaudePty();
    }, 2000);
  });

  claudePty.on('error', (err) => {
    console.error('[PTY Manager] Claude PTY error:', err);
  });
}

// Listen for input from Redis
redisSub.subscribe(`workspace:${PROJECT_ID}:claude-input`, (err) => {
  if (err) {
    console.error('[PTY Manager] Failed to subscribe:', err);
  } else {
    console.log('[PTY Manager] Subscribed to input channel');
  }
});

redisSub.on('message', (channel, message) => {
  if (!claudePty || claudePty.exitCode !== null) {
    console.warn('[PTY Manager] Received input but PTY is not running');
    return;
  }

  try {
    const { data } = JSON.parse(message);
    claudePty.stdin.write(data);
  } catch (err) {
    console.error('[PTY Manager] Failed to parse input message:', err);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[PTY Manager] Received SIGTERM, shutting down...');
  if (claudePty) {
    claudePty.kill();
  }
  redis.quit();
  redisSub.quit();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[PTY Manager] Received SIGINT, shutting down...');
  if (claudePty) {
    claudePty.kill();
  }
  redis.quit();
  redisSub.quit();
  process.exit(0);
});

// Start Claude PTY
startClaudePty();

console.log('[PTY Manager] Ready and listening for input');
