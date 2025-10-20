'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/primitives/card';
import { Button } from '@/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/primitives/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/ui/primitives/dropdown-menu';
import { MoreVertical, Trash2, Loader2, Play, ExternalLink } from 'lucide-react';
import type { ProjectWithStatus } from '@/lib/db/projects';

interface ProjectCardProps {
  project: ProjectWithStatus;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const isRunning = project.sandbox_status === 'running';

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/workspace/${project.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        router.refresh();
        setIsDeleteDialogOpen(false);
      } else {
        console.error('Failed to delete project:', data.error);
        alert('Failed to delete project: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  }

  function handleDropdownClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  }

  async function handleRunProject(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    setIsStarting(true);
    try {
      const { runProject } = await import('@/server/actions/projects');
      await runProject(project.id);
      // runProject will redirect to workspace when ready
    } catch (error) {
      console.error('Failed to start project:', error);
      alert('Failed to start project');
      setIsStarting(false);
    }
  }

  function handleOpenProject(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/workspace/${project.id}`);
  }

  return (
    <>
      <Card className="hover:border-primary transition-colors relative group">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle>{project.name}</CardTitle>
              <CardDescription>
                {project.template} • {new Date(project.updated_at ?? project.created_at ?? new Date()).toLocaleDateString()}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={handleDropdownClick}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={handleDropdownClick}>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Export</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        {project.description && (
          <CardContent>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </CardContent>
        )}
        <CardContent className="pt-0">
          <div className="flex gap-2">
            {isRunning ? (
              <Button
                onClick={handleOpenProject}
                className="flex-1"
                disabled={isStarting}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Workspace
              </Button>
            ) : (
              <Button
                onClick={handleRunProject}
                className="flex-1"
                disabled={isStarting}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Project
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{project.name}"? This will permanently delete the project,
              all its files, and stop any running sandboxes. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
