import { loadEnvConfig } from '@next/env'
import { vi } from 'vitest'

// load env variables
const projectDir = process.cwd()
loadEnvConfig(projectDir)

// default mocks
vi.mock('@/lib/clients/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  logError: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}))
