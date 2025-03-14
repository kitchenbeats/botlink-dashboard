import 'server-only'

import {
  checkAuthenticated,
  getApiUrl,
  getUserAccessToken,
} from '@/lib/utils/server'
import { z } from 'zod'
import { guard } from '@/lib/utils/server'
import { DefaultTemplate, Template } from '@/types/api'
import {
  MOCK_DEFAULT_TEMPLATES_DATA,
  MOCK_TEMPLATES_DATA,
} from '@/configs/mock-data'
import { ApiError } from '@/types/errors'
import { logger } from '@/lib/clients/logger'
import { ERROR_CODES } from '@/configs/logs'
import { supabaseAdmin } from '@/lib/clients/supabase/admin'

const GetTeamTemplatesParamsSchema = z.object({
  teamId: z.string().uuid(),
})

export const getTeamTemplates = guard(
  GetTeamTemplatesParamsSchema,
  async ({ teamId }) => {
    if (process.env.NEXT_PUBLIC_MOCK_DATA === '1') {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return MOCK_TEMPLATES_DATA
    }

    const { user } = await checkAuthenticated()
    const accessToken = await getUserAccessToken(user.id)
    const { url } = await getApiUrl()

    const res = await fetch(`${url}/templates?teamID=${teamId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!res.ok) {
      logger.error(ERROR_CODES.INFRA, '/templates', res)

      // this case should never happen for the described reason, hence we assume the user defined the wrong infra domain
      throw ApiError(
        "Something went wrong when contacting the API. Ensure you are using the correct Infrastructure Domain under 'Developer Settings'"
      )
    }

    const data = (await res.json()) as Template[]

    return data
  }
)

export const getDefaultTemplates = guard(async () => {
  if (process.env.NEXT_PUBLIC_MOCK_DATA === '1') {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return MOCK_DEFAULT_TEMPLATES_DATA
  }

  const { data: defaultEnvs, error: defaultEnvsError } = await supabaseAdmin
    .from('env_defaults')
    .select('*')

  if (defaultEnvsError) {
    throw Error('Failed to fetch default templates')
  }

  if (!defaultEnvs || defaultEnvs.length === 0) {
    return []
  }

  const envIds = defaultEnvs.map((env) => env.env_id)

  const { data: envs, error: envsError } = await supabaseAdmin
    .from('envs')
    .select(
      `
        id,
        created_at,
        updated_at,
        public,
        build_count,
        spawn_count,
        last_spawned_at,
        created_by
      `
    )
    .in('id', envIds)

  if (envsError) {
    throw Error('Failed to fetch default templates')
  }

  const templates: DefaultTemplate[] = []

  for (const env of envs) {
    const { data: latestBuild, error: buildError } = await supabaseAdmin
      .from('env_builds')
      .select('id, ram_mb, vcpu')
      .eq('env_id', env.id)
      .eq('status', 'uploaded')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (buildError) {
      logger.error(
        ERROR_CODES.INFRA,
        `Failed to fetch build for env ${env.id}`,
        buildError
      )
      continue
    }

    const { data: aliases, error: aliasesError } = await supabaseAdmin
      .from('env_aliases')
      .select('alias')
      .eq('env_id', env.id)

    if (aliasesError) {
      logger.error(
        ERROR_CODES.INFRA,
        `Failed to fetch aliases for env ${env.id}`,
        aliasesError
      )
      continue
    }

    let createdBy = null
    if (env.created_by) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('auth_users')
        .select('id, email')
        .eq('id', env.created_by)
        .single()

      if (!userError && userData && userData.id) {
        createdBy = {
          id: userData.id,
          email: userData.email || '',
        }
      }
    }

    templates.push({
      templateID: env.id,
      buildID: latestBuild.id,
      cpuCount: latestBuild.vcpu,
      memoryMB: latestBuild.ram_mb,
      public: env.public,
      aliases: aliases.map((a) => a.alias),
      createdAt: env.created_at,
      updatedAt: env.updated_at,
      createdBy,
      isDefault: true,
      defaultDescription:
        defaultEnvs.find((e) => e.env_id === env.id)?.description ?? undefined,
    })
  }

  return templates
})
