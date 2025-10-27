/**
 * Generate meaningful conversation titles from user prompts
 * WITHOUT using AI (to save costs)
 */

/**
 * Generate a conversation title from a user prompt
 * Uses simple heuristics to extract meaningful words
 */
export function generateConversationTitle(prompt: string): string {
  // Clean the prompt
  const cleaned = prompt.trim();

  // If empty, return default
  if (!cleaned) {
    return 'New Conversation';
  }

  // Common action verbs that make good titles
  const actionVerbs = [
    'fix', 'create', 'add', 'update', 'delete', 'remove', 'refactor',
    'implement', 'build', 'make', 'change', 'modify', 'improve',
    'optimize', 'debug', 'test', 'setup', 'configure', 'install'
  ];

  // Check if prompt starts with an action verb
  const words = cleaned.toLowerCase().split(/\s+/);
  const firstWord = words[0];

  if (firstWord && actionVerbs.includes(firstWord)) {
    // Use first 50 chars starting from the action verb
    const title = cleaned.substring(0, 50).trim();
    return capitalize(title);
  }

  // Check if prompt contains common patterns
  if (cleaned.toLowerCase().includes('how to')) {
    const title = cleaned.substring(0, 50).trim();
    return capitalize(title);
  }

  if (cleaned.toLowerCase().includes('help')) {
    const title = cleaned.substring(0, 50).trim();
    return capitalize(title);
  }

  // Default: Take first 50 chars, capitalize first letter
  let title = cleaned.substring(0, 50).trim();

  // If truncated, end with "..."
  if (cleaned.length > 50) {
    // Try to end at a word boundary
    const lastSpace = title.lastIndexOf(' ');
    if (lastSpace > 30) {
      title = title.substring(0, lastSpace) + '...';
    } else {
      title = title + '...';
    }
  }

  return capitalize(title);
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
