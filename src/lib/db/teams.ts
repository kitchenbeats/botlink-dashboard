import { getDb, handleDbError } from './index';

/**
 * Team Repository (E2B Architecture)
 * Teams are the core organizational unit in E2B.
 * Each team has a tier and API keys for sandbox access.
 */

export interface Team {
  id: string;
  created_at: string;
  name: string;
  tier: string;
  email: string | null;
  is_blocked: boolean;
  cluster_id: string | null;
}

export interface TeamApiKey {
  id: string;
  api_key: string | null; // Nullable in latest migrations (security - only hash stored)
  team_id: string;
  created_at: string;
  api_key_hash: string | null;
  api_key_prefix: string | null;
  api_key_length: number | null;
  api_key_mask_prefix: string | null;
  api_key_mask_suffix: string | null;
}

export interface UserTeam {
  id: number;
  user_id: string;
  team_id: string;
  created_at: string;
}

// Get user's teams
export async function getUserTeams(userId: string): Promise<Team[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('users_teams')
      .select('teams(*)')
      .eq('user_id', userId);

    if (error) throw error;

    return data
      .map((row: { teams: Team | Team[] }) => {
        return Array.isArray(row.teams) ? row.teams : [row.teams];
      })
      .flat()
      .filter((team): team is Team => team !== null && team !== undefined);
  }, 'getUserTeams');
}

// Get team by ID
export async function getTeam(id: string): Promise<Team | null> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }, 'getTeam');
}

// Get team's API keys
export async function getTeamApiKeys(teamId: string): Promise<TeamApiKey[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('team_api_keys')
      .select('*')
      .eq('team_id', teamId);

    if (error) throw error;
    return data;
  }, 'getTeamApiKeys');
}

// Check if user is in team
export async function isUserInTeam(userId: string, teamId: string): Promise<boolean> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('users_teams')
      .select('id')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data !== null;
  }, 'isUserInTeam');
}

// Get team members
export async function getTeamMembers(teamId: string): Promise<UserTeam[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('users_teams')
      .select('*')
      .eq('team_id', teamId);

    if (error) throw error;
    return data;
  }, 'getTeamMembers');
}

// Update team
export async function updateTeam(
  id: string,
  updates: Partial<Pick<Team, 'name' | 'is_blocked'>>
): Promise<Team> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, 'updateTeam');
}

// Profile functions (kept for compatibility - profiles not part of E2B but we may use them)
export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }, 'getProfileByUserId');
}

export async function createProfile(data: {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}): Promise<Profile> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data: profile, error } = await db
      .from('profiles')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return profile;
  }, 'createProfile');
}
