#!/usr/bin/env node

/**
 * Claude Agentic Chat Script
 *
 * Full agentic coding system with:
 * - Tool execution (bash, file ops, search)
 * - Conversation memory with summarization
 * - Change tracking and project state
 * - Structured JSON output for UI parsing
 *
 * Usage: PROJECT_ID=xxx REDIS_URL=xxx node claude-chat.js "Your message here"
 */

const Anthropic = require('@anthropic-ai/sdk');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get environment variables
const PROJECT_ID = process.env.PROJECT_ID;
const REDIS_URL = process.env.REDIS_URL;
const WORK_DIR = process.env.WORK_DIR || process.cwd();

if (!PROJECT_ID || !REDIS_URL) {
  console.error('Error: Missing required env vars: PROJECT_ID, REDIS_URL');
  process.exit(1);
}

// Get message from command line
const userMessage = process.argv[2];
if (!userMessage) {
  console.error('Error: No message provided');
  process.exit(1);
}

// Read auth token from .claude/.token
const tokenPath = path.join(WORK_DIR, '.claude', '.token');
let authToken;

try {
  authToken = fs.readFileSync(tokenPath, 'utf8').trim();
} catch (error) {
  console.error('Error: Could not read auth token from', tokenPath);
  process.exit(1);
}

// Create Anthropic client
const anthropic = new Anthropic({
  apiKey: authToken,
});

// Connect to Redis
const redis = new Redis(REDIS_URL);
const HISTORY_KEY = `claude:history:${PROJECT_ID}`;
const CHANGES_KEY = `claude:changes:${PROJECT_ID}`;
const STATE_KEY = `claude:state:${PROJECT_ID}`;
const TTL = 86400; // 24 hours

// Configuration
const MAX_MESSAGES_BEFORE_SUMMARY = 20;
const MAX_TOOL_ITERATIONS = 25;

/**
 * Tool Definitions
 */
const TOOLS = [
  {
    name: 'bash',
    description: 'Execute a bash command in the project directory. Use this to run builds, tests, install packages, etc. Returns stdout, stderr, and exit code.',
    input_schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The bash command to execute (e.g., "npm install", "ls -la", "git status")'
        },
        reason: {
          type: 'string',
          description: 'Why you are running this command (for change tracking)'
        }
      },
      required: ['command', 'reason']
    }
  },
  {
    name: 'read_file',
    description: 'Read the complete contents of a file. Use this to examine code, config files, or any text file.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file relative to project root (e.g., "src/App.tsx", "package.json")'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Create a new file or completely overwrite an existing file. Use this for new files or complete rewrites.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file relative to project root'
        },
        content: {
          type: 'string',
          description: 'Complete file contents to write'
        },
        reason: {
          type: 'string',
          description: 'Why you are creating/modifying this file (for change tracking)'
        }
      },
      required: ['path', 'content', 'reason']
    }
  },
  {
    name: 'edit_file',
    description: 'Edit an existing file by searching for exact text and replacing it. Useful for targeted modifications without rewriting entire file.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file relative to project root'
        },
        search: {
          type: 'string',
          description: 'Exact text to search for (must match exactly including whitespace)'
        },
        replace: {
          type: 'string',
          description: 'Text to replace the search text with'
        },
        reason: {
          type: 'string',
          description: 'Why you are making this edit (for change tracking)'
        }
      },
      required: ['path', 'search', 'replace', 'reason']
    }
  },
  {
    name: 'list_files',
    description: 'List files in a directory. Use this to explore project structure.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory path relative to project root (default: ".")'
        },
        recursive: {
          type: 'boolean',
          description: 'Whether to list files recursively (default: false)'
        }
      },
      required: []
    }
  },
  {
    name: 'search_files',
    description: 'Search for text patterns across files using grep. Useful for finding where code is used.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Text or regex pattern to search for'
        },
        path: {
          type: 'string',
          description: 'Directory or file to search in (default: ".")'
        },
        file_pattern: {
          type: 'string',
          description: 'Optional glob pattern for files to search (e.g., "*.ts")'
        }
      },
      required: ['pattern']
    }
  }
];

