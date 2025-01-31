import { checkUserTeamAuthorization } from "@/lib/utils/server";
import { kv } from "@/lib/clients/kv";
import { KV_KEYS } from "@/configs/keys";

/** Cache TTL in seconds for team access results */
const CACHE_TTL = 60 * 60; // 1 hour

/**
 * Checks if a user has access to a team, with caching for performance.
 *
 * This function first checks a Redis cache for the user-team access result.
 * If not found in cache, it performs a fresh authorization check and caches
 * the result for 1 hour.
 *
 * @param userId - The ID of the user to check access for
 * @param teamId - The ID of the team to check access to
 * @returns Promise<boolean> - Whether the user has access to the team
 */
export const cachedUserTeamAccess = async (userId: string, teamId: string) => {
  const cacheKey = KV_KEYS.USER_TEAM_ACCESS(userId, teamId);
  const [result] = await kv.mget(cacheKey);

  if (result !== null) {
    if (typeof result === "boolean") {
      return result;
    }
    return result === "true";
  }

  const isAuthorized = await checkUserTeamAuthorization(userId, teamId);

  await kv.set(cacheKey, isAuthorized, {
    ex: CACHE_TTL,
  });

  return isAuthorized;
};
