'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import type { File as ProjectFile } from '@/lib/types/database';
import { Button } from '@/ui/primitives/button';
import { Save, FileCode, Loader2 } from 'lucide-react';
import { readFileContent, writeFileContent } from '@/server/actions/workspace';

interface CodeEditorProps {
  file: ProjectFile | null;
  projectId: string;
}

export function CodeEditor({ file, projectId }: CodeEditorProps) {
  const { theme } = useTheme();
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load file content when file changes
  useEffect(() => {
    async function loadFileContent() {
      if (!file) {
        setContent('');
        setOriginalContent('');
        setHasChanges(false);
        return;
      }

      setIsLoading(true);
      try {
        const result = await readFileContent(projectId, file.path);
        let fileContent = result.content || '';

        // Fix escaped newlines - convert literal \n to actual newlines
        if (fileContent.includes('\\n')) {
          fileContent = fileContent.replace(/\\n/g, '\n');
        }

        setContent(fileContent);
        setOriginalContent(fileContent);
        setHasChanges(false);
      } catch (error) {
        console.error('[CodeEditor] Failed to load file content:', error);
        setContent('');
        setOriginalContent('');
      } finally {
        setIsLoading(false);
      }
    }

    loadFileContent();
  }, [file, projectId]);

  function handleEditorChange(value: string | undefined) {
    if (value !== undefined) {
      setContent(value);
      setHasChanges(value !== originalContent);
    }
  }

  async function handleSave() {
    if (!file || !hasChanges) return;

    setIsSaving(true);
    try {
      await writeFileContent(projectId, file.path, content);
      setOriginalContent(content);
      setHasChanges(false);
    } catch (error) {
      console.error('[CodeEditor] Failed to save file:', error);
      // TODO: Show toast notification
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
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
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
              tabSize: 2,
              insertSpaces: true,
              formatOnPaste: true,
              formatOnType: true,
              autoIndent: 'full',
            }}
          />
        )}
      </div>
    </div>
  );
}
