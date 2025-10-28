import { getSystemAgents } from '@/lib/services/system-agents'
import { getTeam } from '@/lib/utils/cached-server-functions'
import { createClient } from '@/lib/clients/supabase/server'
import type { Tables } from '@/types/database.types'
import Link from 'next/link'
import { Suspense } from 'react'

async function AgentsContent({ params }: { params: Promise<{ teamIdOrSlug: string }> }) {
  const { teamIdOrSlug: teamId } = await params
  const teamResult = await getTeam({ teamId })

  if (!teamResult?.data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Team not found</h2>
          <p className="text-muted-foreground">
            The team you're looking for doesn't exist or you don't have access.
          </p>
        </div>
      </div>
    )
  }

  const systemAgents = await getSystemAgents()

  const db = await createClient()
  const { data: customAgents, error } = await db
    .from('agents')
    .select('*')
    .eq('team_id', teamResult.data.id)
    .order('name')

  if (error) throw error
  const agents = (customAgents || []) as Tables<'agents'>[]

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
          href={`/dashboard/${teamId}/agents/new`}
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
        {agents.length === 0 ? (
          <div className="border border-dashed rounded-lg p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No custom agents yet</h3>
            <p className="text-muted-foreground mb-4">
              Create a custom agent for specialized tasks
            </p>
            <Link
              href={`/dashboard/${teamId}/agents/new`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Create Custom Agent
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Link
                key={agent.id}
                href={`/dashboard/${teamId}/agents/${agent.id}`}
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

export default function AgentsPage({
  params,
}: {
  params: Promise<{ teamIdOrSlug: string }>
}) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><div>Loading...</div></div>}>
      <AgentsContent params={params} />
    </Suspense>
  )
}
