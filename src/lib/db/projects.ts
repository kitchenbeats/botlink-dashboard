import { getDb, handleDbError } from './index';
import type {
  Project,
  InsertProject,
  UpdateProject,
  ProjectWithFiles,
} from '../types/database';

/**
 * Project Repository
 * Handles project CRUD operations
 */

// Create project
export async function createProject(data: InsertProject): Promise<Project> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data: project, error } = await db
      .from('projects')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return project;
  }, 'createProject');
}

// Get project by ID
export async function getProject(id: string): Promise<Project | null> {
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
export async function listProjects(teamId: string): Promise<Project[]> {
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

// Alias for compatibility (team-based)
export async function listTeamProjects(teamId: string): Promise<Project[]> {
  return listProjects(teamId);
}

// Update project
export async function updateProject(
  id: string,
  updates: UpdateProject
): Promise<Project> {
  return handleDbError(async () => {
    const db = await getDb();
    const { data, error} = await db
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
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
      .update({ last_opened_at: new Date().toISOString() })
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
): Promise<Project[]> {
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
