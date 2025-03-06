import { z } from 'zod'

export const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  BILLING_API_URL: z.string().url(),
  COOKIE_ENCRYPTION_KEY: z.string(),
  GCP_PROJECT_ID: z.string(),
  GCP_SERVICE_ACCOUNT_EMAIL: z.string(),
  GCP_SERVICE_ACCOUNT_PRIVATE_KEY: z.string(),
  GCP_BUCKET_NAME: z.string(),

  VERCEL_URL: z.string().optional(),
  DEVELOPMENT_INFRA_API_DOMAIN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  ZEROBOUNCE_API_KEY: z.string().optional(),
})

export const clientSchema = z.object({
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_DEFAULT_API_DOMAIN: z.string(),
  NEXT_PUBLIC_STRIPE_BILLING_URL: z.string().url(),
  NEXT_PUBLIC_EXPOSE_STORYBOOK: z.string().optional(),
  NEXT_PUBLIC_SCAN: z.string().optional(),
  NEXT_PUBLIC_MOCK_DATA: z.string().optional(),
})

/**
 * You can't destruct `process.env` as a regular object, so we do
 * a simple validation of the environment variables we need.
 */
export const formatErrors = (
  errors: z.ZodFormattedError<Map<string, string>, string>
) =>
  Object.entries(errors)
    .map(([name, value]) => {
      if (value && '_errors' in value)
        return `${name}: ${value._errors.join(', ')}\n`
    })
    .filter(Boolean)

const merged = serverSchema.merge(clientSchema)
export type Env = z.infer<typeof merged>
