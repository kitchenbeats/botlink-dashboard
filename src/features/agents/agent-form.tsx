'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAgentAction, updateAgentAction } from '@/actions';
import type { Agent, AgentType } from '@/lib/types';
import { ModelSelector } from './model-selector';

interface AgentFormProps {
  agent?: Agent;
  mode: 'create' | 'edit';
}

const AGENT_TYPES: { value: AgentType; label: string; description: string }[] = [
  { value: 'planner', label: 'Task Planner', description: 'Breaks down requests into tasks' },
  { value: 'orchestrator', label: 'Orchestrator', description: 'Creates specialized agents' },
  { value: 'logic_checker', label: 'Logic Checker', description: 'Validates task completion' },
  { value: 'generic', label: 'Generic Agent', description: 'Custom configurable agent' },
];

export function AgentForm({ agent, mode }: AgentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: agent?.name || '',
    type: agent?.type || 'generic' as AgentType,
    model: agent?.model || 'claude-sonnet-4-5-20250929',
    system_prompt: agent?.system_prompt || '',
    temperature: agent?.config?.temperature?.toString() || '0.7',
    max_tokens: agent?.config?.max_tokens?.toString() || '4096',
  });

  function validateTemperature(value: string): number {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error('Temperature must be a valid number');
    }
    if (num < 0 || num > 2) {
      throw new Error('Temperature must be between 0 and 2');
    }
    return num;
  }

  function validateMaxTokens(value: string): number {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error('Max tokens must be a valid number');
    }
    if (num < 1 || num > 200000) {
      throw new Error('Max tokens must be between 1 and 200,000');
    }
    return num;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = {
        name: formData.name,
        type: formData.type,
        model: formData.model,
        system_prompt: formData.system_prompt,
        config: {
          temperature: validateTemperature(formData.temperature),
          max_tokens: validateMaxTokens(formData.max_tokens),
        },
      };

      const result = mode === 'create'
        ? await createAgentAction(data)
        : await updateAgentAction(agent!.id, data);

      if (result.success) {
        router.push('/agents');
        router.refresh();
      } else {
        setError(result.error || `Failed to ${mode} agent`);
        setIsLoading(false);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Validation failed');
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium mb-2">
          Type
        </label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as AgentType })}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          required
          disabled={isLoading || mode === 'edit'}
        >
          {AGENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label} - {type.description}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="model" className="block text-sm font-medium mb-2">
          Model
        </label>
        <ModelSelector
          value={formData.model}
          onChange={(model) => setFormData({ ...formData, model })}
          disabled={isLoading}
          showProvider={true}
        />
        <p className="text-xs text-gray-500 mt-1">
          Select the AI model for this agent. Flagship models offer best performance, fast models are more economical.
        </p>
      </div>

      <div>
        <label htmlFor="system_prompt" className="block text-sm font-medium mb-2">
          System Prompt
        </label>
        <textarea
          id="system_prompt"
          value={formData.system_prompt}
          onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
          className="w-full min-h-[200px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
          required
          disabled={isLoading}
        />
      </div>


      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="temperature" className="block text-sm font-medium mb-2">
            Temperature
          </label>
          <input
            id="temperature"
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={formData.temperature}
            onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="max_tokens" className="block text-sm font-medium mb-2">
            Max Tokens
          </label>
          <input
            id="max_tokens"
            type="number"
            step="1"
            min="1"
            value={formData.max_tokens}
            onChange={(e) => setFormData({ ...formData, max_tokens: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isLoading}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          {isLoading ? `${mode === 'create' ? 'Creating' : 'Updating'}...` : `${mode === 'create' ? 'Create' : 'Update'} Agent`}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
