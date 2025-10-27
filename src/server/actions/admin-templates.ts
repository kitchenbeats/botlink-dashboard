'use server';

import { z } from 'zod';
import { authActionClient } from '@/lib/clients/action';
import { supabaseAdmin } from '@/lib/clients/supabase/admin';
import { isAdmin } from '@/lib/auth/admin';
import { ActionError } from '@/lib/utils/action';

// Schema for updating template metadata
const updateTemplateMetadataSchema = z.object({
  templateId: z.string(),
  name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  category: z.string().optional().nullable(),
  iconUrl: z.string().url().optional().nullable(),
  allowedTierIds: z.array(z.string()).optional().nullable(),
});

/**
 * Admin-only: List all E2B templates with metadata
 */
export const listAllTemplates = authActionClient
  .metadata({ actionName: 'listAllTemplates' })
  .action(async ({ ctx }) => {
    const { user } = ctx;

    // Check admin permission
    if (!isAdmin(user.email) && !isAdmin(user.id)) {
      throw new ActionError('Unauthorized: Admin access required');
    }

    // Query all templates from envs table
    const { data: templates, error } = await supabaseAdmin
      .from('envs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new ActionError(`Failed to fetch templates: ${error.message}`);
    }

    return { templates };
  });

/**
 * Admin-only: Get all available tiers
 */
export const listAllTiers = authActionClient
  .metadata({ actionName: 'listAllTiers' })
  .action(async ({ ctx }) => {
    const { user } = ctx;

    // Check admin permission
    if (!isAdmin(user.email) && !isAdmin(user.id)) {
      throw new ActionError('Unauthorized: Admin access required');
    }

    // Query all tiers
    const { data: tiers, error } = await supabaseAdmin
      .from('tiers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new ActionError(`Failed to fetch tiers: ${error.message}`);
    }

    return { tiers };
  });

/**
 * Admin-only: Update template metadata
 */
export const updateTemplateMetadata = authActionClient
  .schema(updateTemplateMetadataSchema)
  .metadata({ actionName: 'updateTemplateMetadata' })
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    // Check admin permission
    if (!isAdmin(user.email) && !isAdmin(user.id)) {
      throw new ActionError('Unauthorized: Admin access required');
    }

    const { templateId, ...updates } = parsedInput;

    // Update template in envs table
    // @ts-ignore - New columns from migration not in types yet
    const { data, error } = await supabaseAdmin
      .from('envs')
      .update({
        name: updates.name,
        description: updates.description,
        tags: updates.tags,
        category: updates.category,
        icon_url: updates.iconUrl,
        allowed_tier_ids: updates.allowedTierIds,
      } as any)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      throw new ActionError(`Failed to update template: ${error.message}`);
    }

    return { template: data };
  });
