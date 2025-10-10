import { createClient } from '@/lib/supabase/server';
import { getUserTeams } from '@/lib/db/teams';
import { getExecutionById, getTasks, getAgents } from '@/lib/db';
import { redirect } from 'next/navigation';
import { ExecutionDetail } from '@/components/execution-detail';

export default async function ExecutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const teams = await getUserTeams(user.id);
  if (teams.length === 0) {
    redirect('/onboarding');
  }

  // For now, use the first org (later we'll add org switcher)
  const currentTeam = teams[0];

  const execution = await getExecutionById(id, currentTeam.id);
  if (!execution) {
    redirect('/executions');
  }

  const tasks = await getTasks(execution.id);
  const agents = await getAgents(currentTeam.id);

  // Fetch workflow if execution has one
  let workflow = null;
  if (execution.workflow_id) {
    const { getWorkflowById } = await import('@/lib/db');
    workflow = await getWorkflowById(execution.workflow_id, currentTeam.id);
  }

  return (
    <ExecutionDetail
      execution={execution}
      tasks={tasks}
      agents={agents}
      workflow={workflow}
    />
  );
}
