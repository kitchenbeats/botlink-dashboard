# Claude Code PTY Abstraction - Implementation Plan

**Project**: BotLink Dashboard
**Goal**: Create a production-worthy abstraction layer for Claude Code PTY interactions with elegant multi-mode UI
**Status**: Planning Complete - Ready for Implementation
**Date**: 2025-10-19

---

## 📋 Executive Summary

Transform the current raw PTY terminal interface into a professional, multi-level abstraction that provides:
- **Simple Mode**: Clean chat bubbles hiding terminal complexity
- **Hybrid Mode**: Chat with collapsible terminal access
- **Power Mode**: Full terminal + chat side-by-side with advanced controls

**Key Insight**: Use Claude CLI's `--output-format stream-json` flag to get structured output instead of raw terminal text.

---

## 🏗️ Current Architecture Analysis

### What We Have (✅ Strong Foundation)

```
┌─────────────────────────────────────────────────────────┐
│ Frontend (Next.js)                                       │
│  ├─ WorkspaceLayout                                     │
│  ├─ ModePanel (Simple/Agents)                           │
│  ├─ SimpleChatInterface (basic chat UI)                 │
│  ├─ TerminalPty (xterm.js)                              │
│  └─ useRedisStream hook                                 │
└──────────────────┬──────────────────────────────────────┘
                   │ Redis Pub/Sub
┌──────────────────▼──────────────────────────────────────┐
│ E2B Sandbox (per project)                               │
│  └─ PM2: claude-pty-manager.js                          │
│      ├─ Spawns: spawn('claude', [])                     │
│      ├─ Publishes: workspace:{projectId}:claude-output  │
│      └─ Subscribes: workspace:{projectId}:claude-input  │
└──────────────────┬──────────────────────────────────────┘
                   │
              Claude Code CLI
```

**Strengths:**
- ✅ Redis streaming already implemented
- ✅ E2B sandbox isolation
- ✅ PM2 process management
- ✅ Basic chat UI prototype (SimpleChatInterface)
- ✅ Terminal UI (xterm.js via TerminalPty)
- ✅ WebSocket real-time communication

**Current Limitations:**
- ❌ No structured message parsing (raw terminal output)
- ❌ No Claude JSON streaming format usage
- ❌ No tool permissions UI
- ❌ No session persistence
- ❌ No file change detection
- ❌ No multi-mode UI (just Simple/Agents)

---

## 🎯 Target Architecture

### What We're Building

