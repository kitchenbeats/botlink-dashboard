import { getDb, handleDbError } from './index';
import type { Tables, TablesInsert } from '@/types/database.types';

export async function createMessage(data: TablesInsert<'messages'>): Promise<Tables<'messages'>> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data: message, error } = await db
      .from('messages')
      .insert(data as never)
      .select()
      .single();

    if (error) throw error;
    return message;
  }, 'createMessage');
}

export async function getMessage(id: string): Promise<Tables<'messages'> | null> {
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

export async function listMessages(projectId: string, conversationId?: string): Promise<Tables<'messages'>[]> {
  return handleDbError(async () => {
    const db = await getDb();
    let query = db
      .from('messages')
      .select('*')
      .eq('project_id', projectId);

    // Filter by conversation if provided
    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    }

    const { data, error } = await query.order('created_at');

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
