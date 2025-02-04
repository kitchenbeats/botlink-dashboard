import { createClient } from "@/lib/clients/supabase/server";
import { redirect } from "next/navigation";
import { PROTECTED_URLS } from "@/configs/urls";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const returnTo = requestUrl.searchParams.get("returnTo")?.toString();

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // If returnTo is present, redirect there
  if (returnTo) {
    // Ensure returnTo is a relative URL to prevent open redirect vulnerabilities
    const returnToUrl = new URL(returnTo, origin);
    if (returnToUrl.origin === origin) {
      return redirect(returnTo);
    }
  }

  // Default redirect to dashboard
  return redirect(PROTECTED_URLS.DASHBOARD);
}
