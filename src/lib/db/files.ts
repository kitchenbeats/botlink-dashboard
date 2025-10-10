import { getDb, handleDbError } from './index';
import type { File, InsertFile, UpdateFile } from '../types/database';

export async function createFile(data: InsertFile): Promise<File> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data: file, error } = await db
      .from('files')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return file;
  }, 'createFile');
}

export async function getFile(id: string): Promise<File | null> {
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

export async function getFileByPath(projectId: string, path: string): Promise<File | null> {
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

export async function listFiles(projectId: string): Promise<File[]> {
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

export async function updateFile(id: string, updates: UpdateFile): Promise<File> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('files')
      .update({ ...updates, updated_at: new Date().toISOString() })
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
export async function createFiles(files: InsertFile[]): Promise<File[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('files')
      .insert(files)
      .select();

    if (error) throw error;
    return data || [];
  }, 'createFiles');
}
