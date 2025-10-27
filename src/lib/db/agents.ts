import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { getDb, handleDbError } from './index'

// Get all system agents
export async function getSystemAgents(): Promise<Tables<'agents'>[]> {
  return handleDbError(async () => {
    const db = await getDb()
    const { data, error } = await db
      .from('agents')
      .select('*')
      .is('team_id', null)
      .order('name')

    if (error) throw error
    return data || []
  }, 'getSystemAgents')
}

// Get agent by ID
export async function getAgent(
  id: string,
  teamId?: string
): Promise<Tables<'agents'> | null> {
  return handleDbError(async () => {
    const db = await getDb()
    let query = db.from('agents').select('*').eq('id', id)

    // Add team_id filter if provided for security
    // Note: agents can be system agents (team_id is null) or team-specific
    if (teamId) {
      query = query.or(`team_id.eq.${teamId},team_id.is.null`)
    }

    const { data, error } = await query.single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }, 'getAgent')
}

// Alias for getAgent (for compatibility)
export async function getAgentById(
  id: string,
  teamId?: string
): Promise<Tables<'agents'> | null> {
  return getAgent(id, teamId)
}

// Get agent by type (for system agents)
export async function getSystemAgentByType(
  type: 'planner' | 'executor' | 'reviewer'
): Promise<Tables<'agents'> | null> {
  return handleDbError(async () => {
    const db = await getDb()
    const { data, error} = await db
      .from('agents')
      .select('*')
      .is('team_id', null)
      .eq('type', type)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }, 'getSystemAgentByType')
}

// Get team's custom agents
export async function getAgents(teamId: string): Promise<Tables<'agents'>[]> {
  return handleDbError(async () => {
    const db = await getDb()
    const { data, error } = await db
      .from('agents')
      .select('*')
      .eq('team_id', teamId)
      .order('name')

    if (error) throw error
    return data || []
  }, 'getAgents')
}

// Get agents by execution (for dynamic agents created during workflow)
export async function getAgentsByExecution(executionId: string): Promise<Tables<'agents'>[]> {
  return handleDbError(async () => {
    const db = await getDb()
    const { data, error } = await db
      .from('agents')
      .select('*')
      .eq('execution_id', executionId)
      .order('created_at')

    if (error) throw error
    return data || []
  }, 'getAgentsByExecution')
}

// Create agent
export async function createAgent(
  data: TablesInsert<'agents'>
): Promise<Tables<'agents'>> {
  return handleDbError(async () => {
    const db = await getDb()
    const { data: agent, error } = await db
      .from('agents')
      .insert(data as never) // Type cast to work around Supabase SSR type inference issue
      .select()
      .single()

    if (error) throw error
    return agent
  }, 'createAgent')
}

// Create custom agent (dynamically created by orchestrator)
export async function createCustomAgent(data: {
  project_id: string
  name: string
  role: string
  system_prompt: string
  model: string
  tools: string[]
  type: 'custom'
}): Promise<Tables<'agents'>> {
  return createAgent({
    name: data.name,
    type: data.type,
    model: data.model,
    system_prompt: data.system_prompt,
    config: {
      role: data.role,
      project_id: data.project_id,
      tools: data.tools,
      dynamically_created: true,
      created_at: new Date().toISOString(),
    } as never,
  })
}