```
┌─────────────────────────────────────────────────────────┐
│ Frontend (Multi-Mode UI)                                │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │ Simple Mode: Chat Only                     │        │
│  │  - Clean chat bubbles                      │        │
│  │  - System messages for file changes        │        │
│  │  - "Claude is thinking..." indicators      │        │
│  │  - Tool use visualizations                 │        │
│  └────────────────────────────────────────────┘        │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │ Hybrid Mode: Chat + Collapsible Terminal   │        │
│  │  - Primary: Chat interface                 │        │
│  │  - Secondary: Terminal panel (toggle)      │        │
│  │  - File tree sidebar                       │        │
│  └────────────────────────────────────────────┘        │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │ Power Mode: Side-by-Side                   │        │
│  │  - Split: Terminal (left) + Chat (right)   │        │
│  │  - Full control panel                      │        │
│  │  - Advanced settings                       │        │
│  └────────────────────────────────────────────┘        │
│                                                          │
│  Common Components:                                     │
│  ├─ ClaudeMessageParser                                 │
│  ├─ ToolPermissionsDialog                               │
│  ├─ SessionManager                                      │
│  └─ FileChangeNotifier                                  │
└──────────────────┬──────────────────────────────────────┘
                   │ Redis Pub/Sub (Enhanced Messages)
┌──────────────────▼──────────────────────────────────────┐
│ Enhanced PTY Manager (claude-pty-manager.js v2)         │
│                                                          │
│  Spawns: spawn('claude', [                              │
│    '--output-format', 'stream-json',  ← KEY!            │
│    '--verbose',                                          │
│    '--model', 'sonnet',                                 │
│    '--allowedTools', 'Read', 'Write', ... ← CONTROL     │
│  ])                                                      │
│                                                          │
│  Output: Structured JSON messages:                      │
│  {                                                       │
│    "session_id": "abc123",                              │
│    "type": "text|tool_use|tool_result|thinking",       │
│    "content": "...",                                    │
│    "tool_name": "Write",                                │
│    "tool_input": { ... }                                │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Phase 1: Core Abstraction Layer

**Duration**: 2-3 days
**Priority**: P0 (Critical Foundation)

### 1.1 Enhanced PTY Manager with Structured Output

**File**: `e2b-templates/*/configs/claude-pty-manager.js`

**Changes**:
```javascript
// OLD:
claudePty = spawn('claude', [], { ... });

// NEW:
claudePty = spawn('claude', [
  '--output-format', 'stream-json',  // Get structured output
  '--verbose',                        // Include all events
  '--model', 'sonnet'                // Default model
], { ... });
```

**Why**: This is THE key change. Everything else builds on structured JSON output.

### 1.2 Claude Message Parser Service

**New File**: `src/lib/services/claude-message-parser.ts`

```typescript
export interface ClaudeStreamMessage {
  session_id?: string;
  type: 'text' | 'tool_use' | 'tool_result' | 'thinking' | 'error';
  content?: string;
  tool_name?: string;
  tool_input?: unknown;
  tool_result?: unknown;
  status?: 'pending' | 'running' | 'complete';
  metadata?: Record<string, unknown>;
}

export interface ParsedClaudeMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  type: 'text' | 'thinking' | 'tool-use' | 'tool-result' | 'file-change';
  metadata: {
    session_id?: string;
    tool_name?: string;
    tool_input?: unknown;
    file_path?: string;
    operation?: 'create' | 'update' | 'delete';
    thinking?: boolean;
  };
  timestamp: Date;
}

export class ClaudeMessageParser {
  /**
   * Parse raw Claude output (could be JSON or plain text)
   */
  static parse(raw: string): ParsedClaudeMessage | null {
    // Try JSON first
    try {
      const json = JSON.parse(raw) as ClaudeStreamMessage;
      return this.parseStructured(json);
    } catch {
      // Fallback to text parsing
      return this.parseText(raw);
    }
  }

  private static parseStructured(msg: ClaudeStreamMessage): ParsedClaudeMessage {
    const base = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      metadata: {
        session_id: msg.session_id
      }
    };

    switch (msg.type) {
      case 'text':
        return {
          ...base,
          role: 'assistant',
          content: msg.content || '',
          type: 'text'
        };

      case 'thinking':
        return {
          ...base,
          role: 'system',
          content: msg.content || '',
          type: 'thinking',
          metadata: { ...base.metadata, thinking: true }
        };

      case 'tool_use':
        return {
          ...base,
          role: 'tool',
          content: `Using tool: ${msg.tool_name}`,
          type: 'tool-use',
          metadata: {
            ...base.metadata,
            tool_name: msg.tool_name,
            tool_input: msg.tool_input
          }
        };

      case 'tool_result':
        return {
          ...base,
          role: 'tool',
          content: String(msg.tool_result || ''),
          type: 'tool-result',
          metadata: {
            ...base.metadata,
            tool_name: msg.tool_name
          }
        };

      default:
        return {
          ...base,
          role: 'system',
          content: JSON.stringify(msg),
          type: 'text'
        };
    }
  }

  private static parseText(raw: string): ParsedClaudeMessage | null {
    // Strip ANSI codes
    const clean = raw.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

    // Detect file operations
    const fileOpMatch = clean.match(/✓\s*(Created|Updated|Deleted):\s*(.+)/);
    if (fileOpMatch) {
      return {
        id: crypto.randomUUID(),
        role: 'system',
        content: clean,
        type: 'file-change',
        metadata: {
          operation: fileOpMatch[1].toLowerCase() as 'create' | 'update' | 'delete',
          file_path: fileOpMatch[2].trim()
        },
        timestamp: new Date()
      };
    }

    // Regular text
    if (clean.trim()) {
      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: clean,
        type: 'text',
        metadata: {},
        timestamp: new Date()
      };
    }

    return null;
  }

  /**
   * Detect if message indicates Claude is thinking/processing
   */
  static isThinking(msg: ParsedClaudeMessage): boolean {
    return msg.type === 'thinking' || msg.metadata.thinking === true;
  }

  /**
   * Extract file changes from message history
   */
  static extractFileChanges(messages: ParsedClaudeMessage[]): Array<{
    path: string;
    operation: 'create' | 'update' | 'delete';
  }> {
    return messages
      .filter(m => m.type === 'file-change')
      .map(m => ({
        path: m.metadata.file_path!,
        operation: m.metadata.operation!
      }));
  }
}
```

**Why**: Centralized parsing logic that handles both structured JSON and fallback text parsing.

### 1.3 Enhanced SimpleChatInterface

**File**: `src/features/workspace/simple-chat-interface.tsx`

**Changes**:
- Replace `stripAnsiCodes` with `ClaudeMessageParser.parse()`
- Add message type indicators (thinking, tool use, file changes)
- Add "Claude is thinking..." animated indicator
- Add file change notifications

**Key Code**:
```typescript
// In useEffect for streaming messages
useEffect(() => {
  if (streamMessages.length === 0) return;

  const latestMessage = streamMessages[streamMessages.length - 1];
  if (!latestMessage || latestMessage.type !== 'message') return;

  if (latestMessage.topic === 'claude-output') {
    const outputData = latestMessage.data as { type: 'stdout' | 'stderr'; data: string };

    // Parse with new parser
    const parsed = ClaudeMessageParser.parse(outputData.data);

    if (!parsed) return;

    // Add to messages based on type
    setMessages(prev => {
      // If thinking, show inline indicator
      if (ClaudeMessageParser.isThinking(parsed)) {
        setIsThinking(true);
        return prev;
      }

      // If file change, show as system message
      if (parsed.type === 'file-change') {
        return [...prev, {
          id: parsed.id,
          role: 'system',
          content: `${parsed.metadata.operation === 'create' ? '✓' : parsed.metadata.operation === 'update' ? '↻' : '✗'} ${parsed.metadata.operation}: ${parsed.metadata.file_path}`,
          createdAt: parsed.timestamp
        }];
      }

      // Regular message - append or update
      const lastMsg = prev[prev.length - 1];
      if (lastMsg?.role === 'assistant' && parsed.role === 'assistant') {
        // Append to existing message
        return prev.slice(0, -1).concat({
          ...lastMsg,
          content: lastMsg.content + parsed.content
        });
      }

      // New message
      return [...prev, {
        id: parsed.id,
        role: parsed.role,
        content: parsed.content,
        createdAt: parsed.timestamp
      }];
    });

    setIsThinking(false);
  }
}, [streamMessages]);
```

### 1.4 Session ID Capture & Management

**New File**: `src/lib/services/claude-session-manager.ts`

```typescript
export class ClaudeSessionManager {
  private static sessions = new Map<string, string>(); // projectId -> sessionId

