'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Project } from '@/lib/types/database';
import { Button } from '@/ui/primitives/button';
import { ChevronLeft, Loader2, ExternalLink, Trash2, Eye, EyeOff, GitBranch, Clock, Save, Sparkles, Zap, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/ui/primitives/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/primitives/dialog';
import { useWorkspaceMode } from './workspace-mode-context';

interface WorkspaceHeaderProps {
  project: Project;
  isEditorOpen: boolean;
  onToggleEditor: () => void;
}

interface GitCommit {
  hash: string;
  message: string;
  date: string;
}

export function WorkspaceHeader({ project, isEditorOpen, onToggleEditor }: WorkspaceHeaderProps) {
  const router = useRouter();
  const { mode, setMode } = useWorkspaceMode();
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [currentHash, setCurrentHash] = useState<string | null>(null);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const loadCommitHistory = useCallback(async () => {
    setIsLoadingCommits(true);
    try {
      const { getCommitHistory } = await import('@/server/actions/workspace');
      const result = await getCommitHistory(project.id);

      if (result.success) {
        setCommits(result.commits);
        setCurrentHash(result.currentHash ?? null);
      }
    } catch (error) {
      console.error('Failed to load commit history:', error);
    } finally {
      setIsLoadingCommits(false);
    }
  }, [project.id]);

  // Load git history when component mounts
  useEffect(() => {
    loadCommitHistory();
  }, [loadCommitHistory]);

  async function handleCheckoutCommit(commitHash: string) {
    setIsCheckingOut(true);
    try {
      const { checkoutCommit } = await import('@/server/actions/workspace');
      await checkoutCommit(project.id, commitHash);

      setCurrentHash(commitHash);

      // Reload the page to refresh file tree and editor
      router.refresh();
    } catch (error) {
      console.error('Failed to checkout commit:', error);
      alert('Failed to checkout commit');
    } finally {
      setIsCheckingOut(false);
    }
  }

  async function handleOpenPreview() {
    setIsLoadingPreview(true);
    try {
      const response = await fetch(`/api/workspace/${project.id}/preview-url`);

      if (!response.ok) {
        throw new Error('Failed to fetch preview URL');
      }

      const data = await response.json();

      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        console.error('No preview URL returned');
        alert('Failed to get preview URL');
      }
    } catch (error) {
      console.error('Preview error:', error);
      alert('Failed to open preview');
    } finally {
      setIsLoadingPreview(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/workspace/${project.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/dashboard/${project.team_id}/projects`);
      } else {
        console.error('Failed to delete project:', data.error);
        alert('Failed to delete project: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete project');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }

  async function handleSaveSnapshot() {
    setIsSavingSnapshot(true);
    try {
      const { createProjectSnapshot } = await import('@/server/actions/snapshots');
      const result = await createProjectSnapshot({
        projectId: project.id,
        description: 'Manual snapshot',
      });

      if (result?.data?.success) {
        toast.success('Snapshot saved successfully');
      } else {
        toast.error('Failed to save snapshot');
      }
    } catch (error) {
      console.error('Snapshot error:', error);
      toast.error('Failed to save snapshot');
    } finally {
      setIsSavingSnapshot(false);
    }
  }

  async function handleCloseWorkspace() {
    setIsClosing(true);
    try {
      const { stopProject } = await import('@/server/actions/projects');
      const result = await stopProject(project.id);

      if (result.success) {
        toast.success('Project stopped. Snapshot saved in background.');
        router.push(`/dashboard/${project.team_id}/projects`);
      } else {
        toast.error('Failed to stop project');
        setIsClosing(false);
      }
    } catch (error) {
      console.error('Stop project error:', error);
      toast.error('Failed to stop project');
      setIsClosing(false);
    }
  }

  return (
    <header className="border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCloseWorkspace}
          disabled={isClosing}
        >
          {isClosing ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <ChevronLeft className="h-4 w-4 mr-1" />
          )}
          {isClosing ? 'Closing...' : 'Close Workspace'}
        </Button>
        <div>
          <h1 className="font-semibold">{project.name}</h1>
          {project.description && (
            <p className="text-xs text-muted-foreground">{project.description}</p>
          )}
        </div>

        {/* Mode Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-4">
              {mode === 'simple' ? (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Simple Mode
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Agents Mode
                </>
              )}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Execution Mode</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setMode('simple')}
              className="flex flex-col items-start gap-1 p-3"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Simple Mode</span>
                {mode === 'simple' && (
                  <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Fast conversational coding with Claude Code CLI
              </p>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setMode('agents')}
              className="flex flex-col items-start gap-1 p-3"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Agents Mode</span>
                {mode === 'agents' && (
                  <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Multi-agent orchestration for complex projects
              </p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        {/* Save Snapshot Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveSnapshot}
          disabled={isSavingSnapshot}
          title="Save a snapshot of current workspace state"
        >
          {isSavingSnapshot ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSavingSnapshot ? 'Saving...' : 'Save Snapshot'}
        </Button>
        {/* Git History Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isLoadingCommits || isCheckingOut}>
              {isCheckingOut ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <GitBranch className="h-4 w-4 mr-2" />
              )}
              History
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80">
            {commits.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No commits yet
              </div>
            ) : (
              commits.map((commit) => (
                <DropdownMenuItem
                  key={commit.hash}
                  onClick={() => handleCheckoutCommit(commit.hash)}
                  disabled={isCheckingOut}
                  className="flex flex-col items-start gap-1 p-3"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground font-mono">
                      {commit.hash.substring(0, 7)}
                    </span>
                    {currentHash === commit.hash && (
                      <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium line-clamp-1">{commit.message}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(commit.date).toLocaleString()}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenPreview}
          disabled={isLoadingPreview}
          title="Open preview in new tab"
        >
          {isLoadingPreview ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4 mr-2" />
          )}
          {isLoadingPreview ? 'Loading...' : 'Preview'}
        </Button>

        <Button
          variant={isEditorOpen ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleEditor}
          title={isEditorOpen ? 'Hide editor panel' : 'Show editor panel'}
        >
          {isEditorOpen ? (
            <EyeOff className="h-4 w-4 mr-2" />
          ) : (
            <Eye className="h-4 w-4 mr-2" />
          )}
          Editor
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
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
    </header>
  );
}
