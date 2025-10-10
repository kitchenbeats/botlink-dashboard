// ============================================================================
// ANTHROPIC ADAPTER - Convert tools to Anthropic format
// ============================================================================

import type { Anthropic } from '@anthropic-ai/sdk';
import type { ToolDefinition } from '../types';

/**
 * Convert our universal tool definition to Anthropic's format
 */
export function toAnthropicTool(tool: ToolDefinition): Anthropic.Tool {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object',
      properties: tool.parameters.properties,
      required: tool.parameters.required || [],
    },
  };
}

/**
 * Convert multiple tools to Anthropic format
 */
export function toAnthropicTools(tools: ToolDefinition[]): Anthropic.Tool[] {
  return tools.map(toAnthropicTool);
}
