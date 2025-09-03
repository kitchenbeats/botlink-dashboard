/**
 * Shared utility for fetching user teams
 * This can be used by both actions and route handlers
 */

import 'server-only'

import { l } from '@/lib/clients/logger/logger'
import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import { ClientTeam } from '@/types/dashboard.types'
import { serializeError } from 'serialize-error'

/**
 * Minimal team data needed for routing and authorization
 */
export interface MinimalTeam {
  id: string
  slug: string | null
  is_default?: boolean
}

/**
 * Fetches minimal team data for a user (id and slug only)
 * Optimized for routing and authorization checks
 *
 * @param userId - The user's ID
 * @returns Array of minimal team data or null on error
 */
export async function getUserTeamsMinimal(
  userId: string
): Promise<MinimalTeam[] | null> {
  try {
    const { data: usersTeamsData, error } = await supabaseAdmin
      .from('users_teams')
      .select('is_default, teams!inner(id, slug)')
      .eq('user_id', userId)

    if (error) {
      l.error({
        key: 'get_user_teams_minimal:query_error',
        message: error.message,
        error: serializeError(error),
        user_id: userId,
      })
      return null
    }

    if (!usersTeamsData || usersTeamsData.length === 0) {
      return []
    }

    // Type assertion is safe because of !inner join
    return usersTeamsData.map((userTeam: any) => ({
      id: userTeam.teams.id,
      slug: userTeam.teams.slug,
      is_default: userTeam.is_default,
    }))
  } catch (err) {
    l.error({
      key: 'get_user_teams_minimal:unexpected_error',
      error: serializeError(err),
      user_id: userId,
    })
    return null
  }
}

/**
 * Fetches full team data for a user with all metadata
 * Used when full team information is needed
 *
 * @param userId - The user's ID
 * @returns Array of full team data with metadata
 */
export async function getUserTeamsFull(userId: string): Promise<ClientTeam[]> {
  const { data: usersTeamsData, error } = await supabaseAdmin
    .from('users_teams')
    .select('*, teams (*)')
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  if (!usersTeamsData || usersTeamsData.length === 0) {
    return []
  }

  const teamIds = usersTeamsData.map((userTeam) => userTeam.teams.id)

  try {
    const { data: allConnectedDefaultTeamRelations, error: relationsError } =
      await supabaseAdmin
        .from('users_teams')
        .select('team_id, user_id, is_default')
        .in('team_id', teamIds)
        .eq('is_default', true)

    if (relationsError) {
      throw relationsError
    }

    const defaultUserIds = new Set(
      allConnectedDefaultTeamRelations?.map((relation) => relation.user_id) ||
        []
    )

    const { data: defaultTeamAuthUsers, error: authUsersError } =
      await supabaseAdmin
        .from('auth_users')
        .select('id, email')
        .in('id', Array.from(defaultUserIds))

    if (authUsersError) {
      l.error({
        key: 'get_user_teams_full:supabase_error',
        message: authUsersError.message,
        error: serializeError(authUsersError),
        user_id: userId,
      })

      return usersTeamsData.map((userTeam) => ({
        ...userTeam.teams,
        is_default: userTeam.is_default,
      }))
    }

    const userEmailMap = new Map(
      defaultTeamAuthUsers?.map((user) => [user.id, user.email]) || []
    )

    const teams: ClientTeam[] = usersTeamsData.map((userTeam) => {
      const team = userTeam.teams
      const defaultTeamRelation = allConnectedDefaultTeamRelations.find(
        (relation) => relation.team_id === team.id
      )

      let transformedDefaultName
      // generate a transformed default name if the team is a default team and the team name is the same as the default user's email
      if (
        defaultTeamRelation &&
        team.name === userEmailMap.get(defaultTeamRelation.user_id)
      ) {
        const email = team.name
        const splitEmail = email.split('@')

        if (splitEmail.length > 0 && splitEmail[0]) {
          const username =
            splitEmail[0].charAt(0).toUpperCase() + splitEmail[0].slice(1)
          transformedDefaultName = `${username}'s Team`
        }
      }

      return {
        ...team,
        is_default: userTeam.is_default,
        transformed_default_name: transformedDefaultName,
      }
    })

    return teams
  } catch (err) {
    l.error({
      key: 'get_user_teams_full:unexpected_error',
      error: serializeError(err),
      user_id: userId,
      context: {
        usersTeamsData,
      },
    })

    return usersTeamsData.map((userTeam) => ({
      ...userTeam.teams,
      is_default: userTeam.is_default,
    }))
  }
}
