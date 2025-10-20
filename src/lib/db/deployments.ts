import { getDb, handleDbError } from './index';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

export async function createDeployment(data: TablesInsert<'deployments'>): Promise<Tables<'deployments'>> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data: deployment, error } = await db
      .from('deployments')
      .insert(data as never)
      .select()
      .single();

    if (error) throw error;
    return deployment;
  }, 'createDeployment');
}

export async function getDeployment(id: string): Promise<Tables<'deployments'> | null> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('deployments')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }, 'getDeployment');
}

export async function listDeployments(projectId: string): Promise<Tables<'deployments'>[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('deployments')
      .select('*')
      .eq('project_id', projectId)
      .order('version', { ascending: false });

    if (error) throw error;
    return data || [];
  }, 'listDeployments');
}

export async function updateDeployment(
  id: string,
  updates: TablesUpdate<'deployments'>
): Promise<Tables<'deployments'>> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('deployments')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, 'updateDeployment');
}
