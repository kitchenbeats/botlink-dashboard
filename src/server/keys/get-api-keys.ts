import 'server-only'

import { z } from 'zod'
import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import { maskApiKey } from '@/lib/utils/server'
import { checkUserTeamAuthorization } from '@/lib/utils/server'
import { ObscuredApiKey } from './types'
import { authActionClient } from '@/lib/clients/action'
import { returnServerError } from '@/lib/utils/action'

const GetApiKeysSchema = z.object({
  teamId: z.string({ required_error: 'Team ID is required' }).uuid(),
})

export const getTeamApiKeys = authActionClient
  .schema(GetApiKeysSchema)
  .metadata({ serverFunctionName: 'getTeamApiKeys' })
  .action(async ({ parsedInput, ctx }) => {
    const { teamId } = parsedInput
    const { user } = ctx

    const isAuthorized = await checkUserTeamAuthorization(user.id, teamId)

    if (!isAuthorized)
      return returnServerError('Not authorized to edit team api keys')

    const { data, error } = await supabaseAdmin
      .from('team_api_keys')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true })

    if (error) throw error

    const resultApiKeys: ObscuredApiKey[] = []

    for (const apiKey of data) {
      let userEmail: string | null = null

      if (apiKey.created_by) {
        const { data: keyUserData } = await supabaseAdmin
          .from('auth_users')
          .select('email')
          .eq('id', apiKey.created_by)

        if (keyUserData && keyUserData[0]) {
          userEmail = keyUserData[0].email
        }
      }

      resultApiKeys.push({
        id: apiKey.id,
        name: apiKey.name,
        maskedKey: maskApiKey(apiKey),
        createdAt: apiKey.created_at,
        createdBy: userEmail,
      })
    }

    return { apiKeys: resultApiKeys }
  })
