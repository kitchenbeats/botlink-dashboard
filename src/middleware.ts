import { NextResponse, type NextRequest } from 'next/server'
import { AUTH_URLS, PROTECTED_URLS } from './configs/urls'
import { createServerClient } from '@supabase/ssr'
import { handleUrlRewrites, resolveTeamForDashboard } from './server/middleware'
import { COOKIE_KEYS } from './configs/keys'
import { logger } from './lib/clients/logger'
import { INFO_CODES } from './configs/logs'
import {
  LANDING_PAGE_DOMAIN,
  LANDING_PAGE_FRAMER_DOMAIN,
  BLOG_FRAMER_DOMAIN,
  DOCS_NEXT_DOMAIN,
} from '@/configs/domains'

const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
}

export async function middleware(request: NextRequest) {
  // 1. Handle URL rewrites first (early return for non-dashboard routes)
  const rewriteResponse = await handleUrlRewrites(request, {
    landingPage: LANDING_PAGE_DOMAIN,
    landingPageFramer: LANDING_PAGE_FRAMER_DOMAIN,
    blogFramer: BLOG_FRAMER_DOMAIN,
    docsNext: DOCS_NEXT_DOMAIN,
  })

  if (rewriteResponse) return rewriteResponse

  // 2. Setup response and Supabase client
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
        },
      },
    }
  )

  // 3. Refresh session and handle auth redirects
  const { error, data } = await supabase.auth.getUser()

  // Handle authentication redirects
  if (request.nextUrl.pathname.startsWith(PROTECTED_URLS.DASHBOARD) && error) {
    logger.info(INFO_CODES.AUTH_REDIRECT, 'Redirecting to sign in', {
      url: request.url,
      error: error.message,
    })
    return NextResponse.redirect(new URL(AUTH_URLS.SIGN_IN, request.url))
  }

  if (request.nextUrl.pathname === '/' && !error) {
    return NextResponse.redirect(new URL(PROTECTED_URLS.DASHBOARD, request.url))
  }

  // Early return for non-dashboard routes or no user
  if (
    !data?.user ||
    !request.nextUrl.pathname.startsWith(PROTECTED_URLS.DASHBOARD)
  ) {
    return response
  }

  // 4. Handle team resolution for all dashboard routes
  const { teamId, teamSlug, redirect } = await resolveTeamForDashboard(
    request,
    data.user.id
  )

  if (!teamId) {
    // No valid team access, redirect to dashboard
    const redirectResponse = NextResponse.redirect(
      new URL(redirect || PROTECTED_URLS.DASHBOARD, request.url),
      { status: 302 }
    )
    // Delete both cookies
    redirectResponse.cookies.delete(COOKIE_KEYS.SELECTED_TEAM_ID)
    redirectResponse.cookies.delete(COOKIE_KEYS.SELECTED_TEAM_SLUG)
    return redirectResponse
  }

  // 5. Handle redirects and set cookie
  if (redirect) {
    const redirectResponse = NextResponse.redirect(
      new URL(redirect, request.url),
      { status: 302 }
    )
    // Set both cookies
    redirectResponse.cookies.set(
      COOKIE_KEYS.SELECTED_TEAM_ID,
      teamId,
      COOKIE_OPTIONS
    )
    if (teamSlug) {
      redirectResponse.cookies.set(
        COOKIE_KEYS.SELECTED_TEAM_SLUG,
        teamSlug,
        COOKIE_OPTIONS
      )
    }
    return redirectResponse
  }

  // 6. Continue with request, ensuring cookies are set
  response.cookies.set(COOKIE_KEYS.SELECTED_TEAM_ID, teamId, COOKIE_OPTIONS)
  if (teamSlug) {
    response.cookies.set(
      COOKIE_KEYS.SELECTED_TEAM_SLUG,
      teamSlug,
      COOKIE_OPTIONS
    )
  }
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - api routes
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
