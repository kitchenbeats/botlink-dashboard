import { getDb, handleDbError } from './index';
import type { Execution, InsertExecution, UpdateExecution, Task } from '../types/database';

// Create execution
export async function createExecution(data: InsertExecution): Promise<Execution> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data: execution, error } = await db
      .from('executions')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return execution;
  }, 'createExecution');
}

// Get execution by ID
export async function getExecution(id: string, teamId?: string): Promise<Execution | null> {
  return handleDbError(async () => {
    const db = await getDb();
    let query = db
      .from('executions')
      .select('*')
      .eq('id', id);

    // Add team_id filter if provided for security
    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }, 'getExecution');
}

// Alias for getExecution (for compatibility)
export async function getExecutionById(id: string, teamId?: string): Promise<Execution | null> {
  return getExecution(id, teamId);
}

// Get org's executions
export async function getExecutions(teamId: string): Promise<Execution[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('executions')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }, 'getExecutions');
}

// Get tasks for an execution
export async function getTasks(executionId: string): Promise<Task[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('tasks')
      .select('*')
      .eq('execution_id', executionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }, 'getTasks');
}

// Update execution
export async function updateExecution(
  id: string,
  updates: UpdateExecution
): Promise<Execution> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('executions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, 'updateExecution');
}

// Delete execution
export async function deleteExecution(id: string): Promise<void> {
  return handleDbError(async () => {
    const db = await getDb();
    const { error } = await db
      .from('executions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }, 'deleteExecution');
}
