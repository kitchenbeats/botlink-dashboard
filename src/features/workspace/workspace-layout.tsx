'use client';

import { useState, lazy, Suspense } from 'react';
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
  files: ProjectFile[];
  error?: string;
  errorMessage?: string;
  restoredFromSnapshot?: boolean;
}

function WorkspaceLayoutInner({ project, files, error, errorMessage, restoredFromSnapshot }: WorkspaceLayoutProps) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const [rightPanelView, setRightPanelView] = useState<'chat' | 'terminal' | 'files' | 'editor'>('chat');
  const [isRetrying, setIsRetrying] = useState(false);

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

      {/* Show restored from snapshot banner */}
      {restoredFromSnapshot && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400">
          ✓ Workspace restored from snapshot after idle timeout
        </div>
      )}

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Live Preview Panel - Main Area */}
        <ResizablePanel defaultSize={isEditorOpen ? 60 : 100} minSize={40}>
          <LivePreview projectId={project.id} template={project.template} />
        </ResizablePanel>

        {isEditorOpen && (
          <>
            <ResizableHandle />
            {/* Right Panel - Single View (Terminal, Files, or Editor) */}
            <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
              <div className="h-full flex flex-col">
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
                    <ChatV2 projectId={project.id} />
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
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}

// Wrapper component that provides mode context
export function WorkspaceLayout({ project, files, error, errorMessage, restoredFromSnapshot }: WorkspaceLayoutProps) {
  return (
    <WorkspaceModeProvider projectId={project.id}>
      <WorkspaceLayoutInner
        project={project}
        files={files}
        error={error}
        errorMessage={errorMessage}
        restoredFromSnapshot={restoredFromSnapshot}
      />
    </WorkspaceModeProvider>
  );
}
