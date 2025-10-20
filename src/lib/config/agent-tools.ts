/**
 * Agent Tools Configuration
 * Available tools that can be assigned to custom agents
 */

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  category?: 'sandbox' | 'web' | 'data' | 'other';
}

export const AVAILABLE_TOOLS: AgentTool[] = [
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Execute shell commands in sandbox',
    category: 'sandbox',
  },
  {
    id: 'files',
    name: 'File Operations',
    description: 'Read and write files',
    category: 'sandbox',
  },
  {
    id: 'code',
    name: 'Code Execution',
    description: 'Run Python/JavaScript code',
    category: 'sandbox',
  },
  {
    id: 'web',
    name: 'Web Search',
    description: 'Search the internet',
    category: 'web',
  },
];

/**
 * Get tool by ID
 */
export function getTool(id: string): AgentTool | undefined {
  return AVAILABLE_TOOLS.find(t => t.id === id);
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: string): AgentTool[] {
  return AVAILABLE_TOOLS.filter(t => t.category === category);
}
