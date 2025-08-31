import 'server-cli-only'

import { authActionClient } from '@/lib/clients/action'
import { returnServerError } from '@/lib/utils/action'
import getUserTeamsMemo from './get-user-teams-memo'

import { z } from 'zod'
import getTeamMemo from './get-team-memo'

const GetTeamSchema = z.object({
  teamId: z.string().uuid(),
})

export const getTeam = authActionClient
  .schema(GetTeamSchema)
  .metadata({ serverFunctionName: 'getTeam' })
  .action(async ({ parsedInput, ctx }) => {
    const { teamId } = parsedInput
    const { user } = ctx

    const team = await getTeamMemo(user.id, teamId)

    return team
  })

export const getUserTeams = authActionClient
  .metadata({ serverFunctionName: 'getUserTeams' })
  .action(async ({ ctx }) => {
    const { user } = ctx

    const teams = await getUserTeamsMemo(user)

    if (!teams || teams.length === 0) {
      return returnServerError('No teams found.')
    }

    return teams
  })
