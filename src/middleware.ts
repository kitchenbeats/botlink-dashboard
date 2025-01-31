import { NextResponse, type NextRequest } from "next/server";
import { AUTH_URLS, PROTECTED_URLS } from "./configs/urls";
import { createServerClient } from "@supabase/ssr";
import { cachedUserTeamAccess } from "./server/middleware";
import { COOKIE_KEYS } from "./configs/keys";
import { supabaseAdmin } from "./lib/clients/supabase/admin";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const { error, data } = await supabase.auth.getUser();

  // Redirect unauthenticated users to sign in
  if (request.nextUrl.pathname.startsWith(PROTECTED_URLS.DASHBOARD) && error) {
    return NextResponse.redirect(new URL(AUTH_URLS.SIGN_IN, request.url));
  }

  // Redirect authenticated users to dashboard
  if (request.nextUrl.pathname === "/" && !error) {
    return NextResponse.redirect(
      new URL(PROTECTED_URLS.DASHBOARD, request.url),
    );
  }

  // Handle dashboard root route - determine appropriate team redirect
  if (request.nextUrl.pathname === PROTECTED_URLS.DASHBOARD && data?.user) {
    const selectedTeamId = request.cookies.get(
      COOKIE_KEYS.SELECTED_TEAM_ID,
    )?.value;

    // Verify access to selected team from cookie
    if (selectedTeamId) {
      const hasAccess = await cachedUserTeamAccess(
        data.user.id,
        selectedTeamId,
      );
      if (hasAccess) {
        return NextResponse.redirect(
          new URL(PROTECTED_URLS.SANDBOXES(selectedTeamId), request.url),
        );
      }
    }

    // Find user's teams if no valid selected team
    const { data: teamsData, error: teamsError } = await supabaseAdmin
      .from("users_teams")
      .select(`*`)
      .eq("user_id", data.user.id);

    // Redirect to team creation if user has no teams
    if (teamsError || !teamsData?.length) {
      return NextResponse.redirect(
        new URL(PROTECTED_URLS.NEW_TEAM, request.url),
      );
    }

    // Select default team or first available team
    const teamId =
      teamsData.find((data) => data.is_default)?.team_id ??
      teamsData[0].team_id;

    const redirectResponse = NextResponse.redirect(
      new URL(PROTECTED_URLS.SANDBOXES(teamId), request.url),
    );

    redirectResponse.cookies.set(COOKIE_KEYS.SELECTED_TEAM_ID, teamId);

    return redirectResponse;
  }

  // Verify team access for all dashboard routes except account
  if (
    /^\/dashboard\/(?!account)[^\/]+\//.test(request.nextUrl.pathname) &&
    data?.user
  ) {
    const teamId = request.nextUrl.pathname.split("/")[2];

    try {
      const hasAccess = await cachedUserTeamAccess(data.user.id, teamId);

      if (hasAccess) {
        response.cookies.set(COOKIE_KEYS.SELECTED_TEAM_ID, teamId);
        return response;
      }

      throw new Error("Access denied");
    } catch (error) {
      // Redirect to dashboard and clear team selection on access denial
      const redirectResponse = NextResponse.redirect(
        new URL(PROTECTED_URLS.DASHBOARD, request.url),
      );
      redirectResponse.cookies.delete(COOKIE_KEYS.SELECTED_TEAM_ID);
      return redirectResponse;
    }
  }

  return response;
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
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
