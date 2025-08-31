import { COOKIE_KEYS } from '@/configs/keys'
import { PROTECTED_URLS } from '@/configs/urls'
import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import { createClient } from '@/lib/clients/supabase/server'
import { getTeamMetadataFromCookiesMemo } from '@/lib/utils/server'
import getUserMemo from '@/server/auth/get-user-memo'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const TAB_URL_MAP: Record<string, (teamId: string) => string> = {
  sandboxes: (teamId) => PROTECTED_URLS.SANDBOXES(teamId),
  templates: (teamId) => PROTECTED_URLS.TEMPLATES(teamId),
  usage: (teamId) => PROTECTED_URLS.USAGE(teamId),
  billing: (teamId) => PROTECTED_URLS.BILLING(teamId),
  budget: (teamId) => PROTECTED_URLS.BUDGET(teamId),
  keys: (teamId) => PROTECTED_URLS.KEYS(teamId),
  team: (teamId) => PROTECTED_URLS.TEAM(teamId),
  account: (_) => PROTECTED_URLS.ACCOUNT_SETTINGS,
  personal: (_) => PROTECTED_URLS.ACCOUNT_SETTINGS,
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tab = searchParams.get('tab')

  if (!tab || !TAB_URL_MAP[tab]) {
    return NextResponse.redirect(
      new URL(PROTECTED_URLS.SANDBOXES(request.url), request.url)
    )
  }

  const supabase = await createClient()

  const { data, error } = await getUserMemo(supabase)

  if (error || !data.user) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  const metadata = await getTeamMetadataFromCookiesMemo(request.url)

  if (!metadata) {
    const cookieStore = await cookies()

    let teamId = cookieStore.get(COOKIE_KEYS.SELECTED_TEAM_ID)?.value
    let teamSlug = cookieStore.get(COOKIE_KEYS.SELECTED_TEAM_SLUG)?.value

    const { data: teamsData } = await supabaseAdmin
      .from('users_teams')
      .select(
        `
        team_id,
        is_default,
        team:teams(*)
      `
      )
      .eq('user_id', data.user.id)

    if (!teamsData?.length) {
      return NextResponse.redirect(
        new URL(PROTECTED_URLS.NEW_TEAM, request.url)
      )
    }

    const defaultTeam = teamsData.find((t) => t.is_default) || teamsData[0]!
    teamId = defaultTeam.team_id
    teamSlug = defaultTeam.team?.slug || defaultTeam.team_id
  }

  const urlGenerator = TAB_URL_MAP[tab]
  const redirectPath = urlGenerator(metadata.slug || metadata.id)

  return NextResponse.redirect(new URL(redirectPath, request.url))
}
