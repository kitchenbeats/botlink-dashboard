import { checkUserTeamAuthorization } from "@/lib/utils/server";
import { kv } from "@/lib/clients/kv";
import { KV_KEYS } from "@/configs/keys";

const CACHE_TTL = 60 * 60; // 1 hour
export const cachedUserTeamAccess = async (userId: string, teamId: string) => {
  const cacheKey = KV_KEYS.USER_TEAM_ACCESS(userId, teamId);
  const [result] = await kv.mget(cacheKey);

  console.log(
    "[cachedUserTeamAccess] Raw cache result:",
    result,
    "type:",
    typeof result,
  );

  if (result !== null) {
    if (typeof result === "boolean") {
      return result;
    }
    return result === "true";
  }

  const isAuthorized = await checkUserTeamAuthorization(userId, teamId);
  console.log(
    "[cachedUserTeamAccess] Fresh auth result:",
    isAuthorized,
    "type:",
    typeof isAuthorized,
  );

  await kv.set(cacheKey, isAuthorized, {
    ex: CACHE_TTL,
  });

  return isAuthorized;
};
