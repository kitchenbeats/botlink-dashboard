import { checkAuthenticated } from "@/lib/utils/server";
import { PROTECTED_URLS } from "@/configs/urls";
import { supabaseAdmin } from "@/lib/clients/supabase/admin";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { COOKIE_KEYS } from "@/configs/keys";

export const GET = async () => {
  const { user } = await checkAuthenticated();

  const cookieStore = await cookies();
  const selectedTeamId = cookieStore.get(COOKIE_KEYS.SELECTED_TEAM_ID)?.value;

  if (selectedTeamId) {
    return redirect(PROTECTED_URLS.SANDBOXES(selectedTeamId));
  }

  const { data: teamsData, error: teamsError } = await supabaseAdmin
    .from("users_teams")
    .select(`*`)
    .eq("user_id", user.id);

  if (teamsError) {
    return redirect(PROTECTED_URLS.NEW_TEAM);
  }

  const teamId =
    teamsData.find((data) => data.is_default)?.team_id ?? teamsData[0].team_id;

  if (!teamId) {
    return redirect(PROTECTED_URLS.NEW_TEAM);
  }

  return redirect(PROTECTED_URLS.SANDBOXES(teamId));
};
