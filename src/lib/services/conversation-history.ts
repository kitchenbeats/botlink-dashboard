/**
 * Conversation History Manager
 *
 * Manages conversation history with dual storage:
 * - Database: Primary storage via messages table
 * - Sandbox file: Cached markdown for AI agent context (.claude/conversation-history.md)
 */

import type { Sandbox } from 'e2b';
import type { Tables } from '@/types/database.types';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

/**
 * Save conversation history to sandbox file
 */
export async function saveConversationToFile(
  sandbox: Sandbox,
  workDir: string,
  messages: Tables<'messages'>[]
): Promise<void> {
  const conversationPath = `${workDir}/.claude/conversation-history.md`;

  // Convert DB messages to markdown format
  const markdown = `# Conversation History

> Last updated: ${new Date().toISOString()}
> Total messages: ${messages.length}

${messages
  .map((msg) => {
    const timestamp = msg.created_at ? new Date(msg.created_at).toLocaleString() : 'Unknown time';
    return `## ${msg.role.toUpperCase()} - ${timestamp}

${msg.content}
`;
  })
  .join('\n---\n\n')}
`;

  try {
    // Ensure .claude directory exists
    await sandbox.commands.run(`mkdir -p ${workDir}/.claude`);

    // Write conversation file
    await sandbox.files.write(conversationPath, markdown);

    console.log('[Conversation History] Saved to:', conversationPath);
  } catch (error) {
    console.error('[Conversation History] Error saving:', error);
  }
}

/**
 * Load conversation history from sandbox file
 */
export async function loadConversationFromFile(
  sandbox: Sandbox,
  workDir: string
): Promise<string | null> {
  const conversationPath = `${workDir}/.claude/conversation-history.md`;

  try {
    const content = await sandbox.files.read(conversationPath);
    return content;
  } catch (error) {
    console.log('[Conversation History] No existing file');
    return null;
  }
}

/**
 * Convert DB messages to AI SDK format
 */
export function convertMessagesToHistory(
  messages: Tables<'messages'>[]
): ConversationMessage[] {
  return messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    timestamp: msg.created_at || undefined,
  }));
}

/**
 * Get recent conversation context (last N messages)
 */
export function getRecentMessages(
  messages: ConversationMessage[],
  limit = 10
): ConversationMessage[] {
  return messages.slice(-limit);
}

/**
 * Format conversation for AI prompt context
 */
export function formatConversationForPrompt(
  messages: ConversationMessage[]
): string {
  return messages
    .map((msg) => {
      const role = msg.role === 'assistant' ? 'Assistant' : 'User';
      return `${role}: ${msg.content}`;
    })
    .join('\n\n');
}
