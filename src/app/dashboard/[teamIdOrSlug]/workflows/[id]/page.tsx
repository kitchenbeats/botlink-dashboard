import { createClient } from '@/lib/supabase/server';
import { getUserTeams } from '@/lib/db/teams';
import { getWorkflowById } from '@/lib/db';
import { redirect } from 'next/navigation';
import { WorkflowForm } from '@/components/workflow-form';
import { DeleteButton } from '@/components/delete-button';
import { deleteWorkflowAction } from '@/actions';

interface WorkflowPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user's teams
  const teams = await getUserTeams(user.id);
  if (teams.length === 0) {
    redirect('/onboarding');
  }

  const workflow = await getWorkflowById(id, teams[0].id);
  if (!workflow) {
    redirect('/workflows');
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Edit Workflow</h1>
          <p className="text-muted-foreground mt-1">
            Modify your agent workflow
          </p>
        </div>
        <DeleteButton
          id={workflow.id}
          name={workflow.name}
          type="workflow"
          deleteAction={deleteWorkflowAction}
          redirectPath="/workflows"
        />
      </div>

      <WorkflowForm workflow={workflow} mode="edit" />
    </div>
  );
}
