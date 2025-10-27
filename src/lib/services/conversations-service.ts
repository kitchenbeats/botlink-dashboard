/**
 * Conversations Service
 * Clean API layer for managing conversation threads
 */

import type { Tables } from '@/types/database.types';

export type Conversation = Tables<'conversations'> & { message_count: number };

export class ConversationsService {
  /**
   * List all conversations for a project with message counts
   */
  static async listConversations(projectId: string): Promise<Conversation[]> {
    const { listProjectConversations } = await import('@/server/actions/conversations');
    const result = await listProjectConversations({ projectId });

    if (!result?.data?.conversations) {
      return [];
    }

    return result.data.conversations;
  }

  /**
   * Create a new conversation
   */
  static async createConversation(data: {
    projectId: string;
    name: string;
    description?: string;
  }): Promise<Tables<'conversations'> | null> {
    const { createNewConversation } = await import('@/server/actions/conversations');
    const result = await createNewConversation({
      projectId: data.projectId,
      name: data.name,
      description: data.description,
    });

    if (!result?.data?.conversation) {
      throw new Error('Failed to create conversation');
    }

    return result.data.conversation;
  }

  /**
   * Update conversation metadata (rename, update commit hashes)
   */
  static async updateConversation(data: {
    conversationId: string;
    name?: string;
    description?: string;
    lastCommitHash?: string;
  }): Promise<Tables<'conversations'> | null> {
    const { updateConversationMetadata } = await import('@/server/actions/conversations');
    const result = await updateConversationMetadata(data);

    if (!result?.data?.conversation) {
      throw new Error('Failed to update conversation');
    }

    return result.data.conversation;
  }

  /**
   * Delete a conversation (only if not the last one)
   */
  static async deleteConversation(conversationId: string): Promise<void> {
    const { deleteConversationAction } = await import('@/server/actions/conversations');
    const result = await deleteConversationAction({ conversationId });

    if (!result?.data?.success) {
      throw new Error(result?.data?.message || 'Failed to delete conversation');
    }
  }

  /**
   * Get or create default conversation for a project
   */
  static async getOrCreateDefault(projectId: string): Promise<Tables<'conversations'>> {
    const { getOrCreateDefaultConversation } = await import('@/lib/db/conversations');
    return await getOrCreateDefaultConversation(projectId);
  }
}
