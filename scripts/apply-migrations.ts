/**
 * DISCLAIMER:
 * This script is currently not in use. The database migrations are handled
 * through a different mechanism. This file is kept for reference purposes
 * and may be implemented in the future.
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { loadEnvConfig } from '@next/env'
import { Pool } from 'pg'

/**
 * Load environment variables from .env files
 * This ensures our database connection string is available
 */
loadEnvConfig(process.cwd())

/**
 * Environment validation
 * Fail fast if required environment variables are missing
 */
if (!process.env.POSTGRES_CONNECTION_STRING) {
  console.error('❌ POSTGRES_CONNECTION_STRING environment variable is not set')
  process.exit(1)
}

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_CONNECTION_STRING,
})

/**
 * Creates or verifies the existence of the migrations tracking table
 * This table keeps track of which migrations have been applied to prevent
 * duplicate runs and provide an audit trail
 */
async function ensureMigrationsTable() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public._dashboard_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        checksum TEXT
      );

      -- Enable Row Level Security
      ALTER TABLE public._dashboard_migrations ENABLE ROW LEVEL SECURITY;
    `)
  } catch (error) {
    console.error('❌ Failed to create migrations table:', error)
    process.exit(1)
  } finally {
    client.release()
  }
}

/**
 * Checks if a specific migration has already been applied
 * and verifies its checksum to detect modifications
 *
 * @param filename - The name of the migration file to check
 * @param content - The content of the migration file for checksum verification
 * @returns Object with applied status and whether checksum matches
 */
async function isMigrationApplied(
  filename: string,
  content: string
): Promise<{ applied: boolean; checksumMatch: boolean }> {
  const client = await pool.connect()
  try {
    // Query to get the existing migration record
    const result = await client.query(
      'SELECT checksum FROM _dashboard_migrations WHERE filename = $1',
      [filename]
    )

    // If no record found, migration hasn't been applied
    if (!result || result.rows.length === 0) {
      return { applied: false, checksumMatch: false }
    }

    // Calculate current checksum and convert to string
    const currentChecksum = String(Bun.hash(content))

    // Compare with stored checksum
    const storedChecksum = result.rows[0].checksum
    const checksumMatch = currentChecksum === storedChecksum

    // If checksums don't match, log a warning
    if (!checksumMatch) {
      console.warn(
        `⚠️  Warning: Migration ${filename} has been modified since it was applied!`
      )
      console.warn(`   Stored checksum: ${storedChecksum}`)
      console.warn(`   Current checksum: ${currentChecksum}`)
    }

    return { applied: true, checksumMatch }
  } finally {
    client.release()
  }
}

/**
 * Records a successfully applied migration in the tracking table
 * @param filename - The name of the migration file
 * @param content - The content of the migration file (for checksum)
 */
async function recordMigration(
  filename: string,
  content: string,
  client: import('pg').PoolClient
): Promise<void> {
  // Convert checksum to string to avoid bigint overflow
  const checksum = String(Bun.hash(content))
  await client.query(
    'INSERT INTO _dashboard_migrations (filename, checksum) VALUES ($1, $2)',
    [filename, checksum]
  )
}

/**
 * Applies a single migration file within a transaction
 * - Checks if migration was already applied
 * - Verifies checksum of previously applied migrations
 * - Executes the migration SQL directly
 * - Records the migration upon success
 *
 * @param filename - The name of the migration file
 * @param content - The content of the migration file
 * @returns boolean indicating success
 */
async function applyMigration(
  filename: string,
  content: string
): Promise<boolean> {
  const client = await pool.connect()
  try {
    // Check if already applied and verify checksum
    const { applied, checksumMatch } = await isMigrationApplied(
      filename,
      content
    )

    if (applied) {
      console.log(`⏭️  Skipping migration (already applied): ${filename}`)
      return true
    }

    try {
      // Begin transaction
      await client.query('BEGIN')

      // Execute the entire migration SQL directly
      // pg supports multiple statements in a single query
      await client.query(content)

      // Record the migration
      await recordMigration(filename, content, client)

      // Commit transaction
      await client.query('COMMIT')

      console.log(`✅ Applied migration: ${filename}`)
      return true
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error(`❌ Failed to apply migration ${filename}:`, error)
    throw error // Let the main function handle the error
  } finally {
    client.release()
  }
}

/**
 * Main migration function that:
 * 1. Ensures migrations table exists
 * 2. Reads all .sql files from migrations directory
 * 3. Applies migrations in order
 * 4. Provides a summary of applied migrations
 */
async function applyMigrations() {
  try {
    // Initialize migrations table
    await ensureMigrationsTable()
    console.log('✅ Migrations table ready')

    // Get all migration files
    const migrationsDir = join(process.cwd(), 'migrations')
    const migrationFiles = readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort() // Sort by filename (timestamp-based)

    console.log(`Found ${migrationFiles.length} migration files`)

    // Apply migrations and track statistics
    let appliedCount = 0
    let skippedCount = 0
    let failedCount = 0
    let modifiedCount = 0

    for (const filename of migrationFiles) {
      try {
        const filePath = join(migrationsDir, filename)
        const content = readFileSync(filePath, 'utf8')

        // Check if already applied and verify checksum
        const { applied, checksumMatch } = await isMigrationApplied(
          filename,
          content
        )

        if (applied) {
          skippedCount++
          if (!checksumMatch) {
            modifiedCount++
          }
          continue
        }

        await applyMigration(filename, content)
        appliedCount++
      } catch (error) {
        failedCount++
        console.error(`❌ Migration ${filename} failed:`, error)
        break // Stop on first failure
      }
    }

    // Print summary
    console.log('\n📊 Migration Summary:')
    console.log(`- Total migrations: ${migrationFiles.length}`)
    console.log(`- Already applied: ${skippedCount}`)
    console.log(`- Newly applied: ${appliedCount}`)
    console.log(`- Failed: ${failedCount}`)

    if (modifiedCount > 0) {
      console.log(`- Modified after application: ${modifiedCount} ⚠️`)
    }

    if (failedCount > 0) {
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Migration process failed:', error)
    process.exit(1)
  } finally {
    // Close the pool when done
    await pool.end()
  }
}

// Run migrations with error handling
applyMigrations().catch((error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})
