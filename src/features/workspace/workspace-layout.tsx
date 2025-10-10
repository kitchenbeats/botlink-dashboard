'use client';

import { useState } from 'react';
import type { Project, File as ProjectFile } from '@/lib/types/database';
import { FileTree } from './file-tree';
import { CodeEditor } from './code-editor';
import { ChatPanel } from './chat-panel';
import { WorkspaceHeader } from './workspace-header';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

interface WorkspaceLayoutProps {
  project: Project;
  files: ProjectFile[];
}

export function WorkspaceLayout({ project, files }: WorkspaceLayoutProps) {
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(
    files.length > 0 ? files[0] : null
  );
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-background">
      <WorkspaceHeader project={project} isChatOpen={isChatOpen} onToggleChat={() => setIsChatOpen(!isChatOpen)} />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* File Tree Panel */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <FileTree
            files={files}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            projectId={project.id}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Editor Panel */}
        <ResizablePanel defaultSize={isChatOpen ? 50 : 80} minSize={30}>
          <CodeEditor file={selectedFile} projectId={project.id} />
        </ResizablePanel>

        {isChatOpen && (
          <>
            <ResizableHandle withHandle />
            {/* Chat Panel */}
            <ResizablePanel defaultSize={30} minSize={25} maxSize={50}>
              <ChatPanel projectId={project.id} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
