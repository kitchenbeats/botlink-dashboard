import { getTeam } from '@/lib/utils/cached-server-functions'
import { createClient } from '@/lib/clients/supabase/server'
import type { Tables } from '@/types/database.types'
import Link from 'next/link'
import { Suspense } from 'react'

async function WorkflowsContent({ params }: { params: Promise<{ teamIdOrSlug: string }> }) {
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

  const db = await createClient()
  const { data: workflows, error } = await db
    .from('workflows')
    .select('*')
    .eq('team_id', teamResult.data.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  const workflowList = (workflows || []) as Tables<'workflows'>[]

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
          href={`/dashboard/${teamId}/workflows/new`}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Create Workflow
        </Link>
      </div>

      {workflowList.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first workflow to get started
          </p>
          <Link
            href={`/dashboard/${teamId}/workflows/new`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Create Workflow
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflowList.map((workflow) => (
            <Link
              key={workflow.id}
              href={`/dashboard/${teamId}/workflows/${workflow.id}`}
              className="block p-6 border rounded-lg hover:border-primary transition"
            >
              <h3 className="font-semibold mb-2">{workflow.name}</h3>
              {workflow.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {workflow.description}
                </p>
              )}
              <div className="text-xs text-muted-foreground">
                {Array.isArray(workflow.nodes) ? workflow.nodes.length : 0}{' '}
                nodes •{' '}
                {Array.isArray(workflow.edges) ? workflow.edges.length : 0}{' '}
                connections
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function WorkflowsPage({
  params,
}: {
  params: Promise<{ teamIdOrSlug: string }>
}) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><div>Loading...</div></div>}>
      <WorkflowsContent params={params} />
    </Suspense>
  )
}
