import { getDb, handleDbError } from './index';
import type { Workflow, InsertWorkflow, UpdateWorkflow } from '../types/database';

// Create workflow
export async function createWorkflow(data: InsertWorkflow): Promise<Workflow> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data: workflow, error } = await db
      .from('workflows')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return workflow;
  }, 'createWorkflow');
}

// Get workflow by ID
export async function getWorkflow(id: string, teamId?: string): Promise<Workflow | null> {
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
export async function getWorkflowById(id: string, teamId?: string): Promise<Workflow | null> {
  return getWorkflow(id, teamId);
}

// Get org's workflows
export async function getWorkflows(teamId: string): Promise<Workflow[]> {
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
  updates: UpdateWorkflow
): Promise<Workflow> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('workflows')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, 'updateWorkflow');
}

// Delete workflow
export async function deleteWorkflow(id: string): Promise<void> {
  return handleDbError(async () => {
    const db = await getDb();
    const { error } = await db
      .from('workflows')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }, 'deleteWorkflow');
}
