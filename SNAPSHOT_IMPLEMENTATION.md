# E2B Runtime Snapshot Implementation Guide

## Two Types of Snapshots in E2B

### 1. Template Snapshots (✅ Already Implemented)
**Purpose**: Fast sandbox creation from pre-built templates

**How it works:**
```
e2b template build → Creates template with snapshot → Stored as template
User creates project → Sandbox.create(template) → Restores from template snapshot
```

**What it provides:**
- Pre-installed dependencies (Node.js, npm packages, etc.)
- Template files ready at `/templates/{name}/`
- Fast boot time (~200-500ms)

### 2. Runtime Snapshots (🚧 Ready to Implement)
**Purpose**: Save and restore a specific sandbox's running state

**How it works:**
```
User working in sandbox → sandbox.takeSnapshot() → Creates runtime snapshot
User returns later → Sandbox.create({ snapshotId }) → Restores from runtime snapshot
```

**What it provides:**
- Preserve user's file changes
- Keep running processes (dev server still running!)
- Resume exactly where user left off
- No need to reinstall or restart

---

## Implementation Steps

### Step 1: Add Database Table for Runtime Snapshots

Create migration: `src/lib/db/migrations/YYYYMMDD_add_project_snapshots.sql`

```sql
-- Table for storing project runtime snapshots
CREATE TABLE IF NOT EXISTS project_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  snapshot_id TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  file_count INTEGER,
  size_mb INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for fast project lookups
CREATE INDEX idx_project_snapshots_project_id ON project_snapshots(project_id);
CREATE INDEX idx_project_snapshots_created_at ON project_snapshots(created_at DESC);

-- RLS policies
ALTER TABLE project_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view snapshots for their team's projects"
  ON project_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_snapshots.project_id
      AND p.team_id IN (
        SELECT team_id FROM users_teams WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create snapshots for their team's projects"
  ON project_snapshots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_snapshots.project_id
      AND p.team_id IN (
        SELECT 1 FROM users_teams WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete snapshots for their team's projects"
  ON project_snapshots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_snapshots.project_id
      AND p.team_id IN (
        SELECT 1 FROM users_teams WHERE user_id = auth.uid()
      )
    )
  );
```

### Step 2: Add Snapshot Database Module

Create: `src/lib/db/snapshots.ts`

```typescript
import { getDb, handleDbError } from './index';

export async function createProjectSnapshot(data: {
  project_id: string;
  snapshot_id: string;
  description?: string;
  file_count?: number;
  size_mb?: number;
}) {
  return handleDbError(async () => {
    const db = await getDb();
    const { data: snapshot, error } = await db
      .from('project_snapshots')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return snapshot;
  }, 'createProjectSnapshot');
}

export async function getProjectSnapshots(projectId: string) {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('project_snapshots')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }, 'getProjectSnapshots');
}

export async function getLatestSnapshot(projectId: string) {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('project_snapshots')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }, 'getLatestSnapshot');
}

export async function deleteProjectSnapshot(snapshotId: string) {
  return handleDbError(async () => {
    const db = await getDb();
    const { error } = await db
      .from('project_snapshots')
      .delete()
      .eq('snapshot_id', snapshotId);

    if (error) throw error;
  }, 'deleteProjectSnapshot');
}
```

### Step 3: Update E2B Service to Support Snapshots

Add to `src/lib/services/e2b-service.ts`:

```typescript
import { SnapshotService } from './snapshot-service';

export class E2BService {
  // ... existing methods ...

  /**
   * Create sandbox from latest snapshot if available, otherwise from template
   */
  static async getOrCreateSandboxWithSnapshot(projectId: string, supabase: any) {
    const project = await getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const teamApiKey = await TeamApiKeyService.getTeamApiKey(project.team_id, supabase);

    // Check for latest snapshot
    const latestSnapshot = await SnapshotService.getLatestSnapshot(projectId);

    if (latestSnapshot) {
      console.log('[E2B] Restoring from snapshot:', latestSnapshot.snapshot_id);
      try {
        const sandbox = await SnapshotService.restoreFromSnapshot(
          latestSnapshot.snapshot_id,
          teamApiKey
        );

        // Save to database
        const sandboxData = {
          project_id: projectId,
          e2b_session_id: sandbox.sandboxId,
          template: project.template,
          status: 'ready',
          url: null,
          metadata: { restored_from_snapshot: latestSnapshot.snapshot_id },
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        const session = await createSandbox(sandboxData);

        return { sandbox, session, restoredFromSnapshot: true };
      } catch (error) {
        console.error('[E2B] Failed to restore from snapshot, falling back to template:', error);
        // Fall through to template creation
      }
    }

    // No snapshot or restore failed - create from template
    return this._createSandbox(projectId, project, teamApiKey);
  }

  /**
   * Save sandbox state before shutdown
   */
  static async saveAndStopSandbox(sandbox: Sandbox, projectId: string, sessionId: string) {
    try {
      // Auto-save snapshot
      const snapshotId = await SnapshotService.autoSave(sandbox, projectId);

      if (snapshotId) {
        console.log('[E2B] Saved snapshot before shutdown:', snapshotId);
      }

      // Kill sandbox
      await sandbox.kill();
      await updateSandbox(sessionId, {
        status: 'removed',
        stopped_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[E2B] Error during save and stop:', error);
      throw error;
    }
  }
}
```

