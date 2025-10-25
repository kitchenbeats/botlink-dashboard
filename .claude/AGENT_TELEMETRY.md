# Agent Telemetry & Review Modes

## Overview

The coding agent now publishes detailed telemetry to Redis for full transparency in the UI. All agent internal workings are streamed in real-time.

## Telemetry Events Published

The agent publishes to these Redis topics (all under `workspace:{projectId}:*`):

### 1. `agent-thinking`
Agent's reasoning and thought process

```typescript
{
  content: string;    // The thinking/reasoning content
  timestamp: number;
}
```

### 2. `tool-use`
Every tool call made by the agent

```typescript
{
  tool: string;      // Tool name: 'terminal', 'createOrUpdateFiles', 'readFiles', 'runCode'
  input: object;     // Full input parameters
  id: string;        // Tool call ID
  timestamp: number;
}
```

### 3. `tool-result`
Result from each tool execution

```typescript
{
  toolCallId: string;  // Matches tool-use.id
  result: any;         // Tool output/result
  timestamp: number;
}
```

### 4. `review-result`
Code review feedback after each iteration

```typescript
{
  approved: boolean;      // true if code passed review
  iteration: number;      // Review iteration number
  feedback: string;       // Reviewer's detailed feedback
  willRetry?: boolean;    // If false, this was the last attempt
  timestamp: number;
}
```

### 5. `messages`
Final agent responses

```typescript
{
  message: string;   // Agent's message to user
  complete?: boolean; // If true, task is done
  timestamp: number;
}
```

### 6. `file-changes` (existing)
File modifications

```typescript
{
  path: string;
  action: 'updated' | 'created' | 'deleted';
  timestamp: number;
}
```

### 7. `terminal` (existing)
Terminal command execution

```typescript
{
  command: string;
  output?: string;
  timestamp: number;
}
```

## Review Modes

The agent supports 3 review modes via `CodingAgentConfig`:

### Mode: `off`
```typescript
{
  reviewMode: 'off'
}
```
- No code review
- Fastest execution
- Use for simple tasks or when you trust the first output

### Mode: `limited` (default)
```typescript
{
  reviewMode: 'limited',
  maxReviewIterations: 2  // Default is 2
}
```
- Review code after each agent run
- Retry up to N times if issues found
- Stops after max iterations even if not approved
- Good for most use cases

### Mode: `loop`
```typescript
{
  reviewMode: 'loop'
}
```
- Keep iterating until code is approved
- No maximum limit
- Will loop indefinitely until reviewer says "APPROVED"
- Use for critical code that must be perfect

## Usage Example

```typescript
import { runCodingTask } from '@/lib/services/coding-agent';

const result = await runCodingTask('Add dark mode toggle', {
  sandbox,
  projectId: 'abc123',
  workDir: '/home/user',
  model: 'claude',
  reviewMode: 'loop',  // Loop till perfect
  maxIterations: 15,
  onProgress: (msg) => console.log(msg),
});
```

## UI Integration TODO

To display this telemetry in the chat UI, create these components:

### `<AgentThinkingBlock>`
- Collapsible section showing reasoning
- Icon: Brain emoji 🧠
- Shows thinking content with syntax highlighting

### `<ToolUseBlock>`
- Expandable for each tool call
- Icon: Wrench 🔧
- Shows:
  - Tool name
  - Input parameters (formatted JSON)
  - Result (collapsible)
- Color-coded by tool type

### `<ReviewFeedbackBlock>`
- Shows each review iteration
- Icons:
  - ✅ Green checkmark if approved
  - ⚠️ Yellow warning if issues found
- Expandable to show full feedback
- Shows iteration count and retry status

### `<AgentIterationSummary>`
- Timeline view of all iterations
- Shows: Coding → Review → Fix → Review → Approved
- Clickable to jump to specific iteration details

## Chat Panel Integration

Update `src/features/workspace/chat-panel.tsx` to subscribe to new topics:

```typescript
subscribeToMessages(
  channel,
  [
    'messages',
    'status',
    'file-changes',
    'terminal',
    'agent-thinking',    // NEW
    'tool-use',          // NEW
    'tool-result',       // NEW
    'review-result',     // NEW
  ],
  (msg) => {
    // Handle each message type and render appropriate component
  }
);
```

## Benefits

1. **Full Transparency**: Users see exactly what the AI is doing
2. **Debugging**: Easy to identify where agent gets stuck
3. **Learning**: Users learn how AI thinks and solves problems
4. **Trust**: Seeing the review process builds confidence
5. **Control**: Users can see when to intervene or adjust settings

## File Locations

- Agent implementation: `src/lib/services/coding-agent.ts`
- Redis pub/sub: `src/lib/services/redis-realtime.ts`
- Chat UI: `src/features/workspace/chat-panel.tsx`
- Chat API route: `src/app/api/workspace/[projectId]/claude/chat/route.ts`
