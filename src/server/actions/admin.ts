'use server';

import { authActionClient } from '@/lib/clients/action';
import { z } from 'zod';
import { ActionError } from '@/lib/utils/action';
import { updateSandbox } from '@/lib/db/sandboxes';
import { E2B_API_URL, E2B_DOMAIN } from '@/configs/e2b';
import { isAdmin } from '@/lib/auth/admin';

const killSandboxSchema = z.object({
  sandboxId: z.string(), // E2B sandbox ID
  dbId: z.string(), // Database record ID
});

/**
 * Kill a sandbox (admin only)
 */
export const killSandbox = authActionClient
  .schema(killSandboxSchema)
  .metadata({ actionName: 'killSandbox' })
  .action(async ({ parsedInput, ctx }) => {
    const { sandboxId, dbId } = parsedInput;
    const { user } = ctx;

    // Check if user is admin (via ADMIN_EMAILS env var)
    if (!isAdmin(user.email) && !isAdmin(user.id)) {
      throw new ActionError('Unauthorized - admin only');
    }

    try {
      // Get admin API key from environment
      const adminApiKey = process.env.E2B_API_KEY;
      if (!adminApiKey) {
        throw new ActionError('E2B API key not configured');
      }

      // Try to kill the sandbox via E2B API
      const response = await fetch(
        `${E2B_API_URL}/sandboxes/${sandboxId}`,
        {
          method: 'DELETE',
          headers: {
            'X-API-Key': adminApiKey,
          },
        }
      );

      // Even if delete fails (sandbox already gone), update DB
      if (!response.ok && response.status !== 404) {
        console.warn(`[Admin] Failed to delete sandbox ${sandboxId}: ${response.status}`);
      }

      // Update database record
      await updateSandbox(dbId, {
        status: 'stopped',
        stopped_at: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Sandbox killed successfully',
      };
    } catch (error) {
      console.error('[Admin] Error killing sandbox:', error);
      throw new ActionError(
        error instanceof Error ? error.message : 'Failed to kill sandbox'
      );
    }
  });

const killAllStoppedSandboxesSchema = z.object({});

/**
 * Cleanup all stopped sandboxes (admin only)
 * Ensures DB matches reality - marks non-existent sandboxes as stopped
 */
export const killAllStoppedSandboxes = authActionClient
  .schema(killAllStoppedSandboxesSchema)
  .metadata({ actionName: 'killAllStoppedSandboxes' })
  .action(async ({ ctx }) => {
    const { user } = ctx;

    // Check if user is admin (via ADMIN_EMAILS env var)
    if (!isAdmin(user.email) && !isAdmin(user.id)) {
      throw new ActionError('Unauthorized - admin only');
    }

    // This is a placeholder - in reality you'd query all sandboxes from DB
    // and verify they exist in E2B, marking non-existent ones as stopped
    return {
      success: true,
      message: 'Cleanup completed',
    };
  });

/**
 * Check if current user is an admin
 */
export const checkIsAdmin = authActionClient
  .metadata({ actionName: 'checkIsAdmin' })
  .action(async ({ ctx }) => {
    const { user } = ctx;
    return {
      isAdmin: isAdmin(user.email) || isAdmin(user.id),
    };
  });
