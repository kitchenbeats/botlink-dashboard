# Conversations Feature - Simple Context Organization

## What We Built

Simple conversation threads for organizing chat by topic/feature. **NO branching, NO merging** - just clean organization.

## Database Changes

### New Table: `conversations`
```sql
conversations:
  - id (uuid)
  - project_id (FK to projects)
  - name (e.g., "Login Feature", "Dashboard Work")
  - description (optional)
  - first_commit_hash (git commit when started)
  - last_commit_hash (most recent git commit)
  - created_at
  - updated_at
```

### Updated Table: `messages`
```sql
messages:
  + conversation_id (FK to conversations) <- NEW!
```

### Migration
File: `supabase/migrations/20251027000000_add_conversations.sql`

**Migrates existing data:**
- Creates "Main" conversation for each project
- Links all existing messages to it
- Zero data loss

## Files Created

1. **`src/lib/db/conversations.ts`**
   - `createConversation()`
   - `listConversations()`
   - `listConversationsWithMessageCount()`
   - `updateConversation()`
   - `deleteConversation()`
   - `getOrCreateDefaultConversation()`

2. **`src/server/actions/conversations.ts`**
   - `createNewConversation` - Start new topic
   - `listProjectConversations` - Get all with message counts
   - `updateConversationMetadata` - Rename, update commit hashes
   - `deleteConversationAction` - Delete (prevents deleting last one)

## How It Works

### UI Flow (To Be Implemented)

**Chat Header:**
```
┌─────────────────────────────────────────┐
│ AI Assistant                            │
│ Conversation: Login Feature ▼  [+ New]  │
└─────────────────────────────────────────┘
```

**Dropdown Menu:**
```
📝 Conversations
  ✓ Login Feature (23 messages)      <- Current
    Dashboard Work (15 messages)
    Bug Fixes (8 messages)
  ───────────────────
  + New Conversation
```

### User Actions

**1. Switch Conversation**
- Click dropdown → select conversation
- Loads only messages for that conversation
- Shows git commits from that conversation's timeframe

**2. Create New Conversation**
- Click "+ New" button
- Modal: "Name your conversation"
- Creates new thread, switches to it
- Tracks first git commit hash

**3. Continue in Current**
- Just keep chatting
- All messages go to current conversation
- Last commit hash updates automatically

**4. Restore Code State**
- View conversation's git commits
- Click "Restore to [commit]"
- Checks out that commit
- Conversation context stays intact

## Next Steps (UI Integration)

### 1. Update `chat-panel.tsx`

Add state:
```typescript
const [conversations, setConversations] = useState([]);
const [currentConversation, setCurrentConversation] = useState(null);
const [showNewConvDialog, setShowNewConvDialog] = useState(false);
```

Load conversations:
```typescript
useEffect(() => {
  async function loadConversations() {
    const { listProjectConversations } = await import('@/server/actions/conversations');
    const result = await listProjectConversations({ projectId });
    if (result?.data?.conversations) {
      setConversations(result.data.conversations);
      setCurrentConversation(result.data.conversations[0]); // Most recent
    }
  }
  loadConversations();
}, [projectId]);
```

Filter messages:
```typescript
// Only show messages from current conversation
const filteredMessages = messages.filter(
  msg => msg.conversation_id === currentConversation?.id
);
```

### 2. Add Conversation Dropdown

In chat header:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    {currentConversation?.name} ({messages.length} messages) ▼
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {conversations.map(conv => (
      <DropdownMenuItem onClick={() => switchConversation(conv.id)}>
        {conv.name} ({conv.message_count} messages)
      </DropdownMenuItem>
    ))}
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => setShowNewConvDialog(true)}>
      + New Conversation
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 3. Update Message API

When sending messages:
```typescript
// Include conversation_id
await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    projectId,
    conversationId: currentConversation.id, // <- Add this
    message: input,
  }),
});
```

### 4. Track Git Commits

When agent completes task:
```typescript
// After successful AI response
if (commitHash) {
  await updateConversationMetadata({
    conversationId: currentConversation.id,
    lastCommitHash: commitHash,
  });
}
```

## Benefits

✅ **Organize by topic** - "Login", "Dashboard", "Refactor"
✅ **Context switching** - Jump between features
✅ **Clean history** - No clutter, just what you need
✅ **Code restoration** - "Go back to dashboard work state"
✅ **Simple** - No branching complexity

## What This ISN'T

❌ **NOT git branches** - Just chat organization
❌ **NOT mergeable** - Can't combine conversations
❌ **NOT parallel code states** - One codebase, multiple contexts
❌ **NOT version control** - Use git for that

## Migration Steps

⚠️ **IMPORTANT**: See `MIGRATION_DEPLOYMENT.md` for full deployment instructions!

**Quick summary:**

1. **Migration file already created:**
   ```
   ../e2b-infra/packages/db/migrations/20251027000000_add_conversations.sql
   ```

2. **Build db-migrator image:**
   ```bash
   cd ../e2b-infra/packages/db
   make build-and-upload
   ```

3. **Deploy API job:**
   ```bash
   cd ../e2b-infra/iac/provider-gcp
   export ENV=prod
   make deploy-api
   ```

4. **Verify:**
   - Check `_migrations` table has version 20251027000000
   - Check conversations table exists
   - Check messages have conversation_id
   - Check "Main" conversation created for existing projects

5. **Update chat UI** (see Next Steps above)

6. **Regenerate types:**
   ```bash
   cd botlink-dashboard
   bun generate:supabase
   ```

## Future Enhancements (Optional)

- Archive old conversations
- Export conversation as markdown
- Search across all conversations
- Conversation templates ("Bug Fix", "Feature", etc.)
- Show git diff between first/last commit of conversation
