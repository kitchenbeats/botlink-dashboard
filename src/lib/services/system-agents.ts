import fs from 'fs';
import path from 'path';
import { getDefaultAnthropicModel } from '@/lib/config/env';

export interface SystemAgent {
  id: string;
  name: string;
  type: 'planner' | 'orchestrator' | 'generic' | 'logic_checker';
  model: string;
  system_prompt: string;
  user_prompt_template: string;
  config: {
    temperature: number;
    max_tokens: number;
  };
}

const AGENTS_CONFIG_DIR = path.join(process.cwd(), 'src', 'configs', 'agents');

export function getSystemAgents(): SystemAgent[] {
  const files = fs.readdirSync(AGENTS_CONFIG_DIR);
  const agents: SystemAgent[] = [];
  const defaultModel = getDefaultAnthropicModel();

  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(AGENTS_CONFIG_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const agent = JSON.parse(content) as SystemAgent;

      // Override model with default if not explicitly set or if using placeholder
      if (!agent.model || agent.model === 'claude-3-5-sonnet-20241022') {
        agent.model = defaultModel;
      }

      agents.push(agent);
    }
  }

  return agents;
}

export function getSystemAgentById(id: string): SystemAgent | null {
  const agents = getSystemAgents();
  return agents.find(agent => agent.id === id) || null;
}
