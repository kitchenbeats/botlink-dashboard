'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Project } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { ChevronLeft, MessageSquare, Play, Loader2, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WorkspaceHeaderProps {
  project: Project;
  isChatOpen: boolean;
  onToggleChat: () => void;
}

export function WorkspaceHeader({ project, isChatOpen, onToggleChat }: WorkspaceHeaderProps) {
  const [isStartingSandbox, setIsStartingSandbox] = useState(false);
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null);

  async function handlePreview() {
    setIsStartingSandbox(true);
    try {
      const response = await fetch('/api/sandbox/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        setSandboxUrl(data.url);
        window.open(data.url, '_blank');
      } else {
        console.error('Failed to start sandbox:', data.error);
        alert('Failed to start preview: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Preview error:', error);
      alert('Failed to start preview');
    } finally {
      setIsStartingSandbox(false);
    }
  }

  return (
    <header className="border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="font-semibold">{project.name}</h1>
          {project.description && (
            <p className="text-xs text-muted-foreground">{project.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {sandboxUrl ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(sandboxUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Preview
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={isStartingSandbox}
          >
            {isStartingSandbox ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {isStartingSandbox ? 'Starting...' : 'Preview'}
          </Button>
        )}

        <Button
          variant={isChatOpen ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleChat}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              •••
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Project Settings</DropdownMenuItem>
            <DropdownMenuItem>Export</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete Project</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
