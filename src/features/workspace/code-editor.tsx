'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import type { File as ProjectFile } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Save, FileCode } from 'lucide-react';

interface CodeEditorProps {
  file: ProjectFile | null;
  projectId: string;
}

export function CodeEditor({ file }: CodeEditorProps) {
  const { theme } = useTheme();
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (file) {
      setContent(file.content);
      setHasChanges(false);
    }
  }, [file]);

  function handleEditorChange(value: string | undefined) {
    if (value !== undefined) {
      setContent(value);
      setHasChanges(value !== file?.content);
    }
  }

  async function handleSave() {
    if (!file || !hasChanges) return;

    setIsSaving(true);
    try {
      // TODO: Implement file update action
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate save
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save file:', error);
    } finally {
      setIsSaving(false);
    }
  }

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/5">
        <div className="text-center">
          <FileCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Select a file to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="border-b px-4 py-2 flex items-center justify-between bg-background">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{file.path}</span>
          {hasChanges && (
            <span className="text-xs text-muted-foreground">(unsaved)</span>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage={file.language || 'plaintext'}
          value={content}
          onChange={handleEditorChange}
          theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            rulers: [80, 120],
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'all',
            scrollbar: {
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
          }}
        />
      </div>
    </div>
  );
}
