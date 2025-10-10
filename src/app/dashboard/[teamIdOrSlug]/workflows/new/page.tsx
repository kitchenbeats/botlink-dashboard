import { createClient } from '@/lib/supabase/server';
import { getProfileByUserId } from '@/lib/db/teams';
import { redirect } from 'next/navigation';
import { WorkflowForm } from '@/components/workflow-form';

export default async function NewWorkflowPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const profile = await getProfileByUserId(user.id);
  if (!profile) {
    redirect('/onboarding');
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Workflow</h1>
        <p className="text-muted-foreground mt-1">
          Design a new agent workflow
        </p>
      </div>

      <WorkflowForm mode="create" />
    </div>
  );
}
