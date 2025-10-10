export const AUTH_URLS = {
  FORGOT_PASSWORD: '/forgot-password',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  CALLBACK: '/api/auth/callback',
  CLI: '/auth/cli',
}

export const PROTECTED_URLS = {
  DASHBOARD: '/dashboard',
  ACCOUNT_SETTINGS: '/dashboard/account',
  NEW_TEAM: '/dashboard/teams/new',
  TEAMS: '/dashboard/teams',
  TEAM: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/team`,

  SANDBOXES: (teamIdOrSlug: string, tab?: 'list' | 'monitoring') =>
    `/dashboard/${teamIdOrSlug}/sandboxes?tab=${tab ?? 'monitoring'}`,

  SANDBOX: (teamIdOrSlug: string, sandboxId: string) =>
    `/dashboard/${teamIdOrSlug}/sandboxes/${sandboxId}`,
  SANDBOX_INSPECT: (teamIdOrSlug: string, sandboxId: string) =>
    `/dashboard/${teamIdOrSlug}/sandboxes/${sandboxId}/inspect`,

  TEMPLATES: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/templates`,
  USAGE: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/usage`,
  BILLING: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/billing`,
  BUDGET: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/budget`,
  KEYS: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/keys`,
  RESET_PASSWORD: '/dashboard/account',

  // BotLink routes
  PROJECTS: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/projects`,
  PROJECT_NEW: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/projects/new`,
  WORKSPACE: (teamIdOrSlug: string, projectId: string) => `/workspace/${projectId}`,
  AGENTS: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/agents`,
  AGENT: (teamIdOrSlug: string, agentId: string) => `/dashboard/${teamIdOrSlug}/agents/${agentId}`,
  AGENT_NEW: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/agents/new`,
  WORKFLOWS: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/workflows`,
  WORKFLOW: (teamIdOrSlug: string, workflowId: string) => `/dashboard/${teamIdOrSlug}/workflows/${workflowId}`,
  WORKFLOW_NEW: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/workflows/new`,
  EXECUTIONS: (teamIdOrSlug: string) => `/dashboard/${teamIdOrSlug}/executions`,
  EXECUTION: (teamIdOrSlug: string, executionId: string) => `/dashboard/${teamIdOrSlug}/executions/${executionId}`,
}

export const HELP_URLS = {
  BUILD_TEMPLATE:
    'https://e2b.dev/docs/sandbox-template#4-build-your-sandbox-template',
  START_COMMAND: 'https://e2b.dev/docs/sandbox-template/start-cmd',
}

export const BASE_URL = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === 'production'
    ? 'https://e2b.dev'
    : `https://${process.env.VERCEL_BRANCH_URL}`
  : 'http://localhost:3000'

export const GITHUB_URL = 'https://github.com/e2b-dev'
