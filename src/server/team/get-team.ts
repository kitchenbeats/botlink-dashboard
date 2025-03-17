import 'server-only'

import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import { TeamWithDefault } from '@/types/dashboard'
import { z } from 'zod'
import { authActionClient } from '@/lib/clients/action'
import { returnServerError } from '@/lib/utils/action'

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

    const teamWithDefault: TeamWithDefault = {
      ...team,
      is_default: userTeamsRelationData?.is_default,
    }

    return teamWithDefault
  })

export const getUserTeams = authActionClient
  .metadata({ serverFunctionName: 'getUserTeams' })
  .action(async ({ ctx }) => {
    const { user } = ctx

    const { data: usersTeamsData, error } = await supabaseAdmin
      .from('users_teams')
      .select('*, teams (*)')
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    if (!usersTeamsData || usersTeamsData.length === 0) {
      return returnServerError('No teams found.')
    }

    const teams: TeamWithDefault[] = usersTeamsData.map((userTeam) => {
      const team = userTeam.teams
      return { ...team, is_default: userTeam.is_default }
    })

    return teams
  })
