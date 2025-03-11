import { testEnvSchema, validateEnv } from '../src/lib/env'

// Validate the environment variables before tests run
try {
  validateEnv(testEnvSchema)
  console.log('✅ E2E test environment is properly configured')
} catch (error) {
  console.error('❌ E2E test environment is not properly configured')
  console.error(
    'Missing or invalid environment variables required for E2E tests'
  )
  console.error(
    'Make sure all required variables are set in .env.test or CI/CD secrets'
  )

  process.exit(1)
}
