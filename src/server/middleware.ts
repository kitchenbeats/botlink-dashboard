import { checkUserTeamAuthorization, resolveTeamId } from '@/lib/utils/server'
import { kv } from '@/lib/clients/kv'
import { KV_KEYS } from '@/configs/keys'
import { NextRequest, NextResponse } from 'next/server'
import { replaceUrls } from '@/configs/domains'
import { COOKIE_KEYS } from '@/configs/keys'
import { PROTECTED_URLS } from '@/configs/urls'
import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import { z } from 'zod'

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
  if (request.nextUrl.pathname === PROTECTED_URLS.NEW_TEAM) {
    return { allowAccess: true }
  }

  const segments = request.nextUrl.pathname.split('/')
  const teamIdOrSlug = segments.length > 2 ? segments[2] : null
  const currentTeamId = request.cookies.get(COOKIE_KEYS.SELECTED_TEAM_ID)?.value
  const currentTeamSlug = request.cookies.get(
    COOKIE_KEYS.SELECTED_TEAM_SLUG
  )?.value

  if (teamIdOrSlug && teamIdOrSlug !== 'account') {
    try {
      const teamId = await resolveTeamId(teamIdOrSlug)
      const hasAccess = await checkUserTeamAccess(userId, teamId)

      if (!hasAccess) {
        return { redirect: PROTECTED_URLS.DASHBOARD }
      }

      const isUuid = z.string().uuid().safeParse(teamIdOrSlug).success
      const teamSlug = isUuid
        ? (await kv.get<string>(KV_KEYS.TEAM_ID_TO_SLUG(teamId))) || undefined
        : teamIdOrSlug || undefined

      return { teamId, teamSlug }
    } catch (error) {
      return { redirect: PROTECTED_URLS.DASHBOARD }
    }
  }

  if (currentTeamId) {
    const hasAccess = await checkUserTeamAccess(userId, currentTeamId)

    if (hasAccess) {
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

  if (teamsError) {
    return { redirect: '/' }
  }

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

  if (cached !== null) {
    return cached
  }

  const hasAccess = await checkUserTeamAuthorization(userId, teamId)
  await kv.set(cacheKey, hasAccess, { ex: 60 * 60 }) // 1 hour

  return hasAccess
}

/**
 * Handles URL rewrites for static pages and content modifications.
 */
export const handleUrlRewrites = async (
  request: NextRequest,
  hostnames: {
    landingPage: string
    landingPageFramer: string
    blogFramer: string
  }
): Promise<NextResponse | null> => {
  if (request.method !== 'GET') {
    return null
  }

  const url = new URL(request.nextUrl.toString())

  // Helper function to update the URL for rewrite.
  const updateUrlHostname = (
    newHostname: string,
    extraInfo?: Record<string, unknown>
  ) => {
    url.hostname = newHostname
    url.port = ''
    url.protocol = 'https'
  }

  // 1. Rewrite the root path to the landing page.
  if (url.pathname === '' || url.pathname === '/') {
    updateUrlHostname(hostnames.landingPage)
  }
  // 2. Special case: /blog/category/xy -> landingPage with "/blog" prefix removed.
  else if (url.pathname.startsWith('/blog/category')) {
    const originalPath = url.pathname
    // Remove the /blog prefix so that '/blog/category/xy' becomes '/category/xy'
    url.pathname = url.pathname.replace(/^\/blog/, '')
    updateUrlHostname(hostnames.landingPage)
  }
  // 3. Static page mappings.
  else {
    const hostnameMap: Record<string, string> = {
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

    if (matchingPath) {
      updateUrlHostname(hostnameMap[matchingPath])
    }
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
    return null
  }
}
