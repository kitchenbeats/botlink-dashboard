/**
 * Sandbox Inspection Proxy Route
 *
 * This route provides a team-agnostic way to access sandbox inspection pages.
 * It automatically discovers which team owns a sandbox and redirects to the
 * appropriate team-scoped URL.
 *
 * Use Case: CLI tools and external integrations can generate URLs without
 * knowing the team context, simplifying URL generation and improving UX.
 *
 * Flow:
 * 1. Validate and sanitize the sandbox ID
 * 2. Authenticate the user
 * 3. Fetch user's teams with optimized query
 * 4. Search for sandbox ownership (cookie team first, then all teams)
 * 5. Resolve team slug and update cache
 * 6. Redirect to team-scoped inspection URL
 *
 * Security:
 * - Input validation with Zod
 * - Authentication required
 * - Team membership verification
 * - Sandbox ownership verification
 *
 * Performance:
 * - Redis caching for team slug mappings
 * - Cookie-based team preference for faster resolution
 * - Optimized database queries with selective field retrieval
 */

import { SUPABASE_AUTH_HEADERS } from '@/configs/api'
import { COOKIE_KEYS, KV_KEYS } from '@/configs/keys'
import { PROTECTED_URLS } from '@/configs/urls'
import { infra } from '@/lib/clients/api'
import { kv } from '@/lib/clients/kv'
import { l } from '@/lib/clients/logger/logger'
import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import { createClient } from '@/lib/clients/supabase/server'
import { components as InfraComponents } from '@/types/infra-api'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// ============================================================================
// Route Config
// ============================================================================

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export const revalidate = 0
export const maxDuration = 60 // seconds

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Route parameters with async params for Next.js App Router
 */
interface RouteParams {
  params: Promise<{
    sandboxId: string
  }>
}

/**
 * Minimal team data for routing
 */
interface MinimalTeam {
  id: string
  slug: string | null
  is_default?: boolean
}

/**
 * User team relationship from database
 */
interface UserTeamData {
  is_default?: boolean
  teams: {
    id: string
    slug: string | null
  }
}

/**
 * Sandbox details from infrastructure API
 */
type SandboxDetails = InfraComponents['schemas']['SandboxDetail']

/**
 * Result of sandbox search operation
 */
interface SandboxSearchResult {
  found: boolean
  team?: MinimalTeam
  sandbox?: SandboxDetails
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Sandbox ID validation schema
 * Accepts standard sandbox ID format (alphanumeric with hyphens/underscores)
 * Maximum length of 100 characters to prevent DoS attacks
 */
const SandboxIdSchema = z
  .string()
  .min(1, 'Sandbox ID is required')
  .max(100, 'Sandbox ID too long')
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/, 'Invalid sandbox ID format')

// ============================================================================
// Error Response Helpers
// ============================================================================

/**
 * Creates a redirect response to the dashboard with error logging
 */
function redirectToDashboard(
  request: NextRequest,
  logKey: string,
  context: Record<string, unknown> = {}
): NextResponse {
  l.warn({
    key: logKey,
    ...context,
  })
  return NextResponse.redirect(new URL(PROTECTED_URLS.DASHBOARD, request.url))
}

/**
 * Creates a redirect response to sign-in page
 */
