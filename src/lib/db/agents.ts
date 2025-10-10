import { getDb, handleDbError } from './index';
import type { Agent } from '../types/database';

// Get all system agents
export async function getSystemAgents(): Promise<Agent[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('agents')
      .select('*')
      .is('team_id', null)
      .order('name');

    if (error) throw error;
    return data || [];
  }, 'getSystemAgents');
}

// Get agent by ID
export async function getAgent(id: string, teamId?: string): Promise<Agent | null> {
  return handleDbError(async () => {
    const db = await getDb();
    let query = db
      .from('agents')
      .select('*')
      .eq('id', id);

    // Add team_id filter if provided for security
    // Note: agents can be system agents (team_id is null) or team-specific
    if (teamId) {
      query = query.or(`team_id.eq.${teamId},team_id.is.null`);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }, 'getAgent');
}

// Alias for getAgent (for compatibility)
export async function getAgentById(id: string, teamId?: string): Promise<Agent | null> {
  return getAgent(id, teamId);
}

// Get agent by type (for system agents)
export async function getSystemAgentByType(
  type: 'planner' | 'executor' | 'reviewer'
): Promise<Agent | null> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('agents')
      .select('*')
      .is('team_id', null)
      .eq('type', type)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }, 'getSystemAgentByType');
}

// Get org's custom agents
export async function getAgents(teamId: string): Promise<Agent[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('agents')
      .select('*')
      .eq('team_id', teamId)
      .order('name');

    if (error) throw error;
    return data || [];
  }, 'getAgents');
}

// Create agent
export async function createAgent(data: Omit<Agent, 'id' | 'created_at' | 'updated_at' | 'is_system'>): Promise<Agent> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data: agent, error } = await db
      .from('agents')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return agent;
  }, 'createAgent');
}
