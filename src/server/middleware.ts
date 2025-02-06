import { checkUserTeamAuthorization, resolveTeamId } from '@/lib/utils/server'
import { kv } from '@/lib/clients/kv'
import { KV_KEYS } from '@/configs/keys'
import { NextRequest, NextResponse } from 'next/server'
import { replaceUrls } from '@/configs/domains'
import { COOKIE_KEYS } from '@/configs/keys'
import { PROTECTED_URLS } from '@/configs/urls'
import { logger } from '@/lib/clients/logger'
import { INFO_CODES, ERROR_CODES } from '@/configs/logs'
import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import { z } from 'zod'

const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
}

/**
 * Core function to resolve team ID and ensure access for dashboard routes.
 * Handles both direct team ID access and default team resolution.
 */
export async function resolveTeamForDashboard(
  request: NextRequest,
  userId: string
): Promise<{ teamId?: string; teamSlug?: string; redirect?: string }> {
  // Extract teamIdOrSlug from URL if present
  const segments = request.nextUrl.pathname.split('/')
  const teamIdOrSlug = segments.length > 2 ? segments[2] : null
  const currentTeamId = request.cookies.get(COOKIE_KEYS.SELECTED_TEAM_ID)?.value
  const currentTeamSlug = request.cookies.get(
    COOKIE_KEYS.SELECTED_TEAM_SLUG
  )?.value

  // Case 1: URL contains team identifier
  if (teamIdOrSlug && teamIdOrSlug !== 'account') {
    try {
      const teamId = await resolveTeamId(teamIdOrSlug)
      const hasAccess = await checkUserTeamAccess(userId, teamId)

      if (!hasAccess) {
        logger.info(INFO_CODES.ACCESS_DENIED, 'User denied access to team', {
          userId,
          teamId,
        })
        return { redirect: PROTECTED_URLS.DASHBOARD }
      }

      // If teamIdOrSlug was a slug, use it, otherwise get it from cache
      const teamSlug = z.string().uuid().safeParse(teamIdOrSlug).success
        ? (await kv.get<string>(KV_KEYS.TEAM_ID_TO_SLUG(teamId))) || undefined
        : teamIdOrSlug || undefined

      return { teamId, teamSlug }
    } catch (error) {
      logger.error(ERROR_CODES.TEAM_RESOLUTION, 'Failed to resolve team', {
        error,
        teamIdOrSlug,
      })
      return { redirect: PROTECTED_URLS.DASHBOARD }
    }
  }

  // Case 2: No team in URL, try cookie
  if (currentTeamId) {
    const hasAccess = await checkUserTeamAccess(userId, currentTeamId)
    if (hasAccess) {
      // Use cached slug or fetch it
      const teamSlug =
        currentTeamSlug ||
        (await kv.get<string>(KV_KEYS.TEAM_ID_TO_SLUG(currentTeamId))) ||
        undefined

      return {
        teamId: currentTeamId,
        teamSlug,
        redirect:
          teamIdOrSlug === 'account'
            ? undefined
            : PROTECTED_URLS.SANDBOXES(teamSlug || currentTeamId),
      }
    }
  }

  // Case 3: Fall back to default team
  logger.info(INFO_CODES.EXPENSIVE_OPERATION, 'Resolving default team', {
    userId,
  })

  const { data: teamsData } = await supabaseAdmin
    .from('users_teams')
    .select('team_id, is_default, team:teams(slug)')
    .eq('user_id', userId)

  if (!teamsData?.length) {
    return {
      redirect: PROTECTED_URLS.NEW_TEAM,
    }
  }

  const defaultTeam = teamsData.find((t) => t.is_default) || teamsData[0]
  return {
    teamId: defaultTeam.team_id,
    teamSlug: defaultTeam.team?.slug || undefined,
    redirect:
      teamIdOrSlug === 'account'
        ? undefined
        : PROTECTED_URLS.SANDBOXES(
            defaultTeam.team?.slug || defaultTeam.team_id
          ),
  }
}

/**
 * Checks user access to team with caching
 */
async function checkUserTeamAccess(
  userId: string,
  teamId: string
): Promise<boolean> {
  const cacheKey = KV_KEYS.USER_TEAM_ACCESS(userId, teamId)
  const cached = await kv.get<boolean>(cacheKey)

  if (cached !== null) return cached

  const hasAccess = await checkUserTeamAuthorization(userId, teamId)
  await kv.set(cacheKey, hasAccess, { ex: 60 * 60 }) // 1 hour

  return hasAccess
}

/**
 * Handles URL rewrites for static pages and content modifications
 */
export const handleUrlRewrites = async (
  request: NextRequest,
  hostnames: {
    landingPage: string
    landingPageFramer: string
    blogFramer: string
    docsNext: string
  }
): Promise<NextResponse | null> => {
  if (request.method !== 'GET') return null

  const url = new URL(request.nextUrl.toString())
  url.protocol = 'https'
  url.port = ''

  // Static page mappings
  const hostnameMap = {
    '': hostnames.landingPage,
    '/': hostnames.landingPage,
    '/terms': hostnames.landingPage,
    '/privacy': hostnames.landingPage,
    '/pricing': hostnames.landingPage,
    '/cookbook': hostnames.landingPage,
    '/changelog': hostnames.landingPage,
    '/blog': hostnames.landingPage,
    '/ai-agents': hostnames.landingPageFramer,
    '/docs': hostnames.docsNext,
  }

  const matchingPath = Object.keys(hostnameMap).find(
    (path) => url.pathname === path || url.pathname.startsWith(path + '/')
  )

  if (matchingPath) {
    url.hostname = hostnameMap[matchingPath as keyof typeof hostnameMap]
  }

  if (url.hostname === request.nextUrl.hostname) {
    return null
  }

  try {
    const res = await fetch(url.toString(), { ...request })
    const htmlBody = await res.text()
    const modifiedHtmlBody = replaceUrls(htmlBody, url.pathname, 'href="', '">')

    return new NextResponse(modifiedHtmlBody, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    })
  } catch (error) {
    logger.error(ERROR_CODES.URL_REWRITE, 'URL rewrite failed', {
      error,
      url: url.toString(),
    })
    return null
  }
}
