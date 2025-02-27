import { serverSchema, clientSchema, validateEnv } from '../src/lib/env'
import { loadEnvConfig } from '@next/env'

const projectDir = process.cwd()
loadEnvConfig(projectDir)

validateEnv(serverSchema.merge(clientSchema))
