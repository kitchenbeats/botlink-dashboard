'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkflowBuilder } from './workflow-builder';
import { createWorkflowAction, updateWorkflowAction } from '@/server/actions/workflows';
import type { Node, Edge } from 'reactflow';
import type { Workflow } from '@/lib/types/database';

interface Agent {
  id: string;
  name: string;
  type: string;
  model: string;
}

interface WorkflowFormProps {
  workflow?: Workflow;
  agents: Agent[];
  mode: 'create' | 'edit';
}

export function WorkflowForm({ workflow, agents, mode }: WorkflowFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: workflow?.name || '',
    description: workflow?.description || '',
  });

  const [workflowDefinition, setWorkflowDefinition] = useState<{
    nodes: Node[];
    edges: Edge[];
  }>({
    nodes: workflow?.nodes || [],
    edges: workflow?.edges || [],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (workflowDefinition.nodes.length === 0) {
      setError('Please add at least one agent to the workflow');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = {
        name: formData.name,
        description: formData.description || null,
        nodes: workflowDefinition.nodes.map(node => ({
          id: node.id,
          type: node.type || 'default',
          position: node.position,
          data: node.data as { agentId?: string; label?: string; [key: string]: unknown },
        })),
        edges: workflowDefinition.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
        })),
      };

      const result = mode === 'create'
        ? await createWorkflowAction(data)
        : await updateWorkflowAction(workflow!.id, data);

      if (result.success) {
        router.push('/dashboard/workflows');
        router.refresh();
      } else {
        setError(result.error || `Failed to ${mode} workflow`);
        setIsLoading(false);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      setIsLoading(false);
    }
  }

  function handleWorkflowSave(nodes: Node[], edges: Edge[]) {
    setWorkflowDefinition({ nodes, edges });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Workflow Name
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="My Custom Workflow"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full min-h-[80px] px-3 py-2 border rounded-md"
            placeholder="Describe what this workflow does..."
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Workflow Canvas */}
      <div>
        <div className="mb-3">
          <h3 className="text-lg font-semibold">Workflow Design</h3>
          <p className="text-sm text-muted-foreground">
            Add agents to the canvas and connect them to define the execution flow
          </p>
        </div>

        <WorkflowBuilder
          agents={agents}
          initialNodes={workflowDefinition.nodes}
          initialEdges={workflowDefinition.edges}
          onSave={handleWorkflowSave}
        />
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
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? `${mode === 'create' ? 'Creating' : 'Updating'}...` : `${mode === 'create' ? 'Create' : 'Update'} Workflow`}
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
