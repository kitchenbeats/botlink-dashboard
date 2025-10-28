import { Button } from '@/ui/primitives/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getTeam } from '@/lib/utils/cached-server-functions'
import { createClient } from '@/lib/clients/supabase/server'
import type { Tables } from '@/types/database.types'
import { ProjectCard } from '@/features/projects/project-card'
import { Suspense } from 'react'

async function ProjectsContent({ params }: { params: Promise<{ teamIdOrSlug: string }> }) {
  const { teamIdOrSlug } = await params
  const teamResult = await getTeam({ teamId: teamIdOrSlug })

  if (!teamResult?.data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Team not found</h2>
          <p className="text-muted-foreground">The team you're looking for doesn't exist or you don't have access.</p>
        </div>
      </div>
    )
  }

  const team = teamResult.data
  const db = await createClient()

  // Get all projects for team
  const { data: projects, error: projectsError } = await db
    .from('projects')
    .select('*')
    .eq('team_id', team.id)
    .order('last_opened_at', { ascending: false })

  if (projectsError) throw projectsError
  if (!projects) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage your coding projects
            </p>
          </div>
          <Button asChild>
            <Link href={`/dashboard/${teamIdOrSlug}/projects/new`}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>
        <div className="border rounded-lg p-12 text-center">
          <h3 className="text-lg font-medium mb-2">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get started by creating your first project
          </p>
          <Button asChild variant="outline">
            <Link href={`/dashboard/${teamIdOrSlug}/projects/new`}>Create Project</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Get all active sandboxes for these projects
  const typedProjects = projects as Tables<'projects'>[]
  const projectIds = typedProjects.map(p => p.id)
  const { data: sandboxes, error: sandboxesError } = await db
    .from('sandbox_sessions')
    .select('project_id, status')
    .in('project_id', projectIds)
    .in('status', ['starting', 'ready'])
    .order('created_at', { ascending: false })

  if (sandboxesError) throw sandboxesError

  // Create a map of project_id -> sandbox status
  const sandboxMap = new Map<string, 'running' | 'stopped'>()
  ;(sandboxes || []).forEach((s: { project_id: string }) => {
    if (!sandboxMap.has(s.project_id)) {
      sandboxMap.set(s.project_id, 'running')
    }
  })

  // Combine projects with sandbox status
  const projectsWithStatus = typedProjects.map(project => ({
    ...project,
    sandbox_status: sandboxMap.get(project.id) || null,
  }))

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage your coding projects
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/${teamIdOrSlug}/projects/new`}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projectsWithStatus.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}

export default function ProjectsPage({
  params,
}: {
  params: Promise<{ teamIdOrSlug: string }>
}) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><div>Loading...</div></div>}>
      <ProjectsContent params={params} />
    </Suspense>
  )
}
