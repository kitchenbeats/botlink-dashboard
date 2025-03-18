import { serverSchema, clientSchema, validateEnv } from '../src/lib/env'
import { loadEnvConfig } from '@next/env'

const projectDir = process.cwd()
loadEnvConfig(projectDir)

const schema = serverSchema.merge(clientSchema).refine(
  (data) => {
    if (data.NEXT_PUBLIC_INCLUDE_BILLING === '1') {
      return !!data.BILLING_API_URL && !!data.NEXT_PUBLIC_STRIPE_BILLING_URL
    }

    return true
  },
  {
    message:
      'NEXT_PUBLIC_INCLUDE_BILLING is enabled, but either BILLING_API_URL or NEXT_PUBLIC_STRIPE_BILLING_URL is missing',
    path: ['BILLING_API_URL', 'NEXT_PUBLIC_STRIPE_BILLING_URL'],
  }
)

validateEnv(schema)
