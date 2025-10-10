'use client';

import { useState } from 'react';
import type { File as ProjectFile } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  File,
  FolderOpen,
  Plus,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileTreeProps {
  files: ProjectFile[];
  selectedFile: ProjectFile | null;
  onSelectFile: (file: ProjectFile) => void;
  projectId: string;
}

export function FileTree({ files, selectedFile, onSelectFile }: FileTreeProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = files.filter((file) =>
    file.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Organize files into tree structure
  const fileTree = organizeFilesIntoTree(filteredFiles);

  return (
    <div className="h-full flex flex-col border-r">
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Files</h2>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No files found
            </div>
          ) : (
            <FileTreeNode
              node={fileTree}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              level={0}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  file?: ProjectFile;
  children: TreeNode[];
}

function organizeFilesIntoTree(files: ProjectFile[]): TreeNode {
  const root: TreeNode = {
    name: '',
    path: '',
    isDirectory: true,
    children: [],
  };

  files.forEach((file) => {
    const parts = file.path.split('/');
    let current = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const path = parts.slice(0, index + 1).join('/');

      let child = current.children.find((c) => c.name === part);

      if (!child) {
        child = {
          name: part,
          path,
          isDirectory: !isLast,
          file: isLast ? file : undefined,
          children: [],
        };
        current.children.push(child);
      }

      current = child;
    });
  });

  // Sort: directories first, then files alphabetically
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => {
      if (node.children.length > 0) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(root.children);
  return root;
}

interface FileTreeNodeProps {
  node: TreeNode;
  selectedFile: ProjectFile | null;
  onSelectFile: (file: ProjectFile) => void;
  level: number;
}

function FileTreeNode({ node, selectedFile, onSelectFile, level }: FileTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(level < 2); // Auto-expand first 2 levels

  if (node.children.length === 0 && !node.file) {
    return null;
  }

  return (
    <>
      {node.name && (
        <button
          onClick={() => {
            if (node.isDirectory) {
              setIsOpen(!isOpen);
            } else if (node.file) {
              onSelectFile(node.file);
            }
          }}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors',
            selectedFile?.id === node.file?.id && 'bg-accent',
            'text-left'
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {node.isDirectory ? (
            <FolderOpen className="h-4 w-4 text-blue-500 flex-shrink-0" />
          ) : (
            <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
      )}

      {node.isDirectory && isOpen && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </>
  );
}
