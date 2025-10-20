'use client';

/**
 * Workspace Mode Context
 *
 * Manages switching between Simple Mode (Claude Code CLI) and Agents Mode (Multi-agent orchestration)
 * Persists mode choice to localStorage and provides seamless switching
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type WorkspaceMode = 'simple' | 'agents';

interface WorkspaceModeContextType {
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
  activeExecutionId: string | null;
  setActiveExecutionId: (id: string | null) => void;
}

const WorkspaceModeContext = createContext<WorkspaceModeContextType | undefined>(undefined);

export function WorkspaceModeProvider({
  children,
  projectId
}: {
  children: ReactNode;
  projectId: string;
}) {
  const [mode, setModeState] = useState<WorkspaceMode>('simple');
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);

  // Load mode from localStorage on mount
  useEffect(() => {
    const storageKey = `workspace-mode-${projectId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved === 'simple' || saved === 'agents') {
      setModeState(saved);
    }
  }, [projectId]);

  // Save mode to localStorage when it changes
  const setMode = (newMode: WorkspaceMode) => {
    setModeState(newMode);
    const storageKey = `workspace-mode-${projectId}`;
    localStorage.setItem(storageKey, newMode);
  };

  return (
    <WorkspaceModeContext.Provider value={{
      mode,
      setMode,
      activeExecutionId,
      setActiveExecutionId,
    }}>
      {children}
    </WorkspaceModeContext.Provider>
  );
}

export function useWorkspaceMode() {
  const context = useContext(WorkspaceModeContext);
  if (context === undefined) {
    throw new Error('useWorkspaceMode must be used within WorkspaceModeProvider');
  }
  return context;
}

/**
 * Helper to suggest mode based on input complexity
 */
export function suggestMode(userInput: string): {
  suggestedMode: WorkspaceMode;
  confidence: number;
  reason: string;
} {
  const words = userInput.trim().split(/\s+/).length;
  const hasMultipleSteps = /\d+\.|first.*then|step \d+/i.test(userInput);
  const hasComplexKeywords = /(full.?stack|database|authentication|api|backend|frontend|deploy)/i.test(userInput);
  const hasBuildWords = /(build|create|implement|develop).*app/i.test(userInput);

  // Simple mode indicators
  if (words < 20 && !hasComplexKeywords) {
    return {
      suggestedMode: 'simple',
      confidence: 0.9,
      reason: 'Short, straightforward request - Simple Mode is faster'
    };
  }

  // Agents mode indicators
  if (hasMultipleSteps || hasBuildWords || (words > 50 && hasComplexKeywords)) {
    return {
      suggestedMode: 'agents',
      confidence: 0.8,
      reason: 'Complex multi-step project - Agents Mode will break it down and execute in parallel'
    };
  }

  // Default to simple mode
  return {
    suggestedMode: 'simple',
    confidence: 0.5,
    reason: 'Simple Mode works well for most tasks'
  };
}
