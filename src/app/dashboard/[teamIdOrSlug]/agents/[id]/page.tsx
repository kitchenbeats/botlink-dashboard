import { deleteAgentAction } from '@/actions'
import { AgentForm } from '@/features/agents/agent-form'
import { DeleteButton } from '@/features/agents/delete-button'
import { createClient } from '@/lib/clients/supabase/server'
import { getAgentById } from '@/lib/db'
import { getUserTeams } from '@/lib/db/teams'
import type { Agent } from '@/lib/types/database'
import { redirect } from 'next/navigation'

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Get user's teams
  const teams = await getUserTeams(user.id)
  if (teams.length === 0) {
    redirect('/onboarding')
  }

  const agent = await getAgentById(id)
  if (!agent) {
    redirect('/agents')
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Edit Agent</h1>
          <p className="text-muted-foreground mt-1">
            Update agent configuration and prompts
          </p>
        </div>
        <DeleteButton
          id={agent.id}
          name={agent.name}
          type="agent"
          deleteAction={deleteAgentAction}
          redirectPath="/agents"
        />
      </div>

      <div className="border rounded-lg p-6">
        <AgentForm agent={agent as Agent} mode="edit" />
      </div>
    </div>
  )
}
