# Migration Deployment Process

## ⚠️ IMPORTANT: Migrations are NOT in this repo!

Migrations are managed in the **e2b-infra** repo and deployed via the API job's pre-task.

## Migration Location

**CORRECT:**
```
../e2b-infra/packages/db/migrations/
  ├─ 20251027000000_add_conversations.sql  ← NEW MIGRATION HERE
  ├─ 20250708135400_snapshots_migrations.sql
  └─ ... (other migrations)
```

**WRONG:**
```
❌ ./supabase/migrations/  ← NOT HERE (this is just for local dev)
❌ ./migrations/           ← NOT HERE (empty folder)
```

## How Migrations Work

### Architecture

1. **Migrations stored in**: `e2b-infra/packages/db/migrations/`
2. **Migration tool**: Goose (Go-based migration tool)
3. **Deployment**: Docker image `e2b-orchestration/db-migrator`
4. **Execution**: API job pre-task runs migrations before API starts

### API Job Configuration

The API job (`iac/provider-gcp/nomad/jobs/api.hcl`) has two tasks:

```hcl
task "db-migrator" {
  driver = "docker"

  config {
    image = "${db_migrator_docker_image}"
  }

  lifecycle {
    hook = "prestart"  ← Runs BEFORE API starts
  }
}

task "start" {
  # API server starts after migrations complete
}
```

## Deployment Steps

### 1. Add Migration to e2b-infra

```bash
cd ../e2b-infra/packages/db
```

**Option A: Create via script**
```bash
make create-migration NAME=add_conversations
```

**Option B: Create manually**
```bash
# Create file: migrations/20251027000000_add_conversations.sql
# (already done for you!)
```

### 2. Build and Upload Migration Docker Image

```bash
cd ../e2b-infra/packages/db

# Build and push to GCP Artifact Registry
make build-and-upload
```

This will:
- Build Docker image with latest migrations
- Push to: `{GCP_REGION}-docker.pkg.dev/{GCP_PROJECT_ID}/e2b-orchestration/db-migrator`

### 3. Deploy API Job

```bash
cd ../e2b-infra/iac/provider-gcp

# Set environment
export ENV=prod  # or staging, dev, etc.

# Deploy with new migrator image
make deploy-api
```

Or use the full deployment:
```bash
cd ../e2b-infra

# Plan changes
make plan

# Apply (will rebuild and deploy)
make apply
```

### 4. Verify Migration

Check that migration ran successfully:

```bash
# Connect to production database
cd ../e2b-infra
make migrate/status  # Shows applied migrations

# Or check directly in database
PGPASSWORD="xxx" psql "postgresql://..." -c "SELECT * FROM _migrations ORDER BY version_id DESC LIMIT 10;"
```

Should see:
```
 version_id  |  is_applied  | tstamp
-------------+--------------+---------------------
 20251027000000 | t       | 2025-10-27 12:00:00
```

## Testing Migrations Locally

### Option 1: Apply to Local Supabase

If you have Supabase running locally:

```bash
# In botlink-dashboard repo
bunx supabase db reset  # Reset to clean state
bunx supabase migration up  # Apply all migrations
```

### Option 2: Test with Goose Directly

```bash
cd ../e2b-infra/packages/db

# Set connection string
export POSTGRES_CONNECTION_STRING="postgresql://..."

# Run migrations
make migrate
```

### Option 3: Test in Staging

Deploy to staging environment first:

```bash
cd ../e2b-infra
export ENV=staging
make deploy-api
```

## Common Issues

### Migration Fails

**Symptom**: API job fails to start, stuck in "pending" state

**Check logs:**
```bash
cd ../e2b-infra
nomad job logs -task db-migrator api
```

**Common causes:**
- SQL syntax error
- Missing table/column
- RLS policy conflict
- Foreign key violation

**Fix:**
1. Create rollback migration
2. Fix forward migration
3. Rebuild and redeploy

### Docker Image Not Updated

**Symptom**: Migration doesn't run even after deployment

**Check:**
```bash
# Verify image was pushed
gcloud artifacts docker images list \
  {GCP_REGION}-docker.pkg.dev/{GCP_PROJECT_ID}/e2b-orchestration/db-migrator
```

**Fix:**
```bash
cd ../e2b-infra/packages/db
make build-and-upload  # Force rebuild
```

### Migration Already Applied

**Symptom**: Migration shows as already applied but changes aren't in DB

**This is rare** - Goose tracks migrations in `_migrations` table

**Check:**
```sql
SELECT * FROM _migrations WHERE version_id = 20251027000000;
```

**Fix:**
- Manually revert if needed
- Create new migration with different timestamp

## Files Modified for Conversations Feature

### e2b-infra (Migration)
- `packages/db/migrations/20251027000000_add_conversations.sql`

### botlink-dashboard (App Code)
- `src/lib/db/conversations.ts` (DB functions)
- `src/server/actions/conversations.ts` (Server actions)
- `src/types/database.types.ts` (will need regeneration)

## Type Generation After Migration

After migration is applied, regenerate types:

```bash
cd botlink-dashboard
bun generate:supabase
```

This updates `src/types/database.types.ts` with new `conversations` table.

## Rollback Process

If you need to rollback:

```bash
cd ../e2b-infra/packages/db

# Rollback one migration
make migrate/down

# Or create a rollback migration
make create-migration NAME=rollback_conversations
# Then add DROP TABLE, ALTER TABLE DROP COLUMN, etc.
```

## Summary

✅ **Migration file**: `../e2b-infra/packages/db/migrations/20251027000000_add_conversations.sql`
✅ **Build command**: `cd ../e2b-infra/packages/db && make build-and-upload`
✅ **Deploy command**: `cd ../e2b-infra/iac/provider-gcp && make deploy-api`
✅ **Verify**: Check `_migrations` table and test conversation features

**The migration is ready - just needs to be built and deployed via e2b-infra!**
