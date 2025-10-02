'use server'

import { SUPABASE_AUTH_HEADERS } from '@/configs/api'
import { COOKIE_KEYS } from '@/configs/keys'
import { authActionClient } from '@/lib/clients/action'
import { l } from '@/lib/clients/logger/logger'
import { handleDefaultInfraError } from '@/lib/utils/action'
import {
  SandboxWebhooksPayloadGet,
  SandboxWebhooksPayloadPatch,
  SandboxWebhooksPayloadPost,
} from '@/types/argus.types'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import {
  CreateWebhookSchema,
  DeleteWebhookSchema,
  TestWebhookSchema,
  UpdateWebhookSchema,
} from './schema'

export const createWebhookAction = authActionClient
  .schema(CreateWebhookSchema)
  .metadata({ actionName: 'createWebhook' })
  .action(async ({ parsedInput, ctx }) => {
    const { teamId, url, events } = parsedInput
    const { session } = ctx

    const accessToken = session.access_token

    const response = await fetch(
      `${process.env.INFRA_API_URL}/events/webhooks/sandboxes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...SUPABASE_AUTH_HEADERS(accessToken, teamId),
        },
        body: JSON.stringify({
          url,
          events,
        } satisfies SandboxWebhooksPayloadPost),
      }
    )

    if (!response.ok) {
      const status = response.status
      const text = await response.text()

      l.error(
        {
          key: 'create_webhook:infra_error',
          error: `${status}: ${text}`,
          team_id: teamId,
          user_id: session.user.id,
          context: {
            status,
            teamId,
            url,
            events,
          },
        },
        `Failed to create webhook: ${text}`
      )

      return handleDefaultInfraError(status)
    }

    const teamSlug = (await cookies()).get(
      COOKIE_KEYS.SELECTED_TEAM_SLUG
    )?.value

    revalidatePath(`/dashboard/${teamSlug}/settings?tab=webhooks`, 'page')

    return { success: true }
  })

// Update Webhook

export const updateWebhookAction = authActionClient
  .schema(UpdateWebhookSchema)
  .metadata({ actionName: 'updateWebhook' })
  .action(async ({ parsedInput, ctx }) => {
    const { teamId, url, events } = parsedInput
    const { session } = ctx

    const accessToken = session.access_token

    const body: SandboxWebhooksPayloadPatch = {}
    if (url !== undefined) body.url = url
    if (events !== undefined) body.events = events

    const response = await fetch(
      `${process.env.INFRA_API_URL}/events/webhooks/sandboxes`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...SUPABASE_AUTH_HEADERS(accessToken, teamId),
        },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      const status = response.status
      const text = await response.text()

      l.error(
        {
          key: 'update_webhook:infra_error',
          error: `${status}: ${text}`,
          team_id: teamId,
          user_id: session.user.id,
          context: {
            status,
            teamId,
            url,
            events,
          },
        },
        `Failed to update webhook: ${text}`
      )

      return handleDefaultInfraError(status)
    }

    const data = (await response.json()) as SandboxWebhooksPayloadGet

    return { webhook: data }
  })

// Delete Webhook

export const deleteWebhookAction = authActionClient
  .schema(DeleteWebhookSchema)
  .metadata({ actionName: 'deleteWebhook' })
  .action(async ({ parsedInput, ctx }) => {
    const { teamId } = parsedInput
    const { session } = ctx

    const accessToken = session.access_token

    const response = await fetch(
      `${process.env.INFRA_API_URL}/events/webhooks/sandboxes`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...SUPABASE_AUTH_HEADERS(accessToken, teamId),
        },
      }
    )

    if (!response.ok) {
      const status = response.status
      const text = await response.text()

      l.error(
        {
          key: 'delete_webhook:infra_error',
          error: `${status}: ${text}`,
          team_id: teamId,
          user_id: session.user.id,
          context: {
            status,
            teamId,
          },
        },
        `Failed to delete webhook: ${text}`
      )

      return handleDefaultInfraError(status)
    }

    const teamSlug = (await cookies()).get(
      COOKIE_KEYS.SELECTED_TEAM_SLUG
    )?.value

    revalidatePath(`/dashboard/${teamSlug}/settings?tab=webhooks`, 'page')

    return { success: true }
  })

// Test Webhook

export const testWebhookAction = authActionClient
  .schema(TestWebhookSchema)
  .metadata({ actionName: 'testWebhook' })
  .action(async ({ parsedInput, ctx }) => {
    const { teamId } = parsedInput
    const { session } = ctx

    const accessToken = session.access_token

    const response = await fetch(
      `${process.env.INFRA_API_URL}/events/webhooks/sandboxes/test`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...SUPABASE_AUTH_HEADERS(accessToken, teamId),
        },
      }
    )

    if (!response.ok) {
      const status = response.status
      const text = await response.text()

      l.error(
        {
          key: 'test_webhook:infra_error',
          error: `${status}: ${text}`,
          team_id: teamId,
          user_id: session.user.id,
          context: {
            status,
            teamId,
          },
        },
        `Failed to test webhook: ${text}`
      )

      return handleDefaultInfraError(status)
    }

    return { success: true }
  })
