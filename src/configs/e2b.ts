/**
 * E2B Configuration
 *
 * Centralized configuration for E2B sandbox settings.
 * Update these values to change behavior across the entire application.
 */

/**
 * Sandbox Timeout Configuration
 *
 * SANDBOX_TIMEOUT_MS: Time before sandbox auto-kills after inactivity
 * - Set to 10 minutes (600000ms) for cost savings with snapshots
 * - Snapshots allow instant resume, so shorter timeout = lower costs
 * - Extended automatically on user activity (file edits, chat messages, etc.)
 */
export const SANDBOX_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Workspace Initialization Lock
 *
 * WORKSPACE_INIT_LOCK_TIMEOUT: How long to hold initialization lock
 * - Prevents race conditions when multiple requests initialize same workspace
 * - 120 seconds should be enough for git init + dev server start
 */
export const WORKSPACE_INIT_LOCK_TIMEOUT = 120; // seconds

/**
 * Workspace Ready Flag TTL
 *
 * WORKSPACE_READY_TTL: How long to cache "workspace is ready" flag in Redis
 * - 2 hours allows workspace to be considered ready without re-checking
 * - If expired, workspace will be re-initialized (harmless, just slower)
 */
export const WORKSPACE_READY_TTL = 7200; // seconds (2 hours)

/**
 * Sandbox Expiration
 *
 * SANDBOX_EXPIRATION_HOURS: Database record expiration time
 * - 24 hours: Sandbox sessions are marked as expired after this time
 * - Used for cleanup and tracking purposes only
 * - Actual VM timeout is controlled by SANDBOX_TIMEOUT_MS
 */
export const SANDBOX_EXPIRATION_HOURS = 24;

/**
 * Snapshot Configuration
 *
 * ENABLE_AUTO_SNAPSHOT: Enable automatic snapshot on workspace close
 * - true: Pause sandbox and create snapshot when user closes workspace
 * - false: Just kill sandbox without saving state
 */
export const ENABLE_AUTO_SNAPSHOT = true;

/**
 * ENABLE_AUTO_RESTORE: Enable automatic restore from snapshot on workspace open
 * - true: Resume from latest snapshot if available
 * - false: Always create fresh sandbox from template
 */
export const ENABLE_AUTO_RESTORE = true;

/**
 * Snapshot Change Detection
 *
 * SKIP_SNAPSHOT_IF_NO_CHANGES: Check for uncommitted changes before snapshotting
 * - true: Only create snapshot if git shows uncommitted changes
 * - false: Always create snapshot regardless of changes
 */
export const SKIP_SNAPSHOT_IF_NO_CHANGES = true;

/**
 * E2B API Configuration
 *
 * These are typically set via environment variables but can be overridden here.
 */
export const E2B_DOMAIN = process.env.E2B_DOMAIN; // e.g., "ledgai.com"
export const E2B_API_URL = process.env.INFRA_API_URL || `https://api.${E2B_DOMAIN}`;

/**
 * Dev Server Configuration
 *
 * Port numbers and startup timeouts for different template types
 */
export const DEV_SERVER_PORT = 3000;
export const DEV_SERVER_STARTUP_TIMEOUT_MS = {
  simple_site: 10000,    // 10 seconds for static HTTP server
  nextjs: 20000,         // 20 seconds for Next.js dev server
  nextjs_saas: 20000,    // 20 seconds for Next.js SaaS template
} as const;

/**
 * Helper function to get timeout in seconds (for E2B API)
 */
export function getSandboxTimeoutSeconds(): number {
  return Math.floor(SANDBOX_TIMEOUT_MS / 1000);
}

/**
 * Helper function to get sandbox expiration date
 */
export function getSandboxExpirationDate(): string {
  return new Date(Date.now() + SANDBOX_EXPIRATION_HOURS * 60 * 60 * 1000).toISOString();
}

/**
 * Configuration summary for logging
 */
export function logE2BConfig() {
  console.log('[E2B Config] Sandbox timeout:', SANDBOX_TIMEOUT_MS / 1000, 'seconds');
  console.log('[E2B Config] Workspace ready TTL:', WORKSPACE_READY_TTL, 'seconds');
  console.log('[E2B Config] Auto-snapshot enabled:', ENABLE_AUTO_SNAPSHOT);
  console.log('[E2B Config] Auto-restore enabled:', ENABLE_AUTO_RESTORE);
  console.log('[E2B Config] Skip snapshot if no changes:', SKIP_SNAPSHOT_IF_NO_CHANGES);
  console.log('[E2B Config] E2B domain:', E2B_DOMAIN);
}