/**
 * Tool Executors
 */
async function executeTool(toolName, toolInput, changes) {
  try {
    switch (toolName) {
      case 'bash':
        return await executeBash(toolInput, changes);

      case 'read_file':
        return await executeReadFile(toolInput);

      case 'write_file':
        return await executeWriteFile(toolInput, changes);

      case 'edit_file':
        return await executeEditFile(toolInput, changes);

      case 'list_files':
        return await executeListFiles(toolInput);

      case 'search_files':
        return await executeSearchFiles(toolInput);

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    return { error: error.message, stack: error.stack };
  }
}

async function executeBash(input, changes) {
  const { command, reason } = input;

  try {
    const result = execSync(command, {
      cwd: WORK_DIR,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024, // 10MB
      timeout: 60000, // 60 seconds
    });

    // Track change
    changes.push({
      timestamp: Date.now(),
      type: 'bash',
      command,
      reason,
      success: true
    });

    return {
      stdout: result,
      stderr: '',
      exit_code: 0
    };
  } catch (error) {
    // Track failed command too
    changes.push({
      timestamp: Date.now(),
      type: 'bash',
      command,
      reason,
      success: false,
      error: error.message
    });

    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
      exit_code: error.status || 1
    };
  }
}

async function executeReadFile(input) {
  const { path: filePath } = input;
  const fullPath = path.join(WORK_DIR, filePath);

  // Security: prevent path traversal
  if (!fullPath.startsWith(WORK_DIR)) {
    return { error: 'Access denied: path outside project directory' };
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').length;

    return {
      content,
      size: content.length,
      lines,
      path: filePath
    };
  } catch (error) {
    return { error: `Failed to read file: ${error.message}` };
  }
}

async function executeWriteFile(input, changes) {
  const { path: filePath, content, reason } = input;
  const fullPath = path.join(WORK_DIR, filePath);

  // Security: prevent path traversal
  if (!fullPath.startsWith(WORK_DIR)) {
    return { error: 'Access denied: path outside project directory' };
  }

  try {
    const fileExisted = fs.existsSync(fullPath);

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content, 'utf8');

    // Track change
    changes.push({
      timestamp: Date.now(),
      type: fileExisted ? 'file_modified' : 'file_created',
      file: filePath,
      reason,
      lines: content.split('\n').length,
      size: content.length
    });

    return {
      success: true,
      action: fileExisted ? 'modified' : 'created',
      path: filePath,
      size: content.length
    };
  } catch (error) {
    return { error: `Failed to write file: ${error.message}` };
  }
}

