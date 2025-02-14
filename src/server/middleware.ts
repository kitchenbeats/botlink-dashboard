import { checkUserTeamAuthorization, resolveTeamId } from '@/lib/utils/server'
import { kv } from '@/lib/clients/kv'
import { KV_KEYS } from '@/configs/keys'
import { NextRequest, NextResponse } from 'next/server'
import { replaceUrls } from '@/configs/domains'
import { COOKIE_KEYS } from '@/configs/keys'
import { PROTECTED_URLS } from '@/configs/urls'
import { logger } from '@/lib/clients/logger'
import { ERROR_CODES } from '@/configs/logs'
import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import { z } from 'zod'
import { cookies } from 'next/headers'

/**
 * Core function to resolve team ID and ensure access for dashboard routes.
 * Handles both direct team ID access and default team resolution.
 */
export async function resolveTeamForDashboard(
  request: NextRequest,
  userId: string
): Promise<{
  teamId?: string
  teamSlug?: string
  redirect?: string
  allowAccess?: boolean
}> {
  logger.debug('Starting team resolution', {
    url: request.url,
    userId,
    pathname: request.nextUrl.pathname,
    cookies: (await cookies()).getAll(),
  })

  // Early returns for special protected routes to prevent loops
  if (request.nextUrl.pathname === PROTECTED_URLS.NEW_TEAM) {
    logger.debug('Early return for special route', {
      pathname: request.nextUrl.pathname,
    })
    // Return allowAccess: true to indicate this route should be allowed without team check
    return { allowAccess: true }
  }

  // Extract teamIdOrSlug from URL if present
  const segments = request.nextUrl.pathname.split('/')
  const teamIdOrSlug = segments.length > 2 ? segments[2] : null
  const currentTeamId = request.cookies.get(COOKIE_KEYS.SELECTED_TEAM_ID)?.value
  const currentTeamSlug = request.cookies.get(
    COOKIE_KEYS.SELECTED_TEAM_SLUG
  )?.value

  logger.debug('Extracted URL and cookie data', {
    segments,
    teamIdOrSlug,
    currentTeamId,
    currentTeamSlug,
  })

  // Case 1: URL contains team identifier
  if (teamIdOrSlug && teamIdOrSlug !== 'account') {
    logger.debug('Processing URL team identifier', { teamIdOrSlug })
    try {
      const teamId = await resolveTeamId(teamIdOrSlug)
      logger.debug('Resolved team ID', { teamIdOrSlug, teamId })

      const hasAccess = await checkUserTeamAccess(userId, teamId)
      logger.debug('Checked team access', { userId, teamId, hasAccess })

      if (!hasAccess) {
        logger.debug('User denied access to team', {
          userId,
          teamId,
        })
        return { redirect: PROTECTED_URLS.DASHBOARD }
      }

      // If teamIdOrSlug was a slug, use it, otherwise get it from cache
      const isUuid = z.string().uuid().safeParse(teamIdOrSlug).success
      logger.debug('Checking if teamIdOrSlug is UUID', { isUuid, teamIdOrSlug })

      const teamSlug = isUuid
        ? (await kv.get<string>(KV_KEYS.TEAM_ID_TO_SLUG(teamId))) || undefined
        : teamIdOrSlug || undefined

      logger.debug('Resolved team slug', { teamId, teamSlug, isUuid })
      return { teamId, teamSlug }
    } catch (error) {
      logger.error(ERROR_CODES.TEAM_RESOLUTION, 'Failed to resolve team', {
        error,
        teamIdOrSlug,
        stack: error instanceof Error ? error.stack : undefined,
      })
      return { redirect: PROTECTED_URLS.DASHBOARD }
    }
  }

  // Case 2: No team in URL, try cookie
  if (currentTeamId) {
    logger.debug('Trying cookie team ID', { currentTeamId })
    const hasAccess = await checkUserTeamAccess(userId, currentTeamId)
    logger.debug('Checked cookie team access', {
      userId,
      currentTeamId,
      hasAccess,
    })

    if (hasAccess) {
      // Use cached slug or fetch it
      const teamSlug =
        currentTeamSlug ||
        (await kv.get<string>(KV_KEYS.TEAM_ID_TO_SLUG(currentTeamId))) ||
        undefined

      logger.debug('Resolved cookie team slug', { currentTeamId, teamSlug })
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
  logger.debug('Resolving default team', {
    userId,
  })
  const { data: teamsData, error: teamsError } = await supabaseAdmin
    .from('users_teams')
    .select(
      `
      team_id,
      is_default,
      team:teams(*)
    `
    )
    .eq('user_id', userId)

  logger.debug('Fetched teams data', {
    teamsData,
    teamsCount: teamsData?.length,
    error: teamsError,
  })

  if (teamsError) {
    logger.error(ERROR_CODES.TEAM_RESOLUTION, 'Failed to fetch teams', {
      error: teamsError,
      stack: teamsError instanceof Error ? teamsError.stack : undefined,
    })
    return { redirect: '/' }
  }

  if (!teamsData?.length) {
    logger.debug('No teams found, redirecting to new team', { userId })
    return {
      redirect: PROTECTED_URLS.NEW_TEAM,
    }
  }

  const defaultTeam = teamsData.find((t) => t.is_default) || teamsData[0]
  logger.debug('Selected default team', { defaultTeam })

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
  logger.debug('Checking team access', { userId, teamId, cacheKey })

  const cached = await kv.get<boolean>(cacheKey)
  logger.debug('Got cached access value', { cached, cacheKey })

  if (cached !== null) {
    logger.debug('Returning cached access value', { cached, userId, teamId })
    return cached
  }

  const hasAccess = await checkUserTeamAuthorization(userId, teamId)
  logger.debug('Checked direct team access', { hasAccess, userId, teamId })

  await kv.set(cacheKey, hasAccess, { ex: 60 * 60 }) // 1 hour
  logger.debug('Set cache value', { cacheKey, hasAccess })

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
  }
): Promise<NextResponse | null> => {
  logger.debug('Starting URL rewrite', {
    url: request.url,
    method: request.method,
    hostnames,
  })

  if (request.method !== 'GET') {
    logger.debug('Skipping non-GET request', { method: request.method })
    return null
  }

  const url = new URL(request.nextUrl.toString())

  if (url.pathname === '' || url.pathname === '/') {
    url.hostname = hostnames.landingPage
    url.port = ''
    url.protocol = 'https'
    logger.debug('Rewriting root path', { newHostname: url.hostname })
  }

  // Static page mappings
  const hostnameMap = {
    '/terms': hostnames.landingPage,
    '/privacy': hostnames.landingPage,
    '/pricing': hostnames.landingPage,
    '/cookbook': hostnames.landingPage,
    '/changelog': hostnames.landingPage,
    '/blog': hostnames.landingPage,
    '/ai-agents': hostnames.landingPageFramer,
  }

  const matchingPath = Object.keys(hostnameMap).find(
    (path) => url.pathname === path || url.pathname.startsWith(path + '/')
  )

  logger.debug('Checking path mappings', {
    pathname: url.pathname,
    matchingPath,
  })

  if (matchingPath) {
    url.hostname = hostnameMap[matchingPath as keyof typeof hostnameMap]
    url.port = ''
    url.protocol = 'https'
    logger.debug('Rewriting hostname', {
      matchingPath,
      newHostname: url.hostname,
    })
  }

  if (url.hostname === request.nextUrl.hostname) {
    logger.debug('Skipping rewrite for same hostname', {
      hostname: url.hostname,
    })
    return null
  }

  try {
    logger.debug('Fetching content', { url: url.toString() })
    const res = await fetch(url.toString(), { ...request })
    const htmlBody = await res.text()
    logger.debug('Fetched content', {
      status: res.status,
      contentLength: htmlBody.length,
    })

    const modifiedHtmlBody = replaceUrls(htmlBody, url.pathname, 'href="', '">')
    logger.debug('Modified content', {
      originalLength: htmlBody.length,
      modifiedLength: modifiedHtmlBody.length,
    })

    return new NextResponse(modifiedHtmlBody, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    })
  } catch (error) {
    logger.error(ERROR_CODES.URL_REWRITE, 'URL rewrite failed', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      url: url.toString(),
    })
    return null
  }
}
