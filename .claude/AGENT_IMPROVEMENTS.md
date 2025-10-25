# Agent Framework Improvements

## Summary

Successfully migrated from OAuth-token-in-sandbox approach to Inngest-based server-side agent framework with significant quality improvements.

## Key Changes

### 1. **Claude Chat API Migrated to Inngest** (`src/app/api/workspace/[projectId]/claude/chat/route.ts`)

**Before:**
- Ran `claude-chat.js` script inside E2B sandbox
- Used OAuth tokens from `/login` (which don't work with Anthropic API)
- Streamed NDJSON responses

**After:**
- Triggers Inngest `workspace/agent/run` event
- AI runs server-side with application's API key
- Streams SSE (Server-Sent Events) via Redis pub/sub
- Real-time updates on `messages`, `status`, `file-changes`, `terminal` topics

### 2. **Upgraded to Claude Haiku 4.5** (`src/lib/services/coding-agent.ts:117`)

```typescript
model: 'claude-haiku-4-5'  // 73.3% SWE-bench, 2x faster, 1/3 cost
```

Performance improvements:
- **Speed**: 2x faster than previous model
- **Cost**: 1/3 the price
- **Quality**: 73.3% SWE-bench score (near Sonnet-level)

### 3. **Added Self-Review Loop** (`src/lib/services/coding-agent.ts:330-449`)

New `createReviewAgent()` function that:
- Reviews all code changes after coding agent completes
- Checks for: code quality, best practices, completeness, testing needs
- Provides feedback: "APPROVED" or "ISSUES FOUND: [details]"
- Triggers up to 2 fix iterations if issues found
- Skips review for pure conversation (no code changes)

```typescript
// Review loop in runCodingTask()
while (reviewAttempts < maxReviewAttempts) {
  // Run coding agent
  const result = await network.run(currentPrompt);

  // Review the work
  const reviewer = await createReviewAgent(config);
  const reviewResult = await reviewNetwork.run(...);

  if (reviewOutput.includes('APPROVED')) break;

  // Fix issues and retry
  currentPrompt = `Fix these issues: ${reviewOutput}`;
}
```

### 4. **Project Context System** (`src/lib/services/project-context.ts`)

New service that generates comprehensive project awareness:

**Generated Context:**
- File tree (via `tree -L 3` or `find`)
- `package.json` metadata (dependencies, scripts)
- README content
- Structured summary

**Storage:**
- Cached in `.claude/project-context.md` in sandbox
- Automatically injected into every agent call
- Can force regeneration with `forceRegenerate: true`

**Integration in coding agent:**
```typescript
const projectContext = await getOrGenerateContext(sandbox, workDir);

system: `You are a coding agent...

<project_context>
${projectContext}
</project_context>
...`
```

### 5. **Completion Signaling** (`src/lib/inngest/functions.ts:89-107`)

Added Redis message publication for SSE stream closure:

```typescript
await publishWorkspaceMessage(projectId, 'messages', {
  message: result.output,
  complete: true,  // Signal to close SSE stream
  timestamp: Date.now(),
});
```

## Architecture Flow

```
┌─────────────┐
│ User sends  │
│ message     │
└──────┬──────┘
       │
       ▼
┌────────────────────────────────────────────┐
│ /api/workspace/[projectId]/claude/chat     │
│                                            │
│ 1. Save user message to DB                 │
│ 2. Trigger Inngest event                   │
│ 3. Subscribe to Redis pub/sub              │
│ 4. Stream SSE to client                    │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Inngest: workspace/agent/run               │
│                                            │
│ 1. Get/create sandbox                      │
│ 2. Load project context                    │
│ 3. Run coding agent (Haiku 4.5)           │
│    ├─ Execute tools (terminal, files)     │
│    └─ Publish progress to Redis           │
│ 4. Run review agent                        │
│ 5. Fix issues if needed (up to 2x)        │
│ 6. Save assistant message                  │
│ 7. Publish completion to Redis             │
└────────────────────────────────────────────┘
```

## Benefits

1. **No More OAuth Issues**: Server-side AI uses application API key
2. **Better Quality**: Review loop catches errors before sending to user
3. **Cost Savings**: Haiku 4.5 is 1/3 the cost with similar quality
4. **Faster Responses**: 2x speed improvement from Haiku 4.5
5. **Context Awareness**: Agent knows full project structure
6. **Real-time Updates**: SSE streaming with Redis pub/sub
7. **Easier Debugging**: All AI logs in server, not sandbox

## Files Changed

- ✅ `src/app/api/workspace/[projectId]/claude/chat/route.ts` - Migrated to Inngest
- ✅ `src/lib/services/coding-agent.ts` - Added review loop, Haiku 4.5, project context
- ✅ `src/lib/services/project-context.ts` - New context generation service
- ✅ `src/lib/inngest/functions.ts` - Added completion signaling
- ✅ `.mcp.json` - Added E2B MCP server configuration

## Obsolete Files

These files are no longer needed (but kept in templates for now):
- `e2b-templates/*/configs/claude-chat.js` - Replaced by server-side agent
- `e2b-templates/*/configs/claude-setup-pty.js` - No longer using PTY approach
- `e2b-templates/*/configs/claude-pty-manager.js` - No longer using PTY approach
- `e2b-templates/*/configs/ecosystem.config.js` - PM2 no longer needed

## Testing

To test the new system:

```bash
# 1. Start Inngest dev server
npx inngest-cli@latest dev

# 2. Start Next.js
bun dev

# 3. Open workspace and send a message
# - Should see SSE stream with real-time updates
# - Agent should have full project context
# - Review loop should run after code changes
```

## Future Improvements

- [ ] Add conversation history/memory to coding agent
- [ ] Implement tool call streaming visualization
- [ ] Add metrics tracking (review iterations, approval rate, etc.)
- [ ] Create UI for forcing project context regeneration
- [ ] Add support for custom review criteria per project
