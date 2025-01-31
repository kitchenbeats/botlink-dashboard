import { checkUserTeamAuthorization } from "@/lib/utils/server";
import { kv } from "@/lib/clients/kv";
import { KV_KEYS } from "@/configs/keys";

const CACHE_TTL = 60 * 60; // 1 hour

export const cachedUserTeamAccess = async (userId: string, teamId: string) => {
  const [result] = await kv.mget(KV_KEYS.USER_TEAM_ACCESS(userId, teamId));

  if (result !== null) {
    return result === "true";
  }

  const isAuthorized = await checkUserTeamAuthorization(userId, teamId);

  // we do not await here because we want to return the result immediately
  kv.set(KV_KEYS.USER_TEAM_ACCESS(userId, teamId), isAuthorized.toString(), {
    ex: CACHE_TTL,
  });

  return isAuthorized;
};
