import 'server-only'

import { authActionClient } from '@/lib/clients/action'
import { l } from '@/lib/clients/logger/logger'
import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import { returnServerError } from '@/lib/utils/action'
import { ClientTeam } from '@/types/dashboard.types'
import { serializeError } from 'serialize-error'
import { z } from 'zod'
import { getUserTeamsFull } from './get-user-teams-util'

const GetTeamSchema = z.object({
  teamId: z.string().uuid(),
})

export const getTeam = authActionClient
  .schema(GetTeamSchema)
  .metadata({ serverFunctionName: 'getTeam' })
  .action(async ({ parsedInput, ctx }) => {
    const { teamId } = parsedInput
    const { user } = ctx

    const { data: userTeamsRelationData, error: userTeamsRelationError } =
      await supabaseAdmin
        .from('users_teams')
        .select('*')
        .eq('user_id', user.id)
        .eq('team_id', teamId)
        .single()

    if (userTeamsRelationError) {
      return returnServerError('User is not authorized to view this team')
    }

    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single()

    if (teamError) {
      throw teamError
    }

    const ClientTeam: ClientTeam = {
      ...team,
      is_default: userTeamsRelationData?.is_default,
    }

    return ClientTeam
  })

export const getUserTeams = authActionClient
  .metadata({ serverFunctionName: 'getUserTeams' })
  .action(async ({ ctx }) => {
    const { user } = ctx

    try {
      const teams = await getUserTeamsFull(user.id)

      if (teams.length === 0) {
        return returnServerError('No teams found.')
      }

      return teams
    } catch (error) {
      l.error({
        key: 'get_user_teams:action_error',
        error: serializeError(error),
        user_id: user.id,
      })

      throw error
    }
  })
