import { checkUserTeamAuthorization } from "@/lib/utils/server";
import { kv } from "@/lib/clients/kv";
import { KV_KEYS } from "@/configs/keys";
import { NextRequest, NextResponse } from "next/server";
import { replaceUrls } from "@/configs/domains";

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

interface HostnameMapping {
  landingPage: string;
  landingPageFramer: string;
  blogFramer: string;
}

/**
 * Handles URL rewrites and content modifications for specific paths.
 * Returns null if no rewrite is needed.
 *
 * @param request - The incoming Next.js request
 * @param hostnames - Mapping of hostnames for different environments
 * @returns Promise<NextResponse | null> - The rewritten response or null
 */
export const handleUrlRewrites = async (
  request: NextRequest,
  hostnames: HostnameMapping,
): Promise<NextResponse | null> => {
  if (request.method !== "GET") return null;

  const url = new URL(request.nextUrl.toString());
  url.protocol = "https";
  url.port = "";

  // Handle root path
  /*   if (url.pathname === "" || url.pathname === "/") {
    if (process.env.NODE_ENV === "production") {
      url.hostname = hostnames.landingPage;
    } else {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }
 */

  // Static page rewrites
  const landingPagePaths = [
    "/terms",
    "/privacy",
    "/pricing",
    "/cookbook",
    "/changelog",
  ];
  if (landingPagePaths.some((path) => url.pathname.startsWith(path))) {
    url.hostname = hostnames.landingPage;
  }

  // Special case for AI agents page
  if (url.pathname.startsWith("/ai-agents")) {
    url.hostname = hostnames.landingPageFramer;
  }

  // Blog rewrites
  if (url.pathname.startsWith("/blog")) {
    url.hostname = hostnames.landingPage;
  }

  if (url.hostname === request.nextUrl.hostname) {
    return null;
  }

  try {
    const res = await fetch(url.toString(), { ...request });
    const htmlBody = await res.text();
    let modifiedHtmlBody = replaceUrls(htmlBody, url.pathname, 'href="', '">');

    return new NextResponse(modifiedHtmlBody, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
      url: request.url,
    });
  } catch (error) {
    return null;
  }
};
