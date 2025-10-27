# GitHub Integration - Automatic & Invisible Backup

## Overview

GitHub integration is **completely automatic and invisible** to users. The system handles both Git commits (for version control) and GitHub backups (for remote storage) without any user interaction required.

## Key Features

### 1. **Snapshots = Ephemeral State** ✓
- Snapshots only created on **manual save** or **workspace close**
- Used for quick recovery, not version control
- Automatically cleaned up (only latest kept)

### 2. **Git = Real Version Control** ✓
- **Automatic commits** after every AI action
- **Automatic commits** on manual file saves
- Full git history accessible via "History" dropdown
- Time travel to any previous commit

### 3. **GitHub = Invisible Backup** (NEW!)
- **Lazy repo creation** - only creates on first AI commit
- **Auto-push** - pushes after every commit automatically
- **No UI** - completely invisible to user
- **Cleanup** - deletes repo when project is deleted

## User Experience Flow

### What Users See

**Nothing!** GitHub backup is completely invisible:

1. **Create project** → No repo created yet (avoid unused repos)
2. **First AI task completed** → Repo created + first push (silent)
3. **Subsequent AI edits** → Auto-commit + auto-push (silent)
4. **Manual file saves** → Auto-commit + auto-push (silent)
5. **Delete project** → Repo deleted automatically (silent)

### What Users DO See

**Version Control (Git History):**
- **"History" dropdown** - see all commits, time-travel to any version
- **"Save Snapshot" button** - manual checkpoint for recovery
- No mention of "GitHub" anywhere in workspace UI

## Technical Implementation

### Git Service (`src/lib/services/git-service.ts`)

**Auto GitHub Backup Logic:**
- `commitAgentChanges()` - accepts optional `projectId` and `teamId`
- If provided, triggers `autoGitHubBackup()` after commit
- First commit: Creates repo, pushes code
- Subsequent commits: Just pushes
- Errors logged but don't fail the commit (non-critical)

### Server Actions Updates

**`src/server/actions/workspace.ts`:**
- `executeSimpleAgent()` - passes `projectId`/`teamId` to git commit
- `writeFileContent()` - passes `projectId`/`teamId` to git commit

**`src/server/actions/projects.ts`:**
- `createNewProject()` - removed early repo creation
- `deleteProjectAction()` - calls `GitService.deleteGitHubRepo()`

### UI Updates (`src/features/workspace/workspace-header.tsx`)

- **No GitHub UI** - banner and buttons removed
- **Keeps**: History dropdown, Save Snapshot button
- **Focus**: Version control features, not backup features

### Database

Projects table already has:
- `github_repo_url`: Stores GitHub repository URL
- `last_commit_hash`: Tracks latest synced commit
- `settings`: JSONB field for future preferences (auto-push, etc.)

## Environment Variables Required

```bash
GITHUB_TOKEN=ghp_xxx        # GitHub personal access token
GITHUB_ORG=your-org         # GitHub organization name
GITHUB_PREFIX=bl-           # Prefix for repo names (e.g., bl-project-id)
```

## User Benefits

### For Everyone
- ✅ **Zero mental overhead** - no decisions to make
- ✅ **Automatic protection** - never lose work
- ✅ **Version control** - see history, time-travel
- ✅ **No clutter** - simple, clean UI

### For Advanced Users (Coming Soon)
- 🔜 **OAuth integration** - connect personal GitHub account
- 🔜 **Repo ownership** - repos in your account, not org
- 🔜 **Settings page** - configure auto-push behavior
- ✅ **Full git history** - already accessible via dropdown

## Future Enhancements (Phase 2)

**GitHub OAuth Integration:**
1. **Settings page** - "Connect Your GitHub" button
2. **OAuth flow** - authorize ReactWrite app
3. **Repo transfer** - migrate from org to user account
4. **Auto-push toggle** - optional manual control
5. **Branch support** - create feature branches
6. **Collaboration** - invite team members to repos
7. **GitHub Actions** - auto-deploy on push

## Philosophy

**"The best UX is invisible"**

- Users don't think about backups - they just work
- Version control is visible (History dropdown)
- Remote backups are invisible (GitHub)
- No cognitive load - zero decisions
- Safe by default - can't lose work

## Testing

To test the automatic GitHub backup:

1. **Set environment variables:**
   ```bash
   GITHUB_TOKEN=ghp_xxx
   GITHUB_ORG=your-org
   GITHUB_PREFIX=bl-
   ```

2. **Create a project** - no repo created yet

3. **Complete first AI task** - check logs for:
   ```
   [Git] First commit detected - creating GitHub repo...
   [Git] GitHub repo created: https://github.com/org/bl-{projectId}
   [Git] ✓ Pushed to GitHub successfully
   ```

4. **Make more changes** - check logs for:
   ```
   [Git] Pushing to GitHub...
   [Git] ✓ Pushed to GitHub successfully
   ```

5. **Check GitHub org** - verify repo exists with commits

6. **Delete project** - verify repo is deleted from GitHub
