import { getDb, handleDbError } from './index';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';
import { revalidateTag } from 'next/cache';

// Create workflow
export async function createWorkflow(data: TablesInsert<'workflows'>): Promise<Tables<'workflows'>> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data: workflow, error } = await db
      .from('workflows')
      .insert(data as never)
      .select()
      .single();

    if (error) throw error;
    const typedWorkflow = workflow as Tables<'workflows'>

    // Invalidate cache
    revalidateTag(`workflows-${typedWorkflow.team_id}`, {})
    revalidateTag('workflows', {})

    return typedWorkflow;
  }, 'createWorkflow');
}

// Get workflow by ID
export async function getWorkflow(id: string, teamId?: string): Promise<Tables<'workflows'> | null> {
  return handleDbError(async () => {
    const db = await getDb();
    let query = db
      .from('workflows')
      .select('*')
      .eq('id', id);

    // Add team_id filter if provided for security
    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }, 'getWorkflow');
}

// Alias for getWorkflow (for compatibility)
export async function getWorkflowById(id: string, teamId?: string): Promise<Tables<'workflows'> | null> {
  return getWorkflow(id, teamId);
}

// Get org's workflows
export async function getWorkflows(teamId: string): Promise<Tables<'workflows'>[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('workflows')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }, 'getWorkflows');
}

// Update workflow
export async function updateWorkflow(
  id: string,
  updates: TablesUpdate<'workflows'>
): Promise<Tables<'workflows'>> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('workflows')
      .update({ ...updates, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    const typedWorkflow = data as Tables<'workflows'>

    // Invalidate cache
    revalidateTag(`workflows-${typedWorkflow.team_id}`, {})
    revalidateTag('workflows', {})

    return typedWorkflow;
  }, 'updateWorkflow');
}

// Delete workflow
export async function deleteWorkflow(id: string): Promise<void> {
  return handleDbError(async () => {
    const db = await getDb();

    // Get workflow first to know which team to invalidate
    const { data: workflow } = await db
      .from('workflows')
      .select('team_id')
      .eq('id', id)
      .single();

    const typedWorkflow = workflow as Tables<'workflows'> | null

    const { error } = await db
      .from('workflows')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Invalidate cache
    if (typedWorkflow?.team_id) {
      revalidateTag(`workflows-${typedWorkflow.team_id}`, {})
    }
    revalidateTag('workflows', {})
  }, 'deleteWorkflow');
}
