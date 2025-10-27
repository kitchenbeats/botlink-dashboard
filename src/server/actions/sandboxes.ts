'use server';

import { authActionClient } from '@/lib/clients/action';
import { getDb } from '@/lib/db';
import type { Tables } from '@/types/database.types';

/**
 * Cleanup expired sandboxes
 * Finds sandboxes past their expires_at timestamp and marks them as stopped
 * This should be called periodically (e.g., every 5 minutes) to detect timed-out sandboxes
 */
export const cleanupExpiredSandboxes = authActionClient
  .metadata({ actionName: 'cleanupExpiredSandboxes' })
  .action(async () => {
    const db = await getDb();
    const now = new Date().toISOString();

    try {
      // Find all sandboxes that are expired but still marked as active
      const { data: expiredSandboxes, error: fetchError } = await db
        .from('sandbox_sessions')
        .select('*')
        .lt('expires_at', now) // expires_at < now
        .in('status', ['ready', 'starting']) // Only active sandboxes
        .order('expires_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      if (!expiredSandboxes || expiredSandboxes.length === 0) {
        console.log('[Cleanup] No expired sandboxes found');
        return {
          cleaned: 0,
          sandboxes: [],
        };
      }

      console.log(`[Cleanup] Found ${expiredSandboxes.length} expired sandboxes`);

      // Mark all as stopped
      const cleanedIds: string[] = [];

      for (const sandbox of (expiredSandboxes as Tables<'sandbox_sessions'>[])) {
        const { error: updateError } = await db
          .from('sandbox_sessions')
          .update({
            status: 'stopped',
            stopped_at: now,
          } as never)
          .eq('id', sandbox.id);

        if (!updateError) {
          cleanedIds.push(sandbox.id);
          console.log(
            `[Cleanup] Marked sandbox ${sandbox.e2b_session_id} as stopped (expired at ${sandbox.expires_at})`
          );
        } else {
          console.error(
            `[Cleanup] Failed to update sandbox ${sandbox.e2b_session_id}:`,
            updateError
          );
        }
      }

      return {
        cleaned: cleanedIds.length,
        sandboxes: cleanedIds,
      };
    } catch (error) {
      console.error('[Cleanup] Failed to cleanup expired sandboxes:', error);
      throw error;
    }
  });
