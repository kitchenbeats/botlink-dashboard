'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Stats {
  users: { total: number }
  teams: { total: number; bySubscription: Record<string, number> }
  projects: { total: number }
  sandboxes: { total: number; active: number; paused: number }
  conversations: { total: number }
  messages: { total: number }
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch('/api/admin/stats')
        if (!response.ok) throw new Error('Failed to load stats')
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    }

    loadStats()
    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Platform Overview & Management</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Users */}
          <StatCard
            title="Total Users"
            value={stats.users.total}
            icon="👥"
            color="blue"
          />

          {/* Teams */}
          <StatCard
            title="Total Teams"
            value={stats.teams.total}
            icon="🏢"
            color="green"
          />

          {/* Projects */}
          <StatCard
            title="Total Projects"
            value={stats.projects.total}
            icon="📁"
            color="purple"
          />

          {/* Active Sandboxes */}
          <StatCard
            title="Active Sandboxes"
            value={stats.sandboxes.active}
            subtitle={`${stats.sandboxes.total} total`}
            icon="🖥️"
            color="orange"
          />
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sandbox Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Sandbox Status</h2>
            <div className="space-y-3">
              <StatusRow label="Total Sandboxes" value={stats.sandboxes.total} />
              <StatusRow label="Active" value={stats.sandboxes.active} color="green" />
              <StatusRow label="Paused/Stopped" value={stats.sandboxes.paused} color="gray" />
            </div>
            <Link
              href="/dashboard/admin/sandboxes"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
            >
              Manage Sandboxes →
            </Link>
          </div>

          {/* Subscription Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Subscriptions</h2>
            <div className="space-y-3">
              {Object.entries(stats.teams.bySubscription).map(([tier, count]) => (
                <StatusRow key={tier} label={tier} value={count as number} />
              ))}
              {Object.keys(stats.teams.bySubscription).length === 0 && (
                <p className="text-gray-500 text-sm">No subscription data</p>
              )}
            </div>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Activity Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-600 text-sm">Total Conversations</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.conversations.total}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Messages</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.messages.total}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Avg Messages/Conversation</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.conversations.total > 0
                  ? Math.round(stats.messages.total / stats.conversations.total)
                  : 0}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickLink
            title="Manage Templates"
            description="Edit template metadata and tier access"
            href="/dashboard/admin/templates"
            icon="📦"
          />
          <QuickLink
            title="Manage Sandboxes"
            description="View and manage all E2B sandboxes"
            href="/dashboard/admin/sandboxes"
            icon="🖥️"
          />
          <QuickLink
            title="Manage Users"
            description="View all users and their teams"
            href="/dashboard/admin/users"
            icon="👥"
          />
          <QuickLink
            title="System Health"
            description="View Nomad & infrastructure status"
            href="http://104.197.131.132:4646/ui"
            icon="📊"
            external
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string
  value: number
  subtitle?: string
  icon: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <span className={`text-2xl ${colorClasses[color]} p-2 rounded-lg`}>{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
      {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
    </div>
  )
}

function StatusRow({
  label,
  value,
  color = 'blue',
}: {
  label: string
  value: number
  color?: 'blue' | 'green' | 'gray' | 'orange'
}) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    gray: 'text-gray-600',
    orange: 'text-orange-600',
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <span className={`font-semibold ${colorClasses[color]}`}>{value}</span>
    </div>
  )
}

function QuickLink({
  title,
  description,
  href,
  icon,
  external,
}: {
  title: string
  description: string
  href: string
  icon: string
  external?: boolean
}) {
  const Component = external ? 'a' : Link
  const props = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}

  return (
    <Component
      href={href}
      className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
      {...props}
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>
      </div>
    </Component>
  )
}
