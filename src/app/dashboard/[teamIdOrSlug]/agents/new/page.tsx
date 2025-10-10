import { createClient } from '@/lib/supabase/server';
import { getUserTeams } from '@/lib/db/teams';
import { redirect } from 'next/navigation';
import { AgentForm } from '@/components/agent-form';

export default async function NewAgentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const teams = await getUserTeams(user.id);
  if (teams.length === 0) {
    redirect('/onboarding');
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Agent</h1>
        <p className="text-muted-foreground mt-1">
          Configure a new AI agent with custom prompts and parameters
        </p>
      </div>

      <div className="border rounded-lg p-6">
        <AgentForm mode="create" />
      </div>
    </div>
  );
}
