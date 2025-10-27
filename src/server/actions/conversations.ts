'use server';

import { authActionClient } from '@/lib/clients/action';
import { z } from 'zod';
import { ActionError } from '@/lib/utils/action';
import {
  createConversation,
  getConversation,
  listConversationsWithMessageCount,
  updateConversation,
  deleteConversation,
} from '@/lib/db/conversations';
import { getProject } from '@/lib/db/projects';

const createConversationSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

/**
 * Create a new conversation for organizing chat threads
 */
export const createNewConversation = authActionClient
  .schema(createConversationSchema)
  .metadata({ actionName: 'createNewConversation' })
  .action(async ({ parsedInput }) => {
    const { projectId, name, description } = parsedInput;

    // Verify project exists and user has access
    const project = await getProject(projectId);
    if (!project) {
      throw new ActionError('Project not found');
    }

    const conversation = await createConversation({
      project_id: projectId,
      name,
      description: description || null,
    });

    return {
      success: true,
      conversation,
    };
  });

const listConversationsSchema = z.object({
  projectId: z.string().uuid(),
});

/**
 * List all conversations for a project with message counts
 */
export const listProjectConversations = authActionClient
  .schema(listConversationsSchema)
  .metadata({ actionName: 'listProjectConversations' })
  .action(async ({ parsedInput }) => {
    const { projectId } = parsedInput;

    const conversations = await listConversationsWithMessageCount(projectId);

    return {
      success: true,
      conversations,
    };
  });

const updateConversationSchema = z.object({
  conversationId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  lastCommitHash: z.string().optional(),
});

/**
 * Update conversation metadata
 */
export const updateConversationMetadata = authActionClient
  .schema(updateConversationSchema)
  .metadata({ actionName: 'updateConversationMetadata' })
  .action(async ({ parsedInput }) => {
    const { conversationId, name, description, lastCommitHash } = parsedInput;

    // Verify conversation exists
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      throw new ActionError('Conversation not found');
    }

    const updates: Record<string, string | null> = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (lastCommitHash) updates.last_commit_hash = lastCommitHash;

    const updated = await updateConversation(conversationId, updates);

    return {
      success: true,
      conversation: updated,
    };
  });

const deleteConversationSchema = z.object({
  conversationId: z.string().uuid(),
});

/**
 * Delete a conversation (and all its messages)
 */
export const deleteConversationAction = authActionClient
  .schema(deleteConversationSchema)
  .metadata({ actionName: 'deleteConversationAction' })
  .action(async ({ parsedInput }) => {
    const { conversationId } = parsedInput;

    // Verify conversation exists
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      throw new ActionError('Conversation not found');
    }

    // Don't allow deleting if it's the only conversation
    const allConversations = await listConversationsWithMessageCount(conversation.project_id);
    if (allConversations.length <= 1) {
      throw new ActionError('Cannot delete the only conversation');
    }

    await deleteConversation(conversationId);

    return {
      success: true,
      message: 'Conversation deleted',
    };
  });
