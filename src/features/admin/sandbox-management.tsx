'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { killSandbox } from '@/server/actions/admin'

interface Sandbox {
  id: string
  e2b_session_id: string
  project_id: string | null
  template: string
  status: string
  created_at: string
  updated_at: string | null
  stopped_at: string | null
  expires_at: string | null
  projects: { id: string; name: string; team_id: string } | null
}

export function SandboxManagement() {
  const [sandboxes, setSandboxes] = useState<Sandbox[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [killingIds, setKillingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadSandboxes()
    // Refresh every 10 seconds
    const interval = setInterval(loadSandboxes, 10000)
    return () => clearInterval(interval)
  }, [])

  async function loadSandboxes() {
    try {
      const response = await fetch('/api/admin/sandboxes')
      if (!response.ok) throw new Error('Failed to load sandboxes')
      const data = await response.json()
      setSandboxes(data.sandboxes)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sandboxes')
    } finally {
      setLoading(false)
    }
  }

  async function handleKill(sandbox: Sandbox) {
    if (!confirm(`Kill sandbox ${sandbox.e2b_session_id}?`)) return

    setKillingIds(prev => new Set(prev).add(sandbox.id))

    try {
      const result = await killSandbox({
        sandboxId: sandbox.e2b_session_id,
        dbId: sandbox.id,
      })

      if (result?.data?.success) {
        toast.success('Sandbox killed successfully')
        await loadSandboxes()
      } else {
        toast.error('Failed to kill sandbox')
      }
    } catch (error) {
      console.error('Kill sandbox error:', error)
      toast.error('Failed to kill sandbox')
    } finally {
      setKillingIds(prev => {
        const next = new Set(prev)
        next.delete(sandbox.id)
        return next
      })
    }
  }

  if (loading && sandboxes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sandboxes...</p>
        </div>
      </div>
    )
  }

  const activeSandboxes = sandboxes.filter(s => s.status === 'ready' || s.status === 'starting')
  const stoppedSandboxes = sandboxes.filter(s => s.status === 'stopped' || s.status === 'error')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/dashboard/admin" className="text-blue-600 hover:text-blue-700 mb-2 inline-block">
              ← Back to Admin Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Sandbox Management</h1>
            <p className="text-gray-600 mt-2">
              {sandboxes.length} total ({activeSandboxes.length} active, {stoppedSandboxes.length} stopped)
            </p>
          </div>
          <button
            onClick={loadSandboxes}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Active Sandboxes */}
        {activeSandboxes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Active Sandboxes ({activeSandboxes.length})</h2>
            <SandboxTable
              sandboxes={activeSandboxes}
              onKill={handleKill}
              killingIds={killingIds}
            />
          </div>
        )}

        {/* Stopped Sandboxes */}
        {stoppedSandboxes.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Stopped Sandboxes ({stoppedSandboxes.length})</h2>
            <SandboxTable
              sandboxes={stoppedSandboxes}
              onKill={handleKill}
              killingIds={killingIds}
              stopped
            />
          </div>
        )}

        {sandboxes.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">No sandboxes found</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SandboxTable({
  sandboxes,
  onKill,
  killingIds,
  stopped,
}: {
  sandboxes: Sandbox[]
  onKill: (sandbox: Sandbox) => void
  killingIds: Set<string>
  stopped?: boolean
}) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sandbox ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Template
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sandboxes.map((sandbox) => (
              <tr key={sandbox.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {sandbox.e2b_session_id.slice(0, 16)}...
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {sandbox.projects ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {sandbox.projects.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Team: {sandbox.projects.team_id.slice(0, 8)}...
                      </p>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">No project</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sandbox.template}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={sandbox.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(sandbox.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {!stopped && (
                    <button
                      onClick={() => onKill(sandbox)}
                      disabled={killingIds.has(sandbox.id)}
                      className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      {killingIds.has(sandbox.id) ? 'Killing...' : 'Kill'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ready: 'bg-green-100 text-green-800',
    starting: 'bg-blue-100 text-blue-800',
    stopped: 'bg-gray-100 text-gray-800',
    error: 'bg-red-100 text-red-800',
  }

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  )
}
