'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAgentAction, updateAgentAction } from '@/server/actions/agents';
import { AI_PROVIDERS, getProvider } from '@/lib/config/ai-providers';
import { AVAILABLE_TOOLS } from '@/lib/config/agent-tools';
import type { Agent } from '@/lib/types/database';

interface AgentFormProps {
  agent?: Agent;
  mode: 'create' | 'edit';
}

export function AgentForm({ agent, mode }: AgentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: agent?.name || '',
    provider: (agent?.config?.provider as string | undefined) || 'anthropic',
    model: agent?.model || 'claude-sonnet-4-5-20250929',
    system_prompt: agent?.system_prompt || '',
    temperature: agent?.config?.temperature?.toString() || '0.7',
    max_tokens: agent?.config?.max_tokens?.toString() || '4096',
    tools: (agent?.config?.tools as string[] | undefined) || [],
  });

  const selectedProvider = getProvider(formData.provider);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = {
        name: formData.name,
        type: 'custom', // All user agents are custom type
        model: formData.model,
        system_prompt: formData.system_prompt,
        config: {
          provider: formData.provider,
          temperature: parseFloat(formData.temperature),
          max_tokens: parseInt(formData.max_tokens, 10),
          tools: formData.tools,
        },
      };

      const result = mode === 'create'
        ? await createAgentAction(data)
        : await updateAgentAction(agent!.id, data);

      if (result.success) {
        router.push('/dashboard/agents');
        router.refresh();
      } else {
        setError(result.error || `Failed to ${mode} agent`);
        setIsLoading(false);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      setIsLoading(false);
    }
  }

  function toggleTool(toolId: string) {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter(t => t !== toolId)
        : [...prev.tools, toolId]
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Agent Name
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="My Coding Assistant"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="provider" className="block text-sm font-medium mb-2">
          AI Provider
        </label>
        <select
          id="provider"
          value={formData.provider}
          onChange={(e) => {
            const provider = getProvider(e.target.value);
            setFormData({
              ...formData,
              provider: e.target.value,
              model: provider?.models[0] || ''
            });
          }}
          className="w-full px-3 py-2 border rounded-md"
          required
          disabled={isLoading}
        >
          {AI_PROVIDERS.map((provider) => (
            <option key={provider.value} value={provider.value}>
              {provider.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="model" className="block text-sm font-medium mb-2">
          Model
        </label>
        <select
          id="model"
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          required
          disabled={isLoading}
        >
          {selectedProvider?.models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="system_prompt" className="block text-sm font-medium mb-2">
          System Prompt
        </label>
        <textarea
          id="system_prompt"
          value={formData.system_prompt}
          onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
          className="w-full min-h-[200px] px-3 py-2 border rounded-md font-mono text-sm"
          placeholder="You are a helpful coding assistant..."
          required
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Define your agent's personality, expertise, and behavior
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">
          Tools
        </label>
        <div className="space-y-2">
          {AVAILABLE_TOOLS.map((tool) => (
            <label
              key={tool.id}
              className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={formData.tools.includes(tool.id)}
                onChange={() => toggleTool(tool.id)}
                disabled={isLoading}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{tool.name}</div>
                <div className="text-xs text-muted-foreground">{tool.description}</div>
              </div>
            </label>
          ))}
        </div>
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
            className="w-full px-3 py-2 border rounded-md"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground mt-1">0 = focused, 2 = creative</p>
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
            className="w-full px-3 py-2 border rounded-md"
            disabled={isLoading}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? `${mode === 'create' ? 'Creating' : 'Updating'}...` : `${mode === 'create' ? 'Create' : 'Update'} Agent`}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="px-4 py-2 border rounded-md hover:bg-muted disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