function redirectToSignIn(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/sign-in', request.url))
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Attempts to find a sandbox in a specific team
 *
 * @param sandboxId - The ID of the sandbox to find
 * @param teamId - The team ID to search in
 * @param accessToken - User's access token for API authentication
 * @returns Promise with sandbox details if found, null otherwise
 */
async function findSandboxInTeam(
  sandboxId: string,
  teamId: string,
  accessToken: string
): Promise<SandboxDetails | null> {
  try {
    const res = await infra.GET('/sandboxes/{sandboxID}', {
      params: {
        path: {
          sandboxID: sandboxId,
        },
      },
      headers: {
        ...SUPABASE_AUTH_HEADERS(accessToken, teamId),
      },
      cache: 'no-store', // Always fetch fresh data for security
    })

    // Only return data if request was successful
    if (res.response?.status === 200 && res.data) {
      return res.data
    }

    return null
  } catch (error) {
    // Log non-404 errors as they might indicate infrastructure issues
    if (error instanceof Error && !error.message.includes('404')) {
      l.error({
        key: 'find_sandbox_in_team:error',
        error,
        sandbox_id: sandboxId,
        team_id: teamId,
      })
    }
    return null
  }
}

/**
 * Searches for a sandbox across all user's teams
 * Optimized to check cookie-selected team first for better performance
 *
 * @param sandboxId - The sandbox ID to search for
 * @param usersTeams - List of teams the user has access to
 * @param cookieTeamId - Team ID from user's cookies (if any)
 * @param accessToken - User's access token
 * @returns Search result with team and sandbox details if found
 */
async function searchSandboxInTeams(
  sandboxId: string,
  usersTeams: MinimalTeam[],
  cookieTeamId: string | undefined,
  accessToken: string
): Promise<SandboxSearchResult> {
  // Optimization: Try cookie team first if it exists
  // This handles the common case where user is working within one team
  if (cookieTeamId) {
    const cookieTeam = usersTeams.find((t) => t.id === cookieTeamId)
    if (cookieTeam) {
      const sandboxDetails = await findSandboxInTeam(
        sandboxId,
        cookieTeamId,
        accessToken
      )

      if (sandboxDetails) {
        return {
          found: true,
          team: cookieTeam,
          sandbox: sandboxDetails,
        }
      }
    }
  }

  // Fall back to searching all teams
  // This handles team switching and first-time access scenarios
  for (const team of usersTeams) {
    // Skip if we already checked this team above
    if (team.id === cookieTeamId) {
      continue
    }

    const sandboxDetails = await findSandboxInTeam(
      sandboxId,
      team.id,
      accessToken
    )

    if (sandboxDetails) {
      return {
        found: true,
        team: team,
        sandbox: sandboxDetails,
      }
    }
  }

  return { found: false }
}

/**
 * Resolves and caches team slug
 * Falls back to team ID if slug is not available
 *
 * @param team - Team object with ID and possible slug
 * @returns Resolved team identifier for URL
 */
async function resolveAndCacheTeamSlug(team: MinimalTeam): Promise<string> {
  // Use existing slug if available
  if (team.slug) {
    // Cache bidirectional mapping for future lookups
    await Promise.all([
      kv.set(KV_KEYS.TEAM_ID_TO_SLUG(team.id), team.slug, {
        ex: 60 * 60, // 1 hour TTL
      }),
      kv.set(KV_KEYS.TEAM_SLUG_TO_ID(team.slug), team.id, {
        ex: 60 * 60,
      }),
    ]).catch((error) => {
      // Log but don't fail - caching is optimization, not critical
      l.warn({
        key: 'resolve_team_slug:cache_error',
        error,
        team_id: team.id,
      })
    })
    return team.slug
  }

  // Try to get slug from cache
  try {
    const cachedSlug = await kv.get<string>(KV_KEYS.TEAM_ID_TO_SLUG(team.id))
    if (cachedSlug) {
      return cachedSlug
    }
  } catch (error) {
    l.warn({
      key: 'resolve_team_slug:cache_read_error',
      error,
      team_id: team.id,
    })
  }

  // Fall back to team ID if no slug available
  return team.id
}

/**
 * Updates user's team selection cookies for UI consistency
 *
 * @param response - NextResponse object to add cookies to
 * @param team - Selected team
 * @param teamSlug - Resolved team slug
 */
function updateTeamCookies(
  response: NextResponse,
  team: MinimalTeam,
  teamSlug: string
): void {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  }

  // Always set team ID cookie
  response.cookies.set(COOKIE_KEYS.SELECTED_TEAM_ID, team.id, cookieOptions)

  // Only set slug cookie if it's different from ID
  if (teamSlug !== team.id) {
    response.cookies.set(
      COOKIE_KEYS.SELECTED_TEAM_SLUG,
      teamSlug,
      cookieOptions
    )
  }
}

// ============================================================================
// Main Route Handler
// ============================================================================

