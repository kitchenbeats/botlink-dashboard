"use server";

import { supabaseAdmin } from "@/lib/clients/supabase/admin";
import { Database } from "@/types/supabase";
import {
  checkAuthenticated,
  checkUserTeamAuthorization,
  guard,
} from "@/lib/utils/server";
import { z } from "zod";
import { User } from "@supabase/supabase-js";
import {
  E2BError,
  InvalidParametersError,
  UnauthorizedError,
} from "@/types/errors";

// Update team name

const UpdateTeamNameSchema = z.object({
  teamId: z.string().uuid(),
  name: z.string().min(1),
});

export const updateTeamNameAction = guard(
  UpdateTeamNameSchema,
  async ({ teamId, name }) => {
    const { user } = await checkAuthenticated();

    const isAuthorized = await checkUserTeamAuthorization(user.id, teamId);

    if (!isAuthorized) {
      throw UnauthorizedError("User is not authorized to update this team");
    }

    const { data, error } = await supabaseAdmin
      .from("teams")
      .update({ name })
      .eq("id", teamId)
      .select()
      .single();

    if (error) {
      throw new E2BError(error.message, "Failed to update team name");
    }

    return data;
  },
);

// Add team member

const AddTeamMemberSchema = z.object({
  teamId: z.string().uuid(),
  email: z.string().email(),
});

export const addTeamMemberAction = guard(
  AddTeamMemberSchema,
  async ({ teamId, email }) => {
    const { user } = await checkAuthenticated();

    const isAuthorized = await checkUserTeamAuthorization(user.id, teamId);

    if (!isAuthorized) {
      throw UnauthorizedError("User is not authorized to add a team member");
    }

    const { data: existingUsers, error: userError } = await supabaseAdmin
      .from("auth_users")
      .select("*")
      .eq("email", email);

    if (userError) {
      throw userError;
    }

    const existingUser = existingUsers?.[0];

    if (!existingUser) {
      throw InvalidParametersError(
        "User with this email does not exist. Account must be registered first.",
      );
    }

    const { data: existingTeamMember } = await supabaseAdmin
      .from("users_teams")
      .select("*")
      .eq("team_id", teamId)
      .eq("user_id", existingUser.id!)
      .single();

    if (existingTeamMember) {
      throw InvalidParametersError("User is already a member of this team");
    }

    const { error: insertError } = await supabaseAdmin
      .from("users_teams")
      .insert({
        team_id: teamId,
        user_id: existingUser.id!,
        added_by: user.id,
      });

    if (insertError) {
      throw insertError;
    }
  },
);

// Remove team member

const RemoveTeamMemberSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const removeTeamMemberAction = guard(
  RemoveTeamMemberSchema,
  async ({ teamId, userId }) => {
    const { user } = await checkAuthenticated();

    const isAuthorized = await checkUserTeamAuthorization(user.id, teamId);

    if (!isAuthorized) {
      throw UnauthorizedError("User is not authorized to remove team members");
    }

    const { data: teamMemberData, error: teamMemberError } = await supabaseAdmin
      .from("users_teams")
      .select("*")
      .eq("team_id", teamId)
      .eq("user_id", userId);

    if (teamMemberError || !teamMemberData || teamMemberData.length === 0) {
      throw InvalidParametersError("User is not a member of this team");
    }

    const teamMember = teamMemberData[0];

    if (teamMember.user_id !== user.id && teamMember.is_default) {
      throw InvalidParametersError("Cannot remove a default team member");
    }

    const { count, error: countError } = await supabaseAdmin
      .from("users_teams")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId);

    if (countError) {
      throw countError;
    }

    if (count === 1) {
      throw InvalidParametersError("Cannot remove the last team member");
    }

    const { error: removeError } = await supabaseAdmin
      .from("users_teams")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", userId);

    if (removeError) {
      throw removeError;
    }
  },
);
