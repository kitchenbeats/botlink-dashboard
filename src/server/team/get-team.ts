import 'server-only'

import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import { checkAuthenticated, guard } from '@/lib/utils/server'
import { TeamWithDefault } from '@/types/dashboard'
import { UnauthorizedError } from '@/types/errors'
import { z } from 'zod'

export const getTeam = guard(
  z.object({
    teamId: z.string().uuid(),
  }),
  async ({ teamId }) => {
    const { user } = await checkAuthenticated()

    const { data: userTeamsRelationData, error: userTeamsRelationError } =
      await supabaseAdmin
        .from('users_teams')
        .select('*')
        .eq('user_id', user.id)
        .eq('team_id', teamId)
        .single()

    if (userTeamsRelationError) {
      throw UnauthorizedError('User is not authorized to view this team')
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
  }
)