### Step 4: Add Server Actions for Snapshot Management

Create: `src/server/actions/snapshots.ts`

```typescript
'use server';

import { authActionClient } from '@/lib/clients/action';
import { SnapshotService } from '@/lib/services/snapshot-service';
import { E2BService } from '@/lib/services/e2b-service';
import { getProject } from '@/lib/db/projects';
import { z } from 'zod';

const createSnapshotSchema = z.object({
  projectId: z.string().uuid(),
  description: z.string().optional(),
});

export const createProjectSnapshot = authActionClient
  .schema(createSnapshotSchema)
  .metadata({ actionName: 'createProjectSnapshot' })
  .action(async ({ parsedInput, ctx }) => {
    const { projectId, description } = parsedInput;
    const { supabase } = ctx;

    // Get active sandbox
    const { sandbox } = await E2BService.getOrCreateSandbox(projectId, supabase);

    // Create snapshot
    const snapshotId = await SnapshotService.createSnapshot(
      sandbox,
      projectId,
      description
    );

    return { snapshotId };
  });

const restoreSnapshotSchema = z.object({
  snapshotId: z.string(),
  projectId: z.string().uuid(),
});

export const restoreFromSnapshot = authActionClient
  .schema(restoreSnapshotSchema)
  .metadata({ actionName: 'restoreFromSnapshot' })
  .action(async ({ parsedInput, ctx }) => {
    const { snapshotId, projectId } = parsedInput;
    const { supabase } = ctx;

    const project = await getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const teamApiKey = await TeamApiKeyService.getTeamApiKey(project.team_id, supabase);

    // Restore sandbox from snapshot
    const sandbox = await SnapshotService.restoreFromSnapshot(snapshotId, teamApiKey);

    return { sandboxId: sandbox.sandboxId };
  });

export const listProjectSnapshots = authActionClient
  .schema(z.object({ projectId: z.string().uuid() }))
  .metadata({ actionName: 'listProjectSnapshots' })
  .action(async ({ parsedInput }) => {
    const { projectId } = parsedInput;
    const snapshots = await SnapshotService.getProjectSnapshots(projectId);
    return { snapshots };
  });
```

### Step 5: Add UI Components for Snapshot Management

Add snapshot controls to workspace UI:

```typescript
// In workspace header or sidebar
<Button onClick={() => createProjectSnapshot({ projectId })}>
  Save Snapshot
</Button>

<DropdownMenu>
  <DropdownMenuTrigger>Load Snapshot</DropdownMenuTrigger>
  <DropdownMenuContent>
    {snapshots.map((snapshot) => (
      <DropdownMenuItem
        key={snapshot.id}
        onClick={() => restoreFromSnapshot({ snapshotId: snapshot.snapshot_id, projectId })}
      >
        {snapshot.description} - {new Date(snapshot.created_at).toLocaleString()}
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Usage Scenarios

### Scenario 1: User Closes Workspace

```typescript
// In workspace cleanup/beforeunload handler
await E2BService.saveAndStopSandbox(sandbox, projectId, sessionId);
// Snapshot is auto-saved, user can resume later
```

### Scenario 2: User Returns to Project

```typescript
// When opening workspace
const { sandbox, restoredFromSnapshot } = await E2BService.getOrCreateSandboxWithSnapshot(projectId);

if (restoredFromSnapshot) {
  toast.success('Restored from your last session!');
}
```

### Scenario 3: Manual Snapshot Save

```typescript
// User clicks "Save Snapshot" button
await createProjectSnapshot({
  projectId,
  description: 'Before major refactor',
});
```

---

## Important Notes

### E2B SDK Version Requirements

Runtime snapshots require E2B SDK v0.17.0+. Check current version:

```bash
npm list e2b
```

Update if needed:

```bash
npm install e2b@latest
```

### Snapshot Lifecycle

- Snapshots persist in E2B infrastructure until explicitly deleted
- You should implement cleanup for old snapshots (e.g., keep last 10)
- Snapshots count against storage quota

### Cost Considerations

- **Template snapshots**: Free, included in template
- **Runtime snapshots**: May incur storage costs depending on E2B pricing
- Check E2B dashboard for snapshot storage usage

---

## Summary

**Template Snapshots (Already Working)**:
- Created once during template build
- Used every time a new sandbox starts
- Fast boot times for all users

**Runtime Snapshots (This Implementation)**:
- Created during user's work session
- Saves user's specific changes and state
- Allows resume exactly where left off
- Requires database table + new API calls

Both work together:
1. User creates project → Boots from **template snapshot** (fast!)
2. User makes changes → Saves **runtime snapshot** when done
3. User returns → Restores from **runtime snapshot** (exact state!)
