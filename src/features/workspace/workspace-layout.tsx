'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import type { Project, File as ProjectFile } from '@/lib/types/database';
import { FileTree } from './file-tree';
import { CodeEditor } from './code-editor';
import { ModePanel } from './mode-panel';
import { ChatV2 } from './chat-v2';
import { LivePreview } from './live-preview';
import { WorkspaceHeader } from './workspace-header';
import { WorkspaceModeProvider } from './workspace-mode-context';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/ui/primitives/resizable';
import { Button } from '@/ui/primitives/button';
import { AlertCircle, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRedisStream } from '@/lib/hooks/use-redis-stream';

interface WorkspaceLayoutProps {
  project: Project;
  files?: ProjectFile[];
  error?: string;
  errorMessage?: string;
  previewUrl?: string;
}

function WorkspaceLayoutInner({ project, files = [], error, errorMessage, previewUrl }: WorkspaceLayoutProps) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const [rightPanelView, setRightPanelView] = useState<'chat' | 'terminal' | 'files' | 'editor'>('chat');
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // When a file is selected, switch to editor view
  const handleSelectFile = (file: ProjectFile | null) => {
    setSelectedFile(file);
    if (file) {
      setRightPanelView('editor');
    }
  };

  // Single Redis stream connection for entire workspace
  const { messages: streamMessages, isConnected, error: streamError } = useRedisStream({
    projectId: project.id,
    enabled: true,
  });

  // Auto-save snapshot on page leave (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      try {
        console.log('[Workspace] Page unloading, creating auto-save snapshot...');
        // Use navigator.sendBeacon for reliable async request on page unload
        const response = await fetch(`/api/workspace/${project.id}/auto-save`, {
          method: 'POST',
          keepalive: true, // Ensure request completes even if page unloads
        });

        if (response.ok) {
          console.log('[Workspace] Auto-save snapshot created on page leave');
        }
      } catch (error) {
        console.error('[Workspace] Auto-save on unload failed:', error);
        // Don't prevent navigation
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [project.id]);

  // Periodic auto-save every 5 minutes
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      try {
        console.log('[Workspace] Running periodic auto-save...');
        const response = await fetch(`/api/workspace/${project.id}/auto-save`, {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.saved) {
            console.log('[Workspace] Periodic auto-save complete:', data.snapshotId);
          } else {
            console.log('[Workspace] No changes to auto-save');
          }
        }
      } catch (error) {
        console.error('[Workspace] Periodic auto-save failed:', error);
        // Don't interrupt user
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(autoSaveInterval);
  }, [project.id]);

  // Cleanup expired sandboxes every 5 minutes
  useEffect(() => {
    const cleanupInterval = setInterval(async () => {
      try {
        const { cleanupExpiredSandboxes } = await import('@/server/actions/sandboxes');
        const result = await cleanupExpiredSandboxes();

        if (result?.data && result.data.cleaned > 0) {
          console.log(`[Workspace] Cleaned up ${result.data.cleaned} expired sandboxes`);
        }
      } catch (error) {
        // Silent fail - don't interrupt user
        console.error('[Workspace] Cleanup failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Run cleanup immediately on mount
    (async () => {
      try {
        const { cleanupExpiredSandboxes } = await import('@/server/actions/sandboxes');
        await cleanupExpiredSandboxes();
      } catch (error) {
        console.error('[Workspace] Initial cleanup failed:', error);
      }
    })();

    // Cleanup on unmount
    return () => clearInterval(cleanupInterval);
  }, []);

  // Auto-retry for dead sandbox
  const handleRetry = async () => {
    if (error === 'SANDBOX_DEAD') {
      setIsRetrying(true);
      // Clear workspace ready flag to force re-initialization with snapshot
      await fetch(`/api/workspace/${project.id}/reset-ready-flag`, { method: 'POST' });
      // Wait a moment then refresh
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } else {
      router.refresh();
    }
  };

  // If error state exists and files are empty
  if (error && files.length === 0) {
    const isSandboxDead = error === 'SANDBOX_DEAD';

    return (
      <div className="h-screen flex flex-col bg-background">
        <WorkspaceHeader
          project={project}
          isEditorOpen={isEditorOpen}
          onToggleEditor={() => setIsEditorOpen(!isEditorOpen)}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <AlertCircle className={`h-12 w-12 mx-auto ${isSandboxDead ? 'text-yellow-500' : 'text-destructive'}`} />
            <h2 className="text-xl font-semibold">
              {isSandboxDead ? 'Sandbox Reconnecting' : 'Failed to Initialize Project'}
            </h2>
            <p className="text-muted-foreground">
              {isSandboxDead
                ? 'The sandbox connection was lost (idle timeout). We\'re restoring it from the latest snapshot...'
                : errorMessage || 'The project workspace could not be initialized. This might be a temporary issue.'}
            </p>
            {isRetrying && (
              <p className="text-sm text-muted-foreground animate-pulse">
                Restoring from snapshot, please wait...
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.back()} disabled={isRetrying}>
                Go Back
              </Button>
              <Button onClick={handleRetry} disabled={isRetrying}>
                {isRetrying ? 'Restarting...' : isSandboxDead ? 'Restart Now' : 'Retry'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <WorkspaceHeader
        project={project}
        isEditorOpen={isEditorOpen}
        onToggleEditor={() => setIsEditorOpen(!isEditorOpen)}
      />

      <div className="flex-1 flex">
        {/* Live Preview Panel - Main Area */}
        <div className={isEditorOpen ? "flex-1" : "w-full"}>
          <LivePreview projectId={project.id} template={project.template} previewUrl={previewUrl} />
        </div>

        {isEditorOpen && (
          <>
            {/* Divider */}
            <div className="w-px bg-border" />
            {/* Right Panel - Fixed Width at 30% */}
            <div className="w-[30%] flex flex-col">
              {/* Tab Header */}
              <div className="border-b px-4 py-2 flex items-center gap-2 bg-muted/20">
                <Button
                  variant={rightPanelView === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setRightPanelView('chat')}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Chat
                </Button>
                <Button
                  variant={rightPanelView === 'terminal' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setRightPanelView('terminal')}
                >
                  Terminal
                </Button>
                <Button
                  variant={rightPanelView === 'files' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setRightPanelView('files')}
                >
                  Files
                </Button>
                {selectedFile && (
                  <Button
                    variant={rightPanelView === 'editor' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setRightPanelView('editor')}
                  >
                    {selectedFile.path.split('/').pop() || selectedFile.path}
                  </Button>
                )}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden">
                {rightPanelView === 'chat' && (
                  <ChatV2
                    projectId={project.id}
                    currentConversationId={currentConversationId}
                    onConversationChange={setCurrentConversationId}
                  />
                )}
                {rightPanelView === 'terminal' && (
                  <ModePanel
                    projectId={project.id}
                    teamId={project.team_id}
                    streamMessages={streamMessages}
                    isConnected={isConnected}
                    streamError={streamError}
                  />
                )}
                {rightPanelView === 'files' && (
                  <FileTree
                    files={files}
                    selectedFile={selectedFile}
                    onSelectFile={handleSelectFile}
                    projectId={project.id}
                  />
                )}
                {rightPanelView === 'editor' && selectedFile && (
                  <CodeEditor file={selectedFile} projectId={project.id} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Wrapper component that provides mode context
export function WorkspaceLayout({ project, files, error, errorMessage, previewUrl }: WorkspaceLayoutProps) {
  return (
    <WorkspaceModeProvider projectId={project.id}>
      <WorkspaceLayoutInner
        project={project}
        files={files}
        error={error}
        errorMessage={errorMessage}
        previewUrl={previewUrl}
      />
    </WorkspaceModeProvider>
  );
}