async function executeEditFile(input, changes) {
  const { path: filePath, search, replace, reason } = input;
  const fullPath = path.join(WORK_DIR, filePath);

  // Security: prevent path traversal
  if (!fullPath.startsWith(WORK_DIR)) {
    return { error: 'Access denied: path outside project directory' };
  }

  try {
    if (!fs.existsSync(fullPath)) {
      return { error: 'File does not exist' };
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    // Check if search text exists
    if (!content.includes(search)) {
      return {
        error: 'Search text not found in file',
        suggestion: 'Use read_file first to see current contents'
      };
    }

    // Count occurrences
    const occurrences = (content.match(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

    if (occurrences > 1) {
      return {
        error: `Search text appears ${occurrences} times in file. Please make search text more specific.`,
        occurrences
      };
    }

    const newContent = content.replace(search, replace);
    fs.writeFileSync(fullPath, newContent, 'utf8');

    // Track change
    changes.push({
      timestamp: Date.now(),
      type: 'file_edited',
      file: filePath,
      reason,
      search: search.substring(0, 100) + (search.length > 100 ? '...' : ''),
      replace: replace.substring(0, 100) + (replace.length > 100 ? '...' : '')
    });

    return {
      success: true,
      path: filePath,
      occurrences: 1
    };
  } catch (error) {
    return { error: `Failed to edit file: ${error.message}` };
  }
}

async function executeListFiles(input) {
  const { path: dirPath = '.', recursive = false } = input;
  const fullPath = path.join(WORK_DIR, dirPath);

  // Security: prevent path traversal
  if (!fullPath.startsWith(WORK_DIR)) {
    return { error: 'Access denied: path outside project directory' };
  }

  try {
    if (!fs.existsSync(fullPath)) {
      return { error: 'Directory does not exist' };
    }

    if (!fs.statSync(fullPath).isDirectory()) {
      return { error: 'Path is not a directory' };
    }

    let files = [];

    function scanDir(dir, prefix = '') {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip node_modules, .git, etc.
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }

        const relativePath = path.join(prefix, entry.name);

        if (entry.isDirectory()) {
          files.push({ name: relativePath, type: 'directory' });
          if (recursive) {
            scanDir(path.join(dir, entry.name), relativePath);
          }
        } else {
          const stat = fs.statSync(path.join(dir, entry.name));
          files.push({
            name: relativePath,
            type: 'file',
            size: stat.size
          });
        }
      }
    }

    scanDir(fullPath);

    return {
      path: dirPath,
      files,
      count: files.length
    };
  } catch (error) {
    return { error: `Failed to list files: ${error.message}` };
  }
}

async function executeSearchFiles(input) {
  const { pattern, path: searchPath = '.', file_pattern } = input;

  try {
    let command = `grep -rn "${pattern}" ${searchPath}`;

    if (file_pattern) {
      command += ` --include="${file_pattern}"`;
    }

    // Exclude common directories
    command += ' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist';

    const result = execSync(command, {
      cwd: WORK_DIR,
      encoding: 'utf8',
      maxBuffer: 5 * 1024 * 1024,
    });

    const matches = result.trim().split('\n').filter(Boolean).map(line => {
      const [filePath, lineNum, ...contentParts] = line.split(':');
      return {
        file: filePath,
        line: parseInt(lineNum),
        content: contentParts.join(':').trim()
      };
    });

    return {
      pattern,
      matches,
      count: matches.length
    };
  } catch (error) {
    // grep returns exit code 1 if no matches found
    if (error.status === 1) {
      return {
        pattern,
        matches: [],
        count: 0
      };
    }

    return { error: `Search failed: ${error.message}` };
  }
}

/**
 * Memory Management
 */
async function loadMemory() {
  try {
    // Load conversation history
    const historyJson = await redis.get(HISTORY_KEY);
    const messages = historyJson ? JSON.parse(historyJson) : [];

    // Load change ledger
    const changesJson = await redis.get(CHANGES_KEY);
    const changes = changesJson ? JSON.parse(changesJson) : [];

    // Load project state
    const stateJson = await redis.get(STATE_KEY);
    const state = stateJson ? JSON.parse(stateJson) : { files: {}, decisions: [] };

    return { messages, changes, state };
  } catch (error) {
    console.error('Warning: Failed to load memory:', error.message);
    return { messages: [], changes: [], state: { files: {}, decisions: [] } };
  }
}

async function saveMemory(messages, changes, state) {
  try {
    await redis.setex(HISTORY_KEY, TTL, JSON.stringify(messages));
    await redis.setex(CHANGES_KEY, TTL, JSON.stringify(changes));
    await redis.setex(STATE_KEY, TTL, JSON.stringify(state));
  } catch (error) {
    console.error('Warning: Failed to save memory:', error.message);
  }
}

async function summarizeIfNeeded(messages) {
  // If we have more than MAX_MESSAGES_BEFORE_SUMMARY, summarize older ones
  if (messages.length <= MAX_MESSAGES_BEFORE_SUMMARY) {
    return messages;
  }

  console.error('[Memory] Summarizing old messages...');

  // Keep last 10 messages in full, summarize the rest
  const recentMessages = messages.slice(-10);
  const oldMessages = messages.slice(0, -10);

  try {
    // Ask Claude to summarize old conversation
    const summaryResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Summarize this conversation history concisely. Focus on: what was built, key decisions made, current state of the project.\n\nConversation:\n${JSON.stringify(oldMessages, null, 2)}`
        }
      ]
    });

    const summary = summaryResponse.content[0].text;

    // Replace old messages with summary
    return [
      {
        role: 'user',
        content: `[Previous conversation summary]\n\n${summary}`
      },
      {
        role: 'assistant',
        content: 'Understood. I have the context from our previous conversation.'
      },
      ...recentMessages
    ];
  } catch (error) {
    console.error('[Memory] Summarization failed:', error.message);
    // Fall back to just keeping recent messages
    return recentMessages;
  }
}

/**
 * Output structured JSON for UI parsing
 */
function outputJSON(type, data) {
  console.log(JSON.stringify({ type, ...data }));
}

/**
 * Main agentic loop
 */
async function chat() {
  const startTime = Date.now();

  try {
    // Load memory
    const { messages, changes, state } = await loadMemory();

    // Build context with change summary
    let contextMessage = '';
    if (changes.length > 0) {
      contextMessage += '\n\n<recent_changes>\n';
      contextMessage += 'Files you have modified:\n';
      const recentChanges = changes.slice(-20);
      recentChanges.forEach(change => {
        if (change.type === 'file_created' || change.type === 'file_modified' || change.type === 'file_edited') {
          contextMessage += `- ${change.file}: ${change.reason}\n`;
        }
      });
      contextMessage += '</recent_changes>';
    }

    // Add user message
    messages.push({
      role: 'user',
      content: userMessage + contextMessage
    });

    // Summarize if needed
    const workingMessages = await summarizeIfNeeded(messages);

    // Agentic loop
    let iterations = 0;
    let currentMessages = [...workingMessages];
    const sessionChanges = [];

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      // Call Claude with tools
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 8000,
        messages: currentMessages,
        tools: TOOLS,
      });

      // Check stop reason
      if (response.stop_reason === 'end_turn') {
        // Final response - extract text
        const textBlocks = response.content.filter(block => block.type === 'text');
        const finalText = textBlocks.map(block => block.text).join('\n');

        // Add assistant response to history
        messages.push({
          role: 'assistant',
          content: finalText
        });

        // Output final response
        outputJSON('text', { text: finalText });
        outputJSON('done', { iterations, changes: sessionChanges.length });

        break;
      }

      if (response.stop_reason === 'tool_use') {
        // Extract all tool uses and text from response
        const toolUses = response.content.filter(block => block.type === 'tool_use');
        const textBlocks = response.content.filter(block => block.type === 'text');

        // Output thinking/text if present
        if (textBlocks.length > 0) {
          const thinkingText = textBlocks.map(block => block.text).join('\n');
          outputJSON('thinking', { text: thinkingText });
        }

        // Execute all tools
        const toolResults = [];

        for (const toolUse of toolUses) {
          // Output tool use
          outputJSON('tool_use', {
            name: toolUse.name,
            input: toolUse.input
          });

          // Execute tool
          const result = await executeTool(toolUse.name, toolUse.input, sessionChanges);

          // Output tool result
          outputJSON('tool_result', {
            tool_use_id: toolUse.id,
            name: toolUse.name,
            result
          });

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result)
          });
        }

        // Add assistant message with tool uses
        currentMessages.push({
          role: 'assistant',
          content: response.content
        });

        // Add tool results
        currentMessages.push({
          role: 'user',
          content: toolResults
        });

        // Continue loop
        continue;
      }

      // Unexpected stop reason
      console.error('[Agent] Unexpected stop reason:', response.stop_reason);
      break;
    }

    if (iterations >= MAX_TOOL_ITERATIONS) {
      outputJSON('error', { error: 'Max iterations reached' });
    }

    // Update changes ledger
    changes.push(...sessionChanges);

    // Save memory
    await saveMemory(messages, changes, state);

    // Close Redis
    await redis.quit();

    const duration = Date.now() - startTime;
    console.error(`[Agent] Completed in ${duration}ms, ${iterations} iterations, ${sessionChanges.length} changes`);

  } catch (error) {
    console.error('[Agent] Error:', error);
    outputJSON('error', { error: error.message });
    await redis.quit();
    process.exit(1);
  }
}

chat();
