import { getDb, handleDbError } from './index';
import type { Task, InsertTask, UpdateTask } from '../types/database';

export async function createTask(data: InsertTask): Promise<Task> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data: task, error } = await db
      .from('tasks')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return task;
  }, 'createTask');
}

export async function getTask(id: string): Promise<Task | null> {
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

export async function listTasks(projectId: string): Promise<Task[]> {
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

export async function listTasksByMessage(messageId: string): Promise<Task[]> {
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

export async function updateTask(id: string, updates: UpdateTask): Promise<Task> {
  return handleDbError(async () => {
    const db = await getDb();
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = { ...updates };

    // Auto-set completed_at when status becomes completed or failed
    if (updates.status === 'completed' || updates.status === 'failed') {
      updateData.completed_at = now;
    }

    const { data, error } = await db
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, 'updateTask');
}

// Create multiple tasks (for compatibility)
export async function createTasks(tasks: InsertTask[]): Promise<Task[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('tasks')
      .insert(tasks)
      .select();

    if (error) throw error;
    return data || [];
  }, 'createTasks');
}
