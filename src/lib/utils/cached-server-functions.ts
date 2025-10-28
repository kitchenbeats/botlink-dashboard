import 'server-only'

import { cache } from 'react'
import {
  getUserTeams as getUserTeamsUncached,
  getTeam as getTeamUncached,
} from '@/server/team/get-team'

/**
 * Cached version of getUserTeams.
 *
 * Uses React's cache() to deduplicate calls within a single request.
 * This prevents multiple database queries when teams are accessed
 * multiple times during a single page render.
 */
export const getUserTeams = cache(getUserTeamsUncached)

/**
 * Cached version of getTeam.
 *
 * Uses React's cache() to deduplicate calls within a single request.
 * This prevents multiple database queries when a team is accessed
 * multiple times during a single page render.
 */
export const getTeam = cache(getTeamUncached)
