import { createClient } from '@/lib/supabase/server';
import { getUserTeams } from '@/lib/db/teams';
import { getWorkflows } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function WorkflowsPage() {
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

  const workflows = await getWorkflows(currentTeam.id);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground mt-1">
            Design and manage your agent workflows
          </p>
        </div>
        <Link
          href="/workflows/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Create Workflow
        </Link>
      </div>

      {workflows.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first workflow to get started
          </p>
          <Link
            href="/workflows/new"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Create Workflow
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <Link
              key={workflow.id}
              href={`/workflows/${workflow.id}`}
              className="block p-6 border rounded-lg hover:border-primary transition"
            >
              <h3 className="font-semibold mb-2">{workflow.name}</h3>
              {workflow.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {workflow.description}
                </p>
              )}
              <div className="text-xs text-muted-foreground">
                {workflow.nodes.length} nodes • {workflow.edges.length} connections
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
