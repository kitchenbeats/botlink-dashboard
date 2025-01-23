/*
 * react-query keys in use
 */
export const QUERY_KEYS = {
  USER: () => "user",
  TEAMS: () => "user-teams",
  TEAM_MEMBERS: (teamId: string) => `team-members/${teamId}`,
  TEAM_API_KEYS: (teamId: string) => `team-api-keys/${teamId}`,
  TEAM_SANDBOXES: (teamId: string, apiUrl: string) =>
    `team-sandboxes/${teamId}/${apiUrl}`,
  TEAM_SANDBOX_METRICS: (teamId: string, apiUrl: string) =>
    `team-sandboxes-metrics/${teamId}/${apiUrl}`,
  TEAM_TEMPLATES: (teamId: string, apiUrl: string) =>
    `team-templates/${teamId}/${apiUrl}`,
  TEAM_INVOICES: (teamId: string) => `team-invoices/${teamId}`,
  TEAM_USAGE: (teamId: string) => `team-usage/${teamId}`,
};
