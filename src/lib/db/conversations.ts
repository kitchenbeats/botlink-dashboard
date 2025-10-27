import { getDb, handleDbError } from './index';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

/**
 * Conversation Repository
 * Handles conversation CRUD operations for organizing chat threads
 */

// Create conversation
export async function createConversation(data: TablesInsert<'conversations'>): Promise<Tables<'conversations'>> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data: conversation, error } = await db
      .from('conversations')
      .insert(data as never)
      .select()
      .single();

    if (error) throw error;
    return conversation;
  }, 'createConversation');
}

// Get conversation by ID
export async function getConversation(id: string): Promise<Tables<'conversations'> | null> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }, 'getConversation');
}

// List conversations for a project
export async function listConversations(projectId: string): Promise<Tables<'conversations'>[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('conversations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }, 'listConversations');
}

// Get conversation with message count
export async function listConversationsWithMessageCount(projectId: string): Promise<Array<Tables<'conversations'> & { message_count: number }>> {
  return handleDbError(async () => {
    const db = await getDb();

    // Get all conversations
    const { data: conversations, error: convError } = await db
      .from('conversations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (convError) throw convError;
    if (!conversations || conversations.length === 0) return [];

    // Get message counts for each conversation
    const conversationsWithCounts = await Promise.all(
      (conversations as Tables<'conversations'>[]).map(async (conv) => {
        const { count, error: countError } = await db
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id);

        if (countError) throw countError;

        return {
          ...conv,
          message_count: count || 0
        };
      })
    );

    return conversationsWithCounts;
  }, 'listConversationsWithMessageCount');
}

// Update conversation
export async function updateConversation(
  id: string,
  updates: TablesUpdate<'conversations'>
): Promise<Tables<'conversations'>> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('conversations')
      .update({ ...updates, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, 'updateConversation');
}

// Delete conversation (and cascade delete messages)
export async function deleteConversation(id: string): Promise<void> {
  return handleDbError(async () => {
    const db = await getDb();
    const { error } = await db
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }, 'deleteConversation');
}

// Get or create default conversation for a project
export async function getOrCreateDefaultConversation(projectId: string): Promise<Tables<'conversations'>> {
  return handleDbError(async () => {
    const conversations = await listConversations(projectId);

    if (conversations.length > 0) {
      const firstConversation = conversations[0];
      if (!firstConversation) {
        throw new Error('Unexpected: conversation array has length but first element is undefined');
      }
      return firstConversation; // Return most recent
    }

    // Create default conversation
    const newConversation = await createConversation({
      project_id: projectId,
      name: 'Main',
      description: 'Default conversation',
    });

    return newConversation;
  }, 'getOrCreateDefaultConversation');
}
