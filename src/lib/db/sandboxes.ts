import { getDb, handleDbError } from './index';
import type { SandboxSession, InsertSandboxSession, UpdateSandboxSession } from '../types/database';

export async function createSandbox(data: InsertSandboxSession): Promise<SandboxSession> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data: sandbox, error } = await db
      .from('sandbox_sessions')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return sandbox;
  }, 'createSandbox');
}

export async function getActiveSandbox(projectId: string): Promise<SandboxSession | null> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('sandbox_sessions')
      .select('*')
      .eq('project_id', projectId)
      .in('status', ['starting', 'ready'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }, 'getActiveSandbox');
}

export async function updateSandbox(
  id: string,
  updates: UpdateSandboxSession
): Promise<SandboxSession> {
  return handleDbError(async () => {
    const db = await getDb();
    const updateData: Record<string, unknown> = { ...updates };

    // Auto-set stopped_at when status becomes stopped or error
    if (updates.status === 'stopped' || updates.status === 'error') {
      updateData.stopped_at = new Date().toISOString();
    }

    const { data, error } = await db
      .from('sandbox_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, 'updateSandbox');
}
