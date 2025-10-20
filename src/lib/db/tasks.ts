import { getDb, handleDbError } from './index';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

export async function createTask(data: TablesInsert<'tasks'>): Promise<Tables<'tasks'>> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data: task, error } = await db
      .from('tasks')
      .insert(data as never)
      .select()
      .single();

    if (error) throw error;
    return task;
  }, 'createTask');
}

export async function getTask(id: string): Promise<Tables<'tasks'> | null> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }, 'getTask');
}

export async function listTasks(projectId: string): Promise<Tables<'tasks'>[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }, 'listTasks');
}

export async function listTasksByMessage(messageId: string): Promise<Tables<'tasks'>[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('tasks')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }, 'listTasksByMessage');
}

export async function updateTask(id: string, updates: TablesUpdate<'tasks'>): Promise<Tables<'tasks'>> {
  return handleDbError(async () => {
    const db = await getDb();
    const now = new Date().toISOString();
    const updateData: TablesUpdate<'tasks'> = { ...updates };

    // Auto-set completed_at when status becomes completed or failed
    if (updates.status === 'completed' || updates.status === 'failed') {
      updateData.completed_at = now;
    }

    const { data, error } = await db
      .from('tasks')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, 'updateTask');
}

// Create multiple tasks (for compatibility)
export async function createTasks(tasks: TablesInsert<'tasks'>[]): Promise<Tables<'tasks'>[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('tasks')
      .insert(tasks as never)
      .select();

    if (error) throw error;
    return data || [];
  }, 'createTasks');
}

export async function getTasksByExecution(executionId: string): Promise<Tables<'tasks'>[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('tasks')
      .select('*')
      .eq('execution_id', executionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }, 'getTasksByExecution');
}
