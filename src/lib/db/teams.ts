import { getDb, handleDbError } from './index';
import type { Tables, TablesUpdate } from '@/types/database.types';

/**
 * Team Repository (E2B Architecture)
 * Teams are the core organizational unit in E2B.
 * Each team has a tier and API keys for sandbox access.
 */

// Export Supabase-generated types for Teams and related tables
export type Team = Tables<'teams'>;
export type TeamApiKey = Tables<'team_api_keys'>;
export type UserTeam = Tables<'users_teams'>;

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
  updates: TablesUpdate<'teams'>
): Promise<Team> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('teams')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, 'updateTeam');
}
