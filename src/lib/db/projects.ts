import { getDb, handleDbError } from './index';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

/**
 * Project Repository
 * Handles project CRUD operations
 */

// Type for project with files join result
export type ProjectWithFiles = {
  project: Tables<'projects'>;
  files: Tables<'files'>[];
};

// Type for project with sandbox status
export type ProjectWithStatus = Tables<'projects'> & {
  sandbox_status: 'running' | 'stopped' | null;
};

// Create project
export async function createProject(data: TablesInsert<'projects'>): Promise<Tables<'projects'>> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data: project, error } = await db
      .from('projects')
      .insert(data as never)
      .select()
      .single();

    if (error) throw error;
    return project;
  }, 'createProject');
}

// Get project by ID
export async function getProject(id: string): Promise<Tables<'projects'> | null> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }, 'getProject');
}

// Get project with files
export async function getProjectWithFiles(id: string): Promise<ProjectWithFiles | null> {
  return handleDbError(async () => {
    const db = await getDb();

    // Get project
    const { data: project, error: projectError } = await db
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError && projectError.code !== 'PGRST116') throw projectError;
    if (!project) return null;

    // Get files
    const { data: files, error: filesError } = await db
      .from('files')
      .select('*')
      .eq('project_id', id)
      .order('path');

    if (filesError) throw filesError;

    return {
      project,
      files: files || [],
    };
  }, 'getProjectWithFiles');
}

// List projects for team (E2B architecture)
export async function listProjects(teamId: string): Promise<Tables<'projects'>[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('projects')
      .select('*')
      .eq('team_id', teamId)
      .order('last_opened_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }, 'listProjects');
}

// List projects with sandbox status
export async function listProjectsWithStatus(teamId: string): Promise<ProjectWithStatus[]> {
  return handleDbError(async () => {
    const db = await getDb();

    // Get all projects for team
    const { data: projects, error: projectsError } = await db
      .from('projects')
      .select('*')
      .eq('team_id', teamId)
      .order('last_opened_at', { ascending: false });

    if (projectsError) throw projectsError;
    if (!projects) return [];

    // Get all active sandboxes for these projects
    const projectIds = (projects as Tables<'projects'>[]).map(p => p.id);
    const { data: sandboxes, error: sandboxesError } = await db
      .from('sandbox_sessions')
      .select('project_id, status')
      .in('project_id', projectIds)
      .in('status', ['starting', 'ready'])
      .order('created_at', { ascending: false });

    if (sandboxesError) throw sandboxesError;

    // Create a map of project_id -> sandbox status
    const sandboxMap = new Map<string, 'running' | 'stopped'>();
    (sandboxes || []).forEach((s: { project_id: string }) => {
      if (!sandboxMap.has(s.project_id)) {
        sandboxMap.set(s.project_id, 'running');
      }
    });

    // Combine projects with sandbox status
    return (projects as Tables<'projects'>[]).map(project => ({
      ...project,
      sandbox_status: sandboxMap.get(project.id) || null,
    }));
  }, 'listProjectsWithStatus');
}

// Alias for compatibility (team-based)
export async function listTeamProjects(teamId: string): Promise<Tables<'projects'>[]> {
  return listProjects(teamId);
}

// Update project
export async function updateProject(
  id: string,
  updates: TablesUpdate<'projects'>
): Promise<Tables<'projects'>> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error} = await db
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, 'updateProject');
}

// Update last_opened_at timestamp
export async function touchProject(id: string): Promise<void> {
  return handleDbError(async () => {
    const db = await getDb();
    const { error } = await db
      .from('projects')
      .update({ last_opened_at: new Date().toISOString() } as never)
      .eq('id', id);

    if (error) throw error;
  }, 'touchProject');
}

// Delete project
export async function deleteProject(id: string): Promise<void> {
  return handleDbError(async () => {
    const db = await getDb();
    const { error } = await db
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }, 'deleteProject');
}

// Search projects for team
export async function searchProjects(
  teamId: string,
  query: string
): Promise<Tables<'projects'>[]> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error } = await db
      .from('projects')
      .select('*')
      .eq('team_id', teamId)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('last_opened_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }, 'searchProjects');
}
