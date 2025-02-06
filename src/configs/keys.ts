/*
 * local storage keys in use
 */
export const STORAGE_KEYS = {
  SELECTED_TEAM_ID: 'selected_team_id',
  DEVELOPER_SETTINGS: 'developer_settings',
}

/*
 * react-query keys in use
 */
export const QUERY_KEYS = {
  USER: () => 'user',
  TEAMS: () => 'user-teams',
  TEAM_MEMBERS: (teamId: string) => `team-members/${teamId}`,
  TEAM_API_KEYS: (teamId: string) => `team-api-keys/${teamId}`,
  TEAM_SANDBOXES: (teamId: string) => `team-sandboxes/${teamId}`,
  TEAM_SANDBOX_METRICS: (teamId: string) => `team-sandboxes-metrics/${teamId}`,
  TEAM_TEMPLATES: (teamId: string) => `team-templates/${teamId}`,
  TEAM_INVOICES: (teamId: string) => `team-invoices/${teamId}`,
  TEAM_USAGE: (teamId: string) => `team-usage/${teamId}`,
}

/*
 * cookie keys in use
 */
export const COOKIE_KEYS = {
  API_DOMAIN: 'e2b-api-domain',
  SELECTED_TEAM_ID: 'e2b-selected-team-id',
  SELECTED_TEAM_SLUG: 'e2b-selected-team-slug',
}

/*
 * kv keys in use
 */
export const KV_KEYS = {
  USER_TEAM_ACCESS: (userId: string, teamIdOrSlug: string) =>
    `user-team-access:${userId}:${teamIdOrSlug}`,
  TEAM_SLUG_TO_ID: (slug: string) => `team-slug:${slug}:id`,
  TEAM_ID_TO_SLUG: (teamId: string) => `team-id:${teamId}:slug`,
}
