import 'server-only'

import { guard } from '@/lib/utils/server'
import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import {
  checkAuthenticated,
  checkUserTeamAuthorization,
} from '@/lib/utils/server'
import { UnauthorizedError } from '@/types/errors'
import { User } from '@supabase/supabase-js'
import { z } from 'zod'
import { TeamMember, TeamMemberInfo } from './types'
import { headers } from 'next/headers'

type GetTeamMembersResponse = TeamMember[]

const GetTeamMembersSchema = z.object({
  teamId: z.string().uuid(),
})

export const getTeamMembers = guard<
  typeof GetTeamMembersSchema,
  GetTeamMembersResponse
>(GetTeamMembersSchema, async ({ teamId }) => {
  const { user } = await checkAuthenticated()

  const isAuthorized = await checkUserTeamAuthorization(user.id, teamId)

  if (!isAuthorized) {
    throw UnauthorizedError('User is not authorized to get team members')
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
        (await supabaseAdmin.auth.admin.getUserById(userTeam.user_id)).data.user
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
