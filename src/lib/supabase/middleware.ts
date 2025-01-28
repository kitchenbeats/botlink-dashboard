import { AUTH_URLS, PROTECTED_URLS } from "@/configs/urls";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
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
  const { error } = await supabase.auth.getUser();

  // protected routes
  if (request.nextUrl.pathname.startsWith(PROTECTED_URLS.DASHBOARD) && error) {
    return NextResponse.redirect(new URL(AUTH_URLS.SIGN_IN, request.url));
  }

  if (request.nextUrl.pathname === "/" && !error) {
    return NextResponse.redirect(
      new URL(PROTECTED_URLS.DASHBOARD, request.url),
    );
  }

  return response;
};

export const checkSessionAndRedirect = async (request: NextRequest) => {
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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (
    !session &&
    request.nextUrl.pathname.startsWith(PROTECTED_URLS.DASHBOARD)
  ) {
    return NextResponse.redirect(new URL(AUTH_URLS.SIGN_IN, request.url));
  }

  if (session && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(
      new URL(PROTECTED_URLS.DASHBOARD, request.url),
    );
  }

  return response;
};
