import { createClient } from '@/lib/clients/supabase/server'
import { getAgents } from '@/lib/db'
import { getUserTeams } from '@/lib/db/teams'
import { getSystemAgents } from '@/lib/services/system-agents'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AgentsPage() {
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

  // For now, use the first org (later we'll add org switcher)
  const currentTeam = teams[0]
  if (!currentTeam) {
    redirect('/onboarding')
  }

  const systemAgents = getSystemAgents()
  const customAgents = await getAgents(currentTeam.id)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-muted-foreground mt-1">
            System agents and custom agents
          </p>
        </div>
        <Link
          href="/agents/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Create Custom Agent
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">System Agents</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {systemAgents.map((agent) => (
            <div
              key={agent.id}
              className="block p-6 border rounded-lg bg-muted/50"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{agent.name}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  System
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {agent.model}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {agent.system_prompt}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Custom Agents</h2>
        {customAgents.length === 0 ? (
          <div className="border border-dashed rounded-lg p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No custom agents yet</h3>
            <p className="text-muted-foreground mb-4">
              Create a custom agent for specialized tasks
            </p>
            <Link
              href="/agents/new"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Create Custom Agent
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customAgents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="block p-6 border rounded-lg hover:border-primary transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{agent.name}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                    {agent.type}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {agent.model}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {agent.system_prompt}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
