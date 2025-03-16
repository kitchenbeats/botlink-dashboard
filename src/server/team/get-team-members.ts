import 'server-only'

import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import { User } from '@supabase/supabase-js'
import { z } from 'zod'
import { TeamMemberInfo } from './types'
import { authActionClient, returnServerError } from '@/lib/clients/action'

const GetTeamMembersSchema = z.object({
  teamId: z.string().uuid(),
})

export const getTeamMembers = authActionClient
  .schema(GetTeamMembersSchema)
  .metadata({ serverFunctionName: 'getTeamMembers' })
  .action(async ({ parsedInput, ctx }) => {
    const { teamId } = parsedInput
    const { user } = ctx

    const { error: userTeamsRelationError } = await supabaseAdmin
      .from('users_teams')
      .select('*')
      .eq('user_id', user.id)
      .eq('team_id', teamId)
      .single()

    if (userTeamsRelationError) {
      return returnServerError('User is not authorized to get team members')
    }

    const { data, error } = await supabaseAdmin
      .from('users_teams')
      .select('*')
      .eq('team_id', teamId)

    if (error) {
      throw error
    }

    if (!data) {
      return []
    }

    const userResponses = await Promise.all(
      data.map(
        async (userTeam) =>
          (await supabaseAdmin.auth.admin.getUserById(userTeam.user_id)).data
            .user
      )
    )

    return userResponses
      .filter((user) => user !== null)
      .map((user) => ({
        info: memberDTO(user),
        relation: data.find((userTeam) => userTeam.user_id === user.id)!,
      }))
  })

function memberDTO(user: User): TeamMemberInfo {
  return {
    id: user.id,
    email: user.email!,
    name: user.user_metadata?.name,
    avatar_url: user.user_metadata?.avatar_url,
  }
}
