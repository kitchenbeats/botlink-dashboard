import { getDb, handleDbError } from './index';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

export async function createFile(data: TablesInsert<'files'>): Promise<Tables<'files'>> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data: file, error } = await db
      .from('files')
      .insert(data as never)
      .select()
      .single();

    if (error) throw error;
    return file;
  }, 'createFile');
}

export async function getFile(id: string): Promise<Tables<'files'> | null> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('files')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }, 'getFile');
}

export async function getFileByPath(projectId: string, path: string): Promise<Tables<'files'> | null> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('files')
      .select('*')
      .eq('project_id', projectId)
      .eq('path', path)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }, 'getFileByPath');
}

export async function listFiles(projectId: string): Promise<Tables<'files'>[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('files')
      .select('*')
      .eq('project_id', projectId)
      .order('path');

    if (error) throw error;
    return data || [];
  }, 'listFiles');
}

export async function updateFile(id: string, updates: TablesUpdate<'files'>): Promise<Tables<'files'>> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('files')
      .update({ ...updates, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, 'updateFile');
}

export async function deleteFile(id: string): Promise<void> {
  return handleDbError(async () => {
    const db = await getDb();
    const { error } = await db
      .from('files')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }, 'deleteFile');
}

// Create multiple files (for compatibility)
export async function createFiles(files: TablesInsert<'files'>[]): Promise<Tables<'files'>[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('files')
      .insert(files as never)
      .select();

    if (error) throw error;
    return data || [];
  }, 'createFiles');
}
