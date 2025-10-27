/**
 * Admin authentication helper
 * Checks if a user is an admin based on ADMIN_EMAILS env var
 */

/**
 * Check if a user email or ID is in the admin list
 * Set ADMIN_EMAILS environment variable as comma-separated list:
 * ADMIN_EMAILS=user@example.com,another@example.com,user-id-123
 */
export function isAdmin(userEmailOrId: string | undefined): boolean {
  if (!userEmailOrId) return false;

  const adminList = process.env.ADMIN_EMAILS?.split(',').map(s => s.trim()) || [];

  return adminList.includes(userEmailOrId);
}

/**
 * Get admin emails from environment
 */
export function getAdminEmails(): string[] {
  return process.env.ADMIN_EMAILS?.split(',').map(s => s.trim()) || [];
}
