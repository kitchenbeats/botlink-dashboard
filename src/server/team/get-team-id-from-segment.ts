import 'server-cli-only'

import { l } from '@/lib/clients/logger/logger'
import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import { TeamIdOrSlugSchema } from '@/lib/schemas/team'
import { serializeError } from 'serialize-error'
import z from 'zod'

export const getTeamIdFromSegment = async (segment: string) => {
  if (!TeamIdOrSlugSchema.safeParse(segment).success) {
    l.warn(
      {
        key: 'get_team_id_from_segment:invalid_segment',
        context: {
          segment,
        },
      },
      'get_team_id_from_segment - invalid segment'
    )

    return null
  }

  if (z.string().uuid().safeParse(segment).success) {
    return segment
  }

  const { data, error } = await supabaseAdmin
    .from('teams')
    .select('id')
    .eq('slug', segment)

  if (error || !data.length) {
    l.warn(
      {
        key: 'get_team_id_from_segment:failed_to_get_team_id',
        error: serializeError(error),
        context: {
          segment,
        },
      },
      'get_team_id_from_segment - failed to get team id'
    )

    return null
  }

  return data[0]!.id
}
