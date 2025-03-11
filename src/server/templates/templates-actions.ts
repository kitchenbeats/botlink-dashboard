'use server'

import { z } from 'zod'
import {
  checkAuthenticated,
  getApiUrl,
  getUserAccessToken,
  guard,
} from '@/lib/utils/server'
import { E2BError } from '@/types/errors'
import { revalidatePath } from 'next/cache'

const DeleteTemplateParamsSchema = z.object({
  templateId: z.string(),
})

export const deleteTemplateAction = guard(
  DeleteTemplateParamsSchema,
  async ({ templateId }) => {
    const { user } = await checkAuthenticated()
    const accessToken = await getUserAccessToken(user.id)
    const { url } = await getApiUrl()

    const res = await fetch(`${url}/templates/${templateId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!res.ok) {
      if (res.status === 404) {
        throw new E2BError('INVALID_PARAMETERS', `Template not found`)
      }

      const text = await res.text()

      throw new Error(text ?? `Failed to update template: ${templateId}`)
    }

    revalidatePath(`/dashboard/[teamIdOrSlug]/templates`, 'page')
  }
)

const UpdateTemplateParamsSchema = z.object({
  templateId: z.string(),
  props: z
    .object({
      Public: z.boolean(),
    })
    .partial(),
})

export const updateTemplateAction = guard(
  UpdateTemplateParamsSchema,
  async ({ templateId, props }) => {
    const { user } = await checkAuthenticated()
    const accessToken = await getUserAccessToken(user.id)
    const { url } = await getApiUrl()

    const res = await fetch(`${url}/templates/${templateId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(props),
    })

    if (!res.ok) {
      if (res.status === 404) {
        throw new E2BError('INVALID_PARAMETERS', `Template not found`)
      }

      const text = await res.text()

      throw new Error(text ?? `Failed to update template: ${templateId}`)
    }

    revalidatePath(`/dashboard/[teamIdOrSlug]/templates`, 'page')
  }
)
