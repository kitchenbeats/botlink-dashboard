import { getDb, handleDbError } from './index';
import type { Message, InsertMessage } from '../types/database';

export async function createMessage(data: InsertMessage): Promise<Message> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data: message, error } = await db
      .from('messages')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return message;
  }, 'createMessage');
}

export async function getMessage(id: string): Promise<Message | null> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }, 'getMessage');
}

export async function listMessages(projectId: string): Promise<Message[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }, 'listMessages');
}

export async function deleteMessage(id: string): Promise<void> {
  return handleDbError(async () => {
    const db = await getDb();
    const { error } = await db
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }, 'deleteMessage');
}
