import { WorkspaceLayout } from '@/features/workspace/workspace-layout'
import { createClient } from '@/lib/clients/supabase/server'
import type { Project } from '@/lib/types/database'
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

  // Ensure workspace is ready (gets/resumes/creates sandbox and returns preview URL)
  const workspaceResult = await ensureWorkspaceReady(projectId)

  return (
    <WorkspaceLayout
      project={project as Project}
      error={workspaceResult.success ? undefined : workspaceResult.error}
      errorMessage={workspaceResult.success ? undefined : workspaceResult.errorMessage}
      previewUrl={workspaceResult.success ? workspaceResult.previewUrl : undefined}
    />
  )
}
