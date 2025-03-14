import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import {
  getAuthRedirect,
  getUserSession,
  handleTeamResolution,
  handleUrlRewrites,
  isDashboardRoute,
  resolveTeamForDashboard,
} from './server/middleware'
import {
  LANDING_PAGE_DOMAIN,
  LANDING_PAGE_FRAMER_DOMAIN,
  BLOG_FRAMER_DOMAIN,
  DOCS_NEXT_DOMAIN,
} from '@/configs/domains'
import { PROTECTED_URLS } from './configs/urls'

// Main middleware function
export async function middleware(request: NextRequest) {
  try {
    // 1. Setup response and Supabase client
    const response = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Redirect to dashboard if user is logged in and on landing page
    if (
      request.nextUrl.pathname === '/' &&
      (await supabase.auth.getSession()).data.session
    ) {
      return NextResponse.redirect(
        new URL(PROTECTED_URLS.DASHBOARD, request.url)
      )
    }

    // 2. Handle URL rewrites first (early return for non-dashboard routes)
    const rewriteResponse = await handleUrlRewrites(request, {
      landingPage: LANDING_PAGE_DOMAIN,
      landingPageFramer: LANDING_PAGE_FRAMER_DOMAIN,
      blogFramer: BLOG_FRAMER_DOMAIN,
      docsNext: DOCS_NEXT_DOMAIN,
    })

    if (rewriteResponse) return rewriteResponse

    // 3. Refresh session and handle auth redirects
    const { error, data } = await getUserSession(supabase)

    // Handle authentication redirects
    const authRedirect = getAuthRedirect(request, !error)
    if (authRedirect) return authRedirect

    // Early return for non-dashboard routes or no user
    if (!data?.user || !isDashboardRoute(request.nextUrl.pathname)) {
      return response
    }

    // 4. Handle team resolution for all dashboard routes
    const teamResult = await resolveTeamForDashboard(request, data.user.id)

    // 5. Process team resolution result
    return handleTeamResolution(request, response, teamResult)
  } catch (error) {
    // Return a basic response to avoid infinite loops
    return NextResponse.next({
      request,
    })
  }
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
