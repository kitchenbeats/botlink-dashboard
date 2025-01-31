import { NextResponse, type NextRequest } from "next/server";
import { AUTH_URLS, PROTECTED_URLS } from "./configs/urls";
import { createServerClient } from "@supabase/ssr";
import { cachedUserTeamAccess } from "./server/middleware";
import { COOKIE_KEYS, KV_KEYS } from "./configs/keys";
import { supabaseAdmin } from "./lib/clients/supabase/admin";
import { kv } from "@vercel/kv";

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

  // This will refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const { error, data } = await supabase.auth.getUser();

  // protected routes
  if (request.nextUrl.pathname.startsWith(PROTECTED_URLS.DASHBOARD) && error) {
    console.log("[Middleware] User not authenticated, redirecting to sign in");
    return NextResponse.redirect(new URL(AUTH_URLS.SIGN_IN, request.url));
  }

  if (request.nextUrl.pathname === "/" && !error) {
    console.log("[Middleware] User authenticated, redirecting to dashboard");
    return NextResponse.redirect(
      new URL(PROTECTED_URLS.DASHBOARD, request.url),
    );
  }

  // Handle /dashboard root route
  if (request.nextUrl.pathname === PROTECTED_URLS.DASHBOARD && data?.user) {
    console.log(
      "[Middleware] Handling dashboard root route for user:",
      data.user.id,
    );

    const selectedTeamId = request.cookies.get(
      COOKIE_KEYS.SELECTED_TEAM_ID,
    )?.value;

    console.log(
      "[Middleware] Current selected team from cookie:",
      selectedTeamId,
    );

    // If there's a selected team, verify access
    if (selectedTeamId) {
      console.log("[Middleware] Verifying access to selected team");
      const hasAccess = await cachedUserTeamAccess(
        data.user.id,
        selectedTeamId,
      );
      if (hasAccess) {
        console.log(
          "[Middleware] Access verified, redirecting to team sandboxes",
        );
        return NextResponse.redirect(
          new URL(PROTECTED_URLS.SANDBOXES(selectedTeamId), request.url),
        );
      }
      console.log(
        "[Middleware] No access to selected team, finding alternative",
      );
      // If no access, continue to find a valid team
    }

    // Find user's teams
    console.log("[Middleware] Fetching user's teams");
    const { data: teamsData, error: teamsError } = await supabaseAdmin
      .from("users_teams")
      .select(`*`)
      .eq("user_id", data.user.id);

    if (teamsError || !teamsData?.length) {
      console.log(
        "[Middleware] No teams found, redirecting to new team creation",
      );
      return NextResponse.redirect(
        new URL(PROTECTED_URLS.NEW_TEAM, request.url),
      );
    }

    const teamId =
      teamsData.find((data) => data.is_default)?.team_id ??
      teamsData[0].team_id;

    console.log(
      "[Middleware] Selected team:",
      teamId,
      "Default:",
      teamsData.find((data) => data.is_default) ? "Yes" : "No",
    );

    const redirectResponse = NextResponse.redirect(
      new URL(PROTECTED_URLS.SANDBOXES(teamId), request.url),
    );

    // Set cookie without clearing cache
    redirectResponse.cookies.set(COOKIE_KEYS.SELECTED_TEAM_ID, teamId);

    return redirectResponse;
  }

  // catch all dashboard routes except account
  if (
    /^\/dashboard\/(?!account)[^\/]+\//.test(request.nextUrl.pathname) &&
    data?.user
  ) {
    const teamId = request.nextUrl.pathname.split("/")[2];
    console.log("[Middleware] Verifying access for team route:", teamId);

    try {
      const hasAccess = await cachedUserTeamAccess(data.user.id, teamId);
      console.log(
        "[Middleware] Raw access result:",
        hasAccess,
        "type:",
        typeof hasAccess,
      );

      if (hasAccess) {
        console.log("[Middleware] Access authorized, proceeding");
        response.cookies.set(COOKIE_KEYS.SELECTED_TEAM_ID, teamId);
        return response;
      }

      throw new Error("Access denied");
    } catch (error) {
      console.log("[Middleware] Access denied or error:", error);
      // Redirect to dashboard to find a valid team
      const redirectResponse = NextResponse.redirect(
        new URL(PROTECTED_URLS.DASHBOARD, request.url),
      );
      // Clear the selected team cookie since access was denied
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
