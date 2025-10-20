# E2B Configuration Guide

## Quick Reference

**All E2B settings are in one file:** `/src/configs/e2b.ts`

## Settings Overview

### Timeouts ⏱️

| Setting | Default | What it does |
|---------|---------|--------------|
| `SANDBOX_TIMEOUT_MS` | 10 min | Auto-kill sandbox after inactivity |
| `WORKSPACE_INIT_LOCK_TIMEOUT` | 120 sec | Lock timeout for workspace init |
| `WORKSPACE_READY_TTL` | 2 hours | Cache "workspace ready" flag |
| `SANDBOX_EXPIRATION_HOURS` | 24 hours | Database record expiration |

### Snapshots 📸

| Setting | Default | What it does |
|---------|---------|--------------|
| `ENABLE_AUTO_SNAPSHOT` | true | Auto-save on workspace close |
| `ENABLE_AUTO_RESTORE` | true | Auto-restore from snapshot on open |
| `SKIP_SNAPSHOT_IF_NO_CHANGES` | true | Only snapshot if git has changes |

### API 🌐

| Setting | Default | What it does |
|---------|---------|--------------|
| `E2B_DOMAIN` | env var | Your E2B domain (e.g., ledgai.com) |
| `E2B_API_URL` | auto | API endpoint (auto-generated) |
| `DEV_SERVER_PORT` | 3000 | Port for dev servers |

## How to Change Settings

**Edit one file:** `/src/configs/e2b.ts`

```typescript
// Change sandbox timeout from 10 min to 5 min
export const SANDBOX_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Disable auto-snapshot (not recommended for cost savings)
export const ENABLE_AUTO_SNAPSHOT = false;

// Always snapshot (even without git changes)
export const SKIP_SNAPSHOT_IF_NO_CHANGES = false;
```

## Cost Optimization Tips 💰

**Current settings save ~67% on idle compute costs:**
- 10 min timeout (was 30 min)
- Auto-pause on workspace close (saves state + kills VM)
- Auto-restore from snapshot (instant resume)

**To save even more:**
```typescript
// Reduce timeout to 5 minutes
export const SANDBOX_TIMEOUT_MS = 5 * 60 * 1000;

// Skip snapshots if no changes (already enabled)
export const SKIP_SNAPSHOT_IF_NO_CHANGES = true;
```

## Files That Use This Config

✅ Already updated to use centralized config:
- `/src/lib/services/e2b-service.ts` - Sandbox management
- `/src/lib/services/snapshot-service.ts` - Snapshot operations
- `/src/server/actions/workspace.ts` - Workspace initialization

## Testing Configuration

Add to your code to log current settings:
```typescript
import { logE2BConfig } from '@/configs/e2b';

logE2BConfig(); // Logs all settings to console
```

## Environment Variables

Some settings use environment variables (set in `.env`):
```bash
E2B_DOMAIN=ledgai.com
INFRA_API_URL=https://api.ledgai.com
```

The config file automatically reads these.
