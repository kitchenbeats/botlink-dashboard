import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getProjectData } from '@/actions/projects';
import { WorkspaceLayout } from '@/components/workspace/workspace-layout';

interface WorkspacePageProps {
  params: Promise<{ projectId: string }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { projectId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const projectData = await getProjectData(projectId);

  if (!projectData) {
    redirect('/dashboard');
  }

  return <WorkspaceLayout project={projectData.project} files={projectData.files} />;
}
