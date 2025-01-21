export const AUTH_URLS = {
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  SIGN_IN: "/auth/sign-in",
  SIGN_UP: "/auth/sign-up",
  CALLBACK: "/api/auth/callback",
};

export const PROTECTED_URLS = {
  DASHBOARD: "/dashboard",
  ACCOUNT_SETTINGS: "/dashboard/account",
  NEW_TEAM: "/dashboard/teams/new",
  TEAMS: "/dashboard/teams",
  TEAM: (teamId: string) => `/dashboard/${teamId}`,
  SANDBOXES: (teamId: string) => `/dashboard/${teamId}/sandboxes`,
  TEMPLATES: (teamId: string) => `/dashboard/${teamId}/templates`,
};

export const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";
