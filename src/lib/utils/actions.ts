import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/supabase";
import {
  E2BError,
  UnauthenticatedError,
  UnauthorizedError,
} from "@/types/errors";
import { z } from "zod";
import { ActionFunction, ActionResponse } from "@/types/actions";

/*
 *  This function checks if the user is authenticated and returns the user and the supabase client.
 *  If the user is not authenticated, it throws an error.
 *
 *  @params request - an optional NextRequest object to create a supabase client for route handlers
 */
export async function checkAuthenticated() {
  const supabase = await createClient();

  // retrieve session from storage medium (cookies)
  // if no stored session found, not authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw UnauthenticatedError();
  }

  // now retrieve user from supabase to use further
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw UnauthenticatedError();
  }

  return { user, supabase };
}

/*
 *  This function fetches a team API key for a given user and team.
 *  If the user is not a member of the team, it throws an error.
 */
export async function getTeamApiKey(userId: string, teamId: string) {
  const { data: userTeamsRelationData, error: userTeamsRelationError } =
    await supabaseAdmin
      .from("users_teams")
      .select("*")
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .single();

  if (userTeamsRelationError) {
    throw userTeamsRelationError;
  }

  if (!userTeamsRelationData) {
    throw UnauthorizedError(
      `User is not a member of team (user: ${userId}, team: ${teamId})`,
    );
  }

  const { data: teamApiKeyData, error: teamApiKeyError } = await supabaseAdmin
    .from("team_api_keys")
    .select("*")
    .eq("team_id", teamId);

  if (teamApiKeyError) {
    console.error(teamApiKeyError);
    throw new Error(
      `Failed to fetch team API key for team (user: ${userId}, team: ${teamId})`,
    );
  }

  if (!teamApiKeyData || teamApiKeyData.length === 0) {
    throw new Error(
      `No team API key found for team (user: ${userId}, team: ${teamId})`,
    );
  }

  return teamApiKeyData[0].api_key;
}

/*
 *  This function fetches a user access token for a given user.
 *  If the user does not have an active access token, it throws an error.
 */
export async function getUserAccessToken(userId: string) {
  const { data: userAccessTokenData, error: userAccessTokenError } =
    await supabaseAdmin.from("access_tokens").select("*").eq("user_id", userId);

  if (userAccessTokenError) {
    throw userAccessTokenError;
  }

  if (!userAccessTokenData || userAccessTokenData.length === 0) {
    throw new Error(`No user access token found for user (user: ${userId})`);
  }

  return userAccessTokenData[0].access_token;
}

// TODO: we should probably add some team permission system here

/*
 *  This function checks if a user is authorized to access a team.
 *  If the user is not authorized, it returns false.
 */
export async function checkUserTeamAuthorization(
  userId: string,
  teamId: string,
) {
  const { data: userTeamsRelationData, error: userTeamsRelationError } =
    await supabaseAdmin
      .from("users_teams")
      .select("*")
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .single();

  if (userTeamsRelationError) {
    throw new Error(
      `Failed to fetch users_teams relation (user: ${userId}, team: ${teamId})`,
    );
  }

  return !!userTeamsRelationData;
}

/*
 *  This function masks an API key by showing only the first and last 4 characters,
 *  replacing the middle characters with dots (•).
 *  Returns the masked API key string.
 */
export function maskApiKey(
  apiKey: Database["public"]["Tables"]["team_api_keys"]["Row"],
) {
  const firstFour = apiKey.api_key.slice(0, 6);
  const lastFour = apiKey.api_key.slice(-4);
  const dots = "...";

  return `${firstFour}${dots}${lastFour}`;
}

/**
 * Utility function for guarding server actions with error handling and optional schema validation.
 *
 * This higher-order function wraps server actions to handle:
 * - Error handling and consistent error responses
 * - Optional Zod schema validation for input parameters
 * - Type-safe responses using ActionResponse type
 *
 * @alert E2BError codes & messages are directly exposed to clients. Do not include sensitive information in these.
 *
 * @example
 * // Basic usage without schema validation
 * const guardedAction = guardAction(async (params) => {
 *   // action implementation
 * });
 *
 * @example
 * // Usage with schema validation
 * const schema = z.object({ id: z.string() });
 * const guardedAction = guardAction(schema, async (params) => {
 *   // action implementation
 * });
 */
export function guardAction<TInput = void, TOutput = void>(
  action: ActionFunction<TInput, TOutput>,
): (params: TInput) => Promise<ActionResponse<TOutput>>;

export function guardAction<TSchema extends z.ZodType, TOutput = void>(
  schema: TSchema,
  action: ActionFunction<z.infer<TSchema>, TOutput>,
): (params: z.infer<TSchema>) => Promise<ActionResponse<TOutput>>;

export function guardAction<TInput, TOutput>(
  schemaOrAction: z.ZodType | ActionFunction<TInput, TOutput>,
  maybeAction?: ActionFunction<TInput, TOutput>,
): (params: TInput) => Promise<ActionResponse<TOutput>> {
  // If only one argument is provided, it's the action
  if (!maybeAction) {
    const action = schemaOrAction as ActionFunction<TInput, TOutput>;
    return async (params) => {
      try {
        const data = await action(params);
        return {
          type: "success",
          data,
        };
      } catch (error) {
        console.error(error);

        if (error instanceof E2BError) {
          return {
            type: "error",
            message: error.message,
          };
        }

        return {
          type: "error",
          message: "An unexpected error occurred",
        };
      }
    };
  }

  // If both arguments are provided, first is schema and second is action
  const schema = schemaOrAction as z.ZodType;
  const action = maybeAction;

  return async (params) => {
    const parseResult = schema.safeParse(params);

    if (!parseResult.success) {
      console.error(parseResult.error);
      return {
        type: "error",
        message: "Invalid parameters",
      };
    }

    try {
      const data = await action(params);
      return {
        type: "success",
        data,
      };
    } catch (error) {
      console.error(error);

      if (error instanceof E2BError) {
        return {
          type: "error",
          code: error.code,
          message: error.message,
        };
      }

      return {
        type: "error",
        message: "An unexpected error occurred",
      };
    }
  };
}
