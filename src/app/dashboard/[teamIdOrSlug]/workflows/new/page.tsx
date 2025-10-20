import { WorkflowForm } from '@/features/agents/workflow-form'
import { createClient } from '@/lib/clients/supabase/server'
import { getAgents } from '@/lib/db'
import { getUserTeams } from '@/lib/db/teams'
import { redirect } from 'next/navigation'

export default async function NewWorkflowPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const teams = await getUserTeams(user.id)
  if (teams.length === 0) {
    redirect('/onboarding')
  }

  // Get user's custom agents for this team
  const currentTeam = teams[0]
  if (!currentTeam) {
    redirect('/onboarding')
  }
  const agents = await getAgents(currentTeam.id)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Workflow</h1>
        <p className="text-muted-foreground mt-1">
          Design a custom agent workflow using your agents
        </p>
      </div>

      <WorkflowForm mode="create" agents={agents} />
    </div>
  )
}
