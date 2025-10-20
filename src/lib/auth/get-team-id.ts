import { createClient } from '@/lib/clients/supabase/server';
import { getUserTeams } from '@/lib/db/teams';

/**
 * Get the current user's team ID (uses first team for now)
 * @returns team ID or null if not authenticated or no teams
 */
export async function getTeamId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const teams = await getUserTeams(user.id);
  if (teams.length === 0) {
    return null;
  }

  // For now, return the first team
  // TODO: Add team selection/switching in the future
  return teams[0]?.id ?? null;
}