/**
 * GET /dashboard/inspect/[sandboxId]
 *
 * Resolves sandbox ownership and redirects to appropriate team-scoped URL
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing sandbox ID
 * @returns Redirect response to team-scoped sandbox inspection page
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // ========================================================================
    // Step 1: Validate and sanitize input
    // ========================================================================

    const { sandboxId: rawSandboxId } = await params

    // Validate sandbox ID format to prevent injection attacks
    const validationResult = SandboxIdSchema.safeParse(rawSandboxId)

    if (!validationResult.success) {
      return redirectToDashboard(request, 'inspect_sandbox:invalid_id', {
        sandbox_id: rawSandboxId,
        validation_errors: validationResult.error.flatten(),
      })
    }

    const sandboxId = validationResult.data

    // ========================================================================
    // Step 2: Authenticate user
    // ========================================================================

    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      l.info({
        key: 'inspect_sandbox:unauthenticated',
        sandbox_id: sandboxId,
        error: authError,
      })
      return redirectToSignIn(request)
    }

    const userId = authData.user.id

    // Get session for API access token
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()

    if (sessionError || !sessionData.session) {
      l.warn({
        key: 'inspect_sandbox:session_error',
        user_id: userId,
        sandbox_id: sandboxId,
        error: sessionError,
      })
      return redirectToSignIn(request)
    }

    const accessToken = sessionData.session.access_token

    // ========================================================================
    // Step 3: Fetch user's teams using supabaseAdmin
    // ========================================================================

    const { data: usersTeamsData, error: teamsError } = await supabaseAdmin
      .from('users_teams')
      .select('is_default, teams!inner(id, slug)')
      .eq('user_id', userId)

    if (teamsError || !usersTeamsData || usersTeamsData.length === 0) {
      l.warn({
        key: 'inspect_sandbox:teams_fetch_error',
        user_id: userId,
        sandbox_id: sandboxId,
        error: teamsError,
      })

      return redirectToDashboard(request, 'inspect_sandbox:no_teams', {
        user_id: userId,
        sandbox_id: sandboxId,
      })
    }

    // Transform to MinimalTeam format
    const usersTeams: MinimalTeam[] = (usersTeamsData as UserTeamData[]).map(
      (userTeam) => ({
        id: userTeam.teams.id,
        slug: userTeam.teams.slug,
        is_default: userTeam.is_default,
      })
    )

    // ========================================================================
    // Step 4: Get team preference from cookies for optimization
    // ========================================================================

    const cookieStore = await cookies()
    const cookieTeamId = cookieStore.get(COOKIE_KEYS.SELECTED_TEAM_ID)?.value

    // ========================================================================
    // Step 5: Search for sandbox across teams
    // ========================================================================

    const searchResult = await searchSandboxInTeams(
      sandboxId,
      usersTeams,
      cookieTeamId,
      accessToken
    )

    if (!searchResult.found || !searchResult.team || !searchResult.sandbox) {
      return redirectToDashboard(request, 'inspect_sandbox:not_found', {
        user_id: userId,
        sandbox_id: sandboxId,
        teams_checked: usersTeams.map((t) => t.id),
      })
    }

    // ========================================================================
    // Step 6: Resolve team slug and prepare redirect
    // ========================================================================

    const teamSlug = await resolveAndCacheTeamSlug(searchResult.team)

    const redirectUrl = new URL(
      PROTECTED_URLS.SANDBOX_INSPECT(teamSlug, sandboxId),
      request.url
    )

    const response = NextResponse.redirect(redirectUrl)

    // ========================================================================
    // Step 7: Update cookies for UI consistency
    // ========================================================================

    updateTeamCookies(response, searchResult.team, teamSlug)

    // ========================================================================
    // Step 8: Log successful resolution for monitoring
    // ========================================================================

    l.info({
      key: 'inspect_sandbox:success',
      user_id: userId,
      sandbox_id: sandboxId,
      team_id: searchResult.team.id,
      team_slug: teamSlug,
      redirect_url: redirectUrl.pathname,
    })

    return response
  } catch (error) {
    // ========================================================================
    // Global error handler - ensures we never expose internal errors
    // ========================================================================

    l.error({
      key: 'inspect_sandbox:unexpected_error',
      error: error as Error,
      sandbox_id: (await params).sandboxId,
    })

    // Always redirect to dashboard on unexpected errors for security
    return NextResponse.redirect(new URL(PROTECTED_URLS.DASHBOARD, request.url))
  }
}
