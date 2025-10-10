import { createClient } from '@/lib/supabase/server';
import { getUserTeams } from '@/lib/db/teams';
import { getExecutions } from '@/lib/db';
import { redirect } from 'next/navigation';
import { ExecutionListItem } from '@/components/execution-list-item';

export default async function ExecutionsPage() {
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

  const executions = await getExecutions(currentTeam.id);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Executions</h1>
        <p className="text-muted-foreground mt-1">
          View and manage workflow executions
        </p>
      </div>

      {executions.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">No executions yet</h3>
          <p className="text-muted-foreground">
            Run a workflow to see execution history here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {executions.map((execution) => (
            <ExecutionListItem key={execution.id} execution={execution} />
          ))}
        </div>
      )}
    </div>
  );
}
