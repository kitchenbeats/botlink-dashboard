import { WorkspaceLayout } from '@/features/workspace/workspace-layout'
import { createClient } from '@/lib/clients/supabase/server'
import type { File, Project } from '@/lib/types/database'
import { getProject } from '@/lib/db/projects'
import { ensureWorkspaceReady } from '@/server/actions/workspace'
import { redirect } from 'next/navigation'

interface WorkspacePageProps {
  params: Promise<{ projectId: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { projectId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Get project from database
  const project = await getProject(projectId)

  if (!project) {
    redirect('/dashboard')
  }

  // Ensure workspace is ready (handles initialization with distributed lock)
  // This prevents race conditions when multiple requests try to initialize
  const workspaceResult = await ensureWorkspaceReady(projectId)

  return (
    <WorkspaceLayout
      project={project as Project}
      files={workspaceResult.files as File[]}
      error={workspaceResult.success ? undefined : workspaceResult.error}
      errorMessage={workspaceResult.success ? undefined : workspaceResult.errorMessage}
      restoredFromSnapshot={workspaceResult.success ? workspaceResult.restoredFromSnapshot : false}
    />
  )
}
