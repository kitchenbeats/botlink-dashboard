'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/primitives/button';
import { Input } from '@/ui/primitives/input';
import { Label } from '@/ui/primitives/label';
import { Textarea } from '@/ui/primitives/textarea';
import type { ProjectTemplate } from '@/lib/types/database';
import { getAllTemplates } from '@/configs/templates';

interface ProjectCreationFormProps {
  teamId: string;
}

type CreationStep =
  | { status: 'idle' }
  | { status: 'creating_project'; message: 'Creating project...' }
  | { status: 'initializing_workspace'; message: 'Starting development environment...' }
  | { status: 'complete'; message: 'Ready!' };

export function ProjectCreationForm({ teamId }: ProjectCreationFormProps) {
  const router = useRouter();
  const [creationStep, setCreationStep] = useState<CreationStep>({ status: 'idle' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template: 'simple_site' as ProjectTemplate,
  });

  const isCreating = creationStep.status !== 'idle';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Step 1: Create project
      setCreationStep({ status: 'creating_project', message: 'Creating project...' });
      const { createNewProject } = await import('@/server/actions/projects');
      const result = await createNewProject(
        teamId,
        formData.name,
        formData.template,
        formData.description || undefined
      );

      if (!result.success || !result.projectId) {
        throw new Error(result.error || 'Failed to create project');
      }

      // Step 2: Navigate to workspace (it will handle sandbox creation)
      setCreationStep({ status: 'complete', message: 'Ready!' });
      router.push(`/workspace/${result.projectId}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert(error instanceof Error ? error.message : 'Failed to create project');
      setCreationStep({ status: 'idle' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="My Awesome App"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="A brief description of your project..."
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <Label>Project Template</Label>
        <div className="space-y-3">
          {getAllTemplates().map((template) => (
            <div
              key={template.id}
              onClick={() => setFormData({ ...formData, template: template.id as ProjectTemplate })}
              className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition ${
                formData.template === template.id ? 'border-primary bg-primary/5' : 'hover:border-primary'
              }`}
            >
              <input
                type="radio"
                name="template"
                value={template.id}
                checked={formData.template === template.id}
                onChange={(e) => setFormData({ ...formData, template: e.target.value as ProjectTemplate })}
                className="mt-1"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-lg">{template.icon}</span>
                  {template.name}
                </div>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
                {template.features && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.features.map((feature) => (
                      <span key={feature} className="text-xs px-2 py-0.5 bg-muted rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isCreating}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isCreating} className="min-w-[200px]">
          {creationStep.status === 'idle' && 'Create Project'}
          {creationStep.status === 'creating_project' && (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Creating project...
            </span>
          )}
          {creationStep.status === 'initializing_workspace' && (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Starting environment...
            </span>
          )}
          {creationStep.status === 'complete' && 'Ready!'}
        </Button>
      </div>
    </form>
  );
}
