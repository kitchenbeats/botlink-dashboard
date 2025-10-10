import { createClient } from '@/lib/supabase/server';

/**
 * Database service layer
 * Provides type-safe database operations with error handling
 */

// Re-export types
export * from '../types/database';

// Get Supabase client (server-side)
export async function getDb() {
  return await createClient();
}

// Error handling wrapper
export async function handleDbError<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`[DB Error] ${context}:`, error);
    // Re-throw the actual error instead of hiding it
    throw error;
  }
}

// Re-export all repositories
export * from './teams'; // E2B architecture - teams instead of organizations
export * from './projects';
export * from './files';
export * from './messages';
export * from './tasks';
export * from './agents';
export * from './sandboxes';
export * from './deployments';
export * from './workflows';
export * from './executions';
