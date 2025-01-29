"use server";

import { API_KEY_PREFIX } from "@/configs/constants";
import {
  checkAuthenticated,
  checkUserTeamAuthorization,
  guard,
} from "@/lib/utils/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Create API Key

const CreateApiKeySchema = z.object({
  teamId: z.string({ required_error: "Team ID is required" }).uuid(),
  name: z
    .string({ required_error: "Name is required" })
    .min(1, "Name cannot be empty")
    .max(50, "Name cannot be longer than 50 characters")
    .trim(),
});

function generateTeamApiKey(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(20));
  const hexString = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return API_KEY_PREFIX + hexString;
}

export const createApiKeyAction = guard(
  CreateApiKeySchema,
  async ({ teamId, name }: z.infer<typeof CreateApiKeySchema>) => {
    const { user } = await checkAuthenticated();

    const isAuthorized = await checkUserTeamAuthorization(user.id, teamId);

    if (!isAuthorized)
      throw new Error("Not authorized to create team api keys");

    const apiKeyValue = generateTeamApiKey();

    const { error } = await supabaseAdmin
      .from("team_api_keys")
      .insert({
        team_id: teamId,
        name: name,
        api_key: apiKeyValue,
        created_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/dashboard/${teamId}/settings/keys`);

    return {
      createdApiKey: apiKeyValue,
    };
  },
);

// Delete API Key

const DeleteApiKeySchema = z.object({
  teamId: z.string({ required_error: "Team ID is required" }).uuid(),
  apiKeyId: z.string({ required_error: "API Key ID is required" }).uuid(),
});

export const deleteApiKeyAction = guard(
  DeleteApiKeySchema,
  async ({ teamId, apiKeyId }) => {
    const { user } = await checkAuthenticated();

    const isAuthorized = await checkUserTeamAuthorization(user.id, teamId);

    if (!isAuthorized)
      throw new Error("Not authorized to delete team api keys");

    const { error } = await supabaseAdmin
      .from("team_api_keys")
      .delete()
      .eq("team_id", teamId)
      .eq("id", apiKeyId);

    if (error) throw error;

    revalidatePath(`/dashboard/${teamId}/settings/keys`);

    return {
      success: true,
    };
  },
);
