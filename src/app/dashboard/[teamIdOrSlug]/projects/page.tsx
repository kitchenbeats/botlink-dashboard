import { Button } from '@/ui/primitives/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cacheTag, cacheLife } from 'next/cache'
import { getTeam } from '@/lib/utils/cached-server-functions'
import { listProjectsWithStatus } from '@/lib/db/projects'
import { ProjectCard } from '@/features/projects/project-card'

async function getCachedProjects(teamId: string) {
  'use cache'
  cacheTag('projects', `projects-${teamId}`)
  cacheLife('minutes') // Built-in profile: updates frequently

  return await listProjectsWithStatus(teamId)
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ teamIdOrSlug: string }>
}) {
  const { teamIdOrSlug: teamId } = await params

  const teamResult = await getTeam({ teamId })

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
  const projects = await getCachedProjects(team.id)

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
          <Link href={`/dashboard/${teamId}/projects/new`}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <h3 className="text-lg font-medium mb-2">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get started by creating your first project
          </p>
          <Button asChild variant="outline">
            <Link href={`/dashboard/${teamId}/projects/new`}>Create Project</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