  /**
   * Capture session ID from Claude output
   */
  static captureSessionId(projectId: string, message: ParsedClaudeMessage): void {
    if (message.metadata.session_id) {
      this.sessions.set(projectId, message.metadata.session_id);
      console.log(`[Session Manager] Captured session ID for ${projectId}:`, message.metadata.session_id);
    }
  }

  /**
   * Get current session ID for project
   */
  static getSessionId(projectId: string): string | null {
    return this.sessions.get(projectId) || null;
  }

  /**
   * Clear session for project
   */
  static clearSession(projectId: string): void {
    this.sessions.delete(projectId);
  }
}
```

---

## 🎨 Phase 2: Enhanced UI Features

**Duration**: 3-4 days
**Priority**: P1 (High Value Features)

### 2.1 Tool Permissions Dialog

**New File**: `src/features/workspace/tool-permissions-dialog.tsx`

```typescript
interface ToolPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSave: (settings: ToolSettings) => void;
}

export interface ToolSettings {
  allowedTools: string[];
  disallowedTools: string[];
  skipPermissions: boolean;
}

export function ToolPermissionsDialog({ ... }: ToolPermissionsDialogProps) {
  const allTools = [
    { name: 'Read', description: 'Read files and directories', category: 'filesystem' },
    { name: 'Write', description: 'Write and edit files', category: 'filesystem' },
    { name: 'Bash', description: 'Execute shell commands', category: 'system' },
    { name: 'Grep', description: 'Search file contents', category: 'filesystem' },
    { name: 'Glob', description: 'Find files by pattern', category: 'filesystem' },
    // ... etc
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Claude Tool Permissions</DialogTitle>
          <DialogDescription>
            Control which tools Claude can use in this workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Skip all permissions toggle */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
            <div className="flex-1">
              <Label className="font-medium text-yellow-900 dark:text-yellow-100">
                ⚠️ Skip All Permissions
              </Label>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Claude will auto-approve all tool uses (not recommended)
              </p>
            </div>
            <Switch
              checked={skipPermissions}
              onCheckedChange={setSkipPermissions}
            />
          </div>

          {/* Tool categories */}
          {!skipPermissions && (
            <>
              <div className="space-y-2">
                <Label>Allowed Tools</Label>
                <div className="grid grid-cols-2 gap-2">
                  {allTools.map(tool => (
                    <div key={tool.name} className="flex items-start space-x-2 p-2 border rounded">
                      <Checkbox
                        id={`tool-${tool.name}`}
                        checked={allowedTools.includes(tool.name)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAllowedTools(prev => [...prev, tool.name]);
                          } else {
                            setAllowedTools(prev => prev.filter(t => t !== tool.name));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={`tool-${tool.name}`}
                          className="font-medium cursor-pointer"
                        >
                          {tool.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            onSave({ allowedTools, disallowedTools, skipPermissions });
            onOpenChange(false);
          }}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 2.2 Multi-Mode UI Switcher

**File**: `src/features/workspace/workspace-mode-context.tsx`

**Add**:
```typescript
export type WorkspaceUIMode = 'simple' | 'hybrid' | 'power';

interface WorkspaceModeContextValue {
  mode: 'simple' | 'agents';
  uiMode: WorkspaceUIMode;  // ← NEW
  setUIMode: (mode: WorkspaceUIMode) => void;  // ← NEW
  // ... existing fields
}
```

### 2.3 Thinking Indicator Component

**New File**: `src/features/workspace/thinking-indicator.tsx`

```typescript
export function ThinkingIndicator() {
  return (
    <div className="flex gap-3 py-2">
      <div className="flex-shrink-0">
        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
          <Bot className="h-4 w-4" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-sm text-muted-foreground">Claude is thinking...</span>
      </div>
    </div>
  );
}
```

### 2.4 Tool Use Visualization

**New File**: `src/features/workspace/tool-use-card.tsx`

```typescript
interface ToolUseCardProps {
  toolName: string;
  toolInput: unknown;
  toolResult?: unknown;
  status: 'pending' | 'running' | 'complete';
}

export function ToolUseCard({ toolName, toolInput, toolResult, status }: ToolUseCardProps) {
  const getToolIcon = (name: string) => {
    switch (name) {
      case 'Read': return <FileText className="h-4 w-4" />;
      case 'Write': return <FilePen className="h-4 w-4" />;
      case 'Bash': return <Terminal className="h-4 w-4" />;
      case 'Grep': return <Search className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  return (
    <div className="border rounded-lg p-3 bg-muted/30">
      <div className="flex items-center gap-2 mb-2">
        {getToolIcon(toolName)}
        <span className="font-medium text-sm">{toolName}</span>
        {status === 'running' && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
        {status === 'complete' && <CheckCircle2 className="h-3 w-3 text-green-500 ml-auto" />}
      </div>

      <div className="text-xs space-y-2">
        <div>
          <span className="text-muted-foreground">Input:</span>
          <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-x-auto">
            {JSON.stringify(toolInput, null, 2)}
          </pre>
        </div>

        {toolResult && (
          <div>
            <span className="text-muted-foreground">Result:</span>
            <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-x-auto">
              {JSON.stringify(toolResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## ✨ Phase 3: Polish & Optimization

**Duration**: 2-3 days
**Priority**: P2 (Nice to Have)

### 3.1 Session History Browser

- Store sessions in database
- Browse past conversations
- Resume from any point
- Export conversation to markdown

### 3.2 Advanced Settings Panel

- Model selection (sonnet, opus, haiku)
- Temperature control
- Max tokens
- System prompt customization

### 3.3 File Change Activity Feed

- Real-time list of files changed
- Click to view diff
- Undo changes (via git)
- Export changes as patch

### 3.4 Performance Optimization

- Message virtualization (only render visible messages)
- Debounce Redis updates
- Memoize heavy parsers
- Lazy load components

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// src/lib/services/__tests__/claude-message-parser.test.ts
describe('ClaudeMessageParser', () => {
  it('should parse JSON text message', () => {
    const input = '{"type":"text","content":"Hello"}';
    const result = ClaudeMessageParser.parse(input);

    expect(result).toMatchObject({
      role: 'assistant',
      type: 'text',
      content: 'Hello'
    });
  });

  it('should detect file changes', () => {
    const input = '✓ Created: src/app/page.tsx';
    const result = ClaudeMessageParser.parse(input);

    expect(result).toMatchObject({
      type: 'file-change',
      metadata: {
        operation: 'created',
        file_path: 'src/app/page.tsx'
      }
    });
  });
});
```

### Integration Tests

- Test Redis pub/sub flow
- Test session capture
- Test tool permissions

### E2E Tests

- Full workspace creation → Claude interaction → file changes
- Multi-mode switching
- Session resume

---

## 📊 Success Metrics

- [ ] Zero raw ANSI codes visible in Simple Mode
- [ ] 100% of file changes detected and shown
- [ ] Tool use visualization working for all tools
- [ ] Session resume working correctly
- [ ] All 3 modes (Simple/Hybrid/Power) functional
- [ ] Performance: <100ms message render time
- [ ] Zero production errors in first week

---

## 🚀 Deployment Strategy

### Phase 1 Rollout (Simple Mode)
1. Deploy enhanced PTY manager to E2B templates
2. Deploy ClaudeMessageParser service
3. Deploy updated SimpleChatInterface
4. **Feature flag**: `ENABLE_STRUCTURED_CLAUDE_OUTPUT=true`
5. Monitor for 48 hours
6. Gradual rollout to all users

### Phase 2 Rollout (Tool Permissions)
1. Deploy ToolPermissionsDialog
2. Deploy settings storage
3. **Feature flag**: `ENABLE_TOOL_PERMISSIONS=true`
4. Beta test with internal users
5. Public rollout

### Phase 3 Rollout (Multi-Mode)
1. Deploy UI mode switcher
2. Deploy Hybrid and Power modes
3. **Feature flag**: `ENABLE_MULTI_MODE=true`
4. Beta test
5. Public rollout

---

## 📝 Implementation Checklist

### Phase 1: Core Abstraction
- [ ] Update claude-pty-manager.js with --output-format stream-json
- [ ] Create ClaudeMessageParser service
- [ ] Add unit tests for parser
- [ ] Update SimpleChatInterface to use parser
- [ ] Add ThinkingIndicator component
- [ ] Create ClaudeSessionManager
- [ ] Test end-to-end message flow

### Phase 2: Enhanced UI
- [ ] Create ToolPermissionsDialog
- [ ] Add tool settings storage (database)
- [ ] Update PTY manager to accept tool settings
- [ ] Create ToolUseCard component
- [ ] Add file change notifications
- [ ] Implement session history UI
- [ ] Add multi-mode switcher to header

### Phase 3: Polish
- [ ] Create settings panel
- [ ] Add message virtualization
- [ ] Implement session export
- [ ] Add file diff viewer
- [ ] Performance profiling
- [ ] Documentation
- [ ] E2E tests

---

## 💡 Future Enhancements (Post-Launch)

- **Voice input**: Whisper integration for voice commands
- **Image support**: Screenshot sharing with Claude
- **Collaborative editing**: Multiple users in same workspace
- **AI-powered suggestions**: Proactive tool recommendations
- **Custom agents**: User-defined tool combinations
- **Workflow templates**: Pre-built task automation

---

## 📚 References

- [siteboon/claudecodeui](https://github.com/siteboon/claudecodeui) - Reference implementation
- [sugyan/claude-code-webui](https://github.com/sugyan/claude-code-webui) - Alternative approach
- [Claude CLI Documentation](https://docs.claude.com/en/docs/claude-code/cli-reference)
- [xterm.js Documentation](https://xtermjs.org/)
- [node-pty Documentation](https://github.com/microsoft/node-pty)

---

**Next Steps**: Begin Phase 1 implementation with enhanced PTY manager and message parser.
