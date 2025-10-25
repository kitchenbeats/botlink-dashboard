#!/usr/bin/env tsx
/**
 * Clean up orphaned workspace Redis keys
 *
 * Finds workspace:ready:* and workspace:init:* keys that don't have
 * corresponding projects in the database and deletes them.
 *
 * Usage: npx dotenv -e .env.local -- tsx scripts/cleanup-workspace-redis.ts
 */

import { Redis } from '@upstash/redis'
import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables')
  console.error('Need: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  console.error('And: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN')
  console.error('\nUsage: npx dotenv -e .env.local -- tsx scripts/cleanup-workspace-redis.ts')
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

// Create Redis client directly (bypass server-only import)
const kv = new Redis({
  url: UPSTASH_REDIS_REST_URL,
  token: UPSTASH_REDIS_REST_TOKEN,
})

async function cleanupOrphanedKeys() {
  console.log('[Cleanup] Starting workspace Redis key cleanup...')

  // Create Supabase admin client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Get all project IDs from database
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id')

  if (error) {
    console.error('[Cleanup] Failed to fetch projects:', error)
    process.exit(1)
  }

  const validProjectIds = new Set(projects.map(p => p.id))
  console.log(`[Cleanup] Found ${validProjectIds.size} active projects in database`)

  // Scan for workspace keys
  let cursor = 0
  let totalScanned = 0
  let totalDeleted = 0
  const keysToDelete: string[] = []

  do {
    // Note: Redis SCAN with pattern is not directly supported by Upstash REST API
    // We'll need to use a different approach - get all keys and filter
    // For now, let's try to list keys with a pattern
    try {
      // This is a workaround - we'll scan keys in batches
      const keys = await kv.keys('workspace:*')

      if (!keys || keys.length === 0) {
        console.log('[Cleanup] No workspace keys found')
        break
      }

      totalScanned = keys.length
      console.log(`[Cleanup] Found ${keys.length} workspace keys total`)

      // Check each key
      for (const key of keys) {
        // Extract project ID from key
        // Format: workspace:ready:UUID or workspace:init:UUID
        const match = key.match(/^workspace:(ready|init):(.+)$/)

        if (!match) {
          console.warn(`[Cleanup] Unexpected key format: ${key}`)
          continue
        }

        const [, keyType, projectId] = match

        // Check if project exists
        if (!validProjectIds.has(projectId)) {
          console.log(`[Cleanup] Found orphaned key: ${key} (project deleted)`)
          keysToDelete.push(key)
        }
      }

      break // We got all keys in one scan with kv.keys()
    } catch (error) {
      console.error('[Cleanup] Error scanning keys:', error)
      break
    }
  } while (cursor !== 0)

  console.log(`[Cleanup] Scanned ${totalScanned} keys, found ${keysToDelete.length} orphaned keys`)

  // Delete orphaned keys
  if (keysToDelete.length > 0) {
    console.log('[Cleanup] Deleting orphaned keys...')

    for (const key of keysToDelete) {
      try {
        await kv.del(key)
        totalDeleted++
        console.log(`[Cleanup] Deleted: ${key}`)
      } catch (error) {
        console.error(`[Cleanup] Failed to delete ${key}:`, error)
      }
    }
  }

  console.log(`[Cleanup] Cleanup complete! Deleted ${totalDeleted} orphaned keys`)
  console.log(`[Cleanup] Active workspace keys remaining: ${totalScanned - totalDeleted}`)
}

cleanupOrphanedKeys()
  .then(() => {
    console.log('[Cleanup] Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('[Cleanup] Fatal error:', error)
    process.exit(1)
  })
