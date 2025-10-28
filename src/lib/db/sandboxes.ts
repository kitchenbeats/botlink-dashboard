import { getDb, handleDbError } from './index';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';
import { revalidateTag } from 'next/cache';

export async function createSandbox(data: TablesInsert<'sandbox_sessions'>): Promise<Tables<'sandbox_sessions'>> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data: sandbox, error } = await db
      .from('sandbox_sessions')
      .insert(data as never)
      .select()
      .single();

    if (error) throw error;
    const typedSandbox = sandbox as Tables<'sandbox_sessions'>

    // Invalidate cache
    if (typedSandbox.project_id) {
      revalidateTag(`sandbox-${typedSandbox.project_id}`, {})
      revalidateTag(`all-sandboxes-${typedSandbox.project_id}`, {})
      // Note: sandbox_sessions doesn't have team_id, would need to join with projects
    }
    revalidateTag('sandboxes', {})

    return typedSandbox;
  }, 'createSandbox');
}

export async function getActiveSandbox(projectId: string): Promise<Tables<'sandbox_sessions'> | null> {
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

export async function getSandboxByProjectId(projectId: string): Promise<Tables<'sandbox_sessions'> | null> {
  return getActiveSandbox(projectId);
}

export async function getAllProjectSandboxes(projectId: string): Promise<Tables<'sandbox_sessions'>[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('sandbox_sessions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }, 'getAllProjectSandboxes');
}

export async function updateSandbox(
  id: string,
  updates: TablesUpdate<'sandbox_sessions'>
): Promise<Tables<'sandbox_sessions'>> {
  return handleDbError(async () => {
    const db = await getDb();
    const updateData: TablesUpdate<'sandbox_sessions'> = { ...updates };

    // Auto-set stopped_at when status becomes stopped or error
    if (updates.status === 'stopped' || updates.status === 'error') {
      updateData.stopped_at = new Date().toISOString();
    }

    const { data, error } = await db
      .from('sandbox_sessions')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    const typedSandbox = data as Tables<'sandbox_sessions'>

    // Invalidate cache
    if (typedSandbox.project_id) {
      revalidateTag(`sandbox-${typedSandbox.project_id}`, {})
      revalidateTag(`all-sandboxes-${typedSandbox.project_id}`, {})
      // Note: sandbox_sessions doesn't have team_id, would need to join with projects
    }
    revalidateTag('sandboxes', {})

    return typedSandbox;
  }, 'updateSandbox');
}
