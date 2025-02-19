import { serverSchema, clientSchema, formatErrors } from '../src/lib/env'
import { loadEnvConfig } from '@next/env'

const projectDir = process.cwd()
loadEnvConfig(projectDir)

function validateEnv() {
  const merged = serverSchema.merge(clientSchema)
  const parsed = merged.safeParse(process.env)

  if (!parsed.success) {
    console.error(
      '❌ Invalid environment variables:\n',
      ...formatErrors(parsed.error.format())
    )
    throw new Error('Invalid environment variables')
  }

  console.log('✅ Environment variables validated successfully')
}

validateEnv()
