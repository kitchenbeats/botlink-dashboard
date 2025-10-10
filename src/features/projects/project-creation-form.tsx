'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Globe, FileCode2 } from 'lucide-react';
import type { ProjectTemplate } from '@/lib/types/database';

interface ProjectCreationFormProps {
  teamId: string;
}

export function ProjectCreationForm({ teamId }: ProjectCreationFormProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template: 'simple_site' as ProjectTemplate,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error('Create project error:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to create project');
      }

      const { project } = await response.json();
      router.push(`/workspace/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert(error instanceof Error ? error.message : 'Failed to create project');
      setIsCreating(false);
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
          <div
            onClick={() => setFormData({ ...formData, template: 'simple_site' })}
            className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition ${
              formData.template === 'simple_site' ? 'border-primary bg-primary/5' : 'hover:border-primary'
            }`}
          >
            <input
              type="radio"
              name="template"
              value="simple_site"
              checked={formData.template === 'simple_site'}
              onChange={(e) => setFormData({ ...formData, template: e.target.value as ProjectTemplate })}
              className="mt-1"
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 font-medium">
                <Globe className="h-4 w-4" />
                Simple Site
              </div>
              <p className="text-sm text-muted-foreground">
                HTML, CSS, and JavaScript with live preview. Perfect for landing pages,
                portfolios, or simple web apps.
              </p>
            </div>
          </div>

          <div
            onClick={() => setFormData({ ...formData, template: 'nextjs' })}
            className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition ${
              formData.template === 'nextjs' ? 'border-primary bg-primary/5' : 'hover:border-primary'
            }`}
          >
            <input
              type="radio"
              name="template"
              value="nextjs"
              checked={formData.template === 'nextjs'}
              onChange={(e) => setFormData({ ...formData, template: e.target.value as ProjectTemplate })}
              className="mt-1"
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 font-medium">
                <FileCode2 className="h-4 w-4" />
                Next.js
              </div>
              <p className="text-sm text-muted-foreground">
                Full Next.js workspace with App Router, TypeScript, and Tailwind CSS.
                Build production-ready full-stack applications.
              </p>
            </div>
          </div>
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
        <Button type="submit" disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}
