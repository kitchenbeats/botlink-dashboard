import { createClient } from '@/lib/supabase/server';
import { getUserTeams } from '@/lib/db/teams';
import { redirect } from 'next/navigation';
import { ProjectCreationForm } from '@/components/project-creation-form';

export default async function NewProjectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const teams = await getUserTeams(user.id);
  if (teams.length === 0) {
    redirect('/onboarding');
  }

  const currentTeam = teams[0];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Create New Project</h1>
        <p className="text-muted-foreground mt-1">
          Choose a template and start building with AI
        </p>
      </div>

      <ProjectCreationForm teamId={currentTeam.id} />
    </div>
  );
}
