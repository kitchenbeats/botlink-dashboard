import { readFileSync, readdirSync } from 'fs'
import { SQL } from 'bun'
import { join } from 'path'
import { loadEnvConfig } from '@next/env'

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
const db = new SQL(process.env.POSTGRES_CONNECTION_STRING)

/**
 * Creates or verifies the existence of the migrations tracking table
 * This table keeps track of which migrations have been applied to prevent
 * duplicate runs and provide an audit trail
 */
async function ensureMigrationsTable() {
  try {
    await db(`
      CREATE TABLE IF NOT EXISTS public._migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        checksum TEXT
      );
    `)
    await db(`
      GRANT ALL ON public._migrations TO supabase_admin;
    `)
  } catch (error) {
    console.error('❌ Failed to create migrations table:', error)
    process.exit(1)
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
  // Query to get the existing migration record
  const result = await db.unsafe(
    'SELECT checksum FROM _migrations WHERE filename = $1',
    [filename]
  )

  // If no record found, migration hasn't been applied
  if (!result || result.length === 0) {
    return { applied: false, checksumMatch: false }
  }

  // Calculate current checksum and convert to string
  const currentChecksum = String(Bun.hash(content))

  // Compare with stored checksum
  const storedChecksum = result[0].checksum
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
}

/**
 * Records a successfully applied migration in the tracking table
 * @param filename - The name of the migration file
 * @param content - The content of the migration file (for checksum)
 */
async function recordMigration(
  filename: string,
  content: string
): Promise<void> {
  // Convert checksum to string to avoid bigint overflow
  const checksum = String(Bun.hash(content))
  await db.unsafe(
    'INSERT INTO _migrations (filename, checksum) VALUES ($1, $2)',
    [filename, checksum]
  )
}

/**
 * Splits a SQL file into individual statements while preserving:
 * - Function definitions using $$ dollar quotes
 * - Custom dollar-quoted strings ($tag$ ... $tag$)
 * - Proper handling of semicolons within these blocks
 *
 * @param sql - The complete SQL content to split
 * @returns Array of individual SQL statements
 */
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let currentStatement = ''
  let inDollarQuote = false
  let dollarQuoteTag = ''

  // Split the SQL into lines for better handling of dollar quotes
  const lines = sql.split('\n')

  for (const line of lines) {
    // Handle dollar quote tags (both $$ and $tag$ formats)
    if (line.includes('$')) {
      const matches = line.match(/\$[a-zA-Z]*\$/g)
      if (matches) {
        for (const match of matches) {
          if (!inDollarQuote) {
            inDollarQuote = true
            dollarQuoteTag = match
          } else if (match === dollarQuoteTag) {
            inDollarQuote = false
            dollarQuoteTag = ''
          }
        }
      }
    }

    currentStatement += line + '\n'

    // Only split on semicolon if we're not inside a dollar-quoted block
    if (!inDollarQuote && line.trim().endsWith(';')) {
      statements.push(currentStatement.trim())
      currentStatement = ''
    }
  }

  // Add any remaining statement without trailing semicolon
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim())
  }

  return statements.filter((stmt) => stmt.length > 0)
}

/**
 * Applies a single migration file within a transaction
 * - Checks if migration was already applied
 * - Verifies checksum of previously applied migrations
 * - Splits the migration into individual statements
 * - Executes each statement
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
  try {
    // Check if already applied and verify checksum
    const { applied, checksumMatch } = await isMigrationApplied(
      filename,
      content
    )

    if (applied) {
      console.log(`⏭️  Skipping migration (already applied): ${filename}`)

      // Optionally, you could add a flag to reapply migrations with mismatched checksums
      // if (!checksumMatch && process.env.FORCE_REAPPLY_MODIFIED_MIGRATIONS === 'true') {
      //   console.log(`🔄 Reapplying modified migration: ${filename}`)
      //   // Logic to reapply would go here
      // }

      return true
    }

    await db.begin(async (tx) => {
      const statements = splitSqlStatements(content)

      for (const statement of statements) {
        if (statement.trim()) {
          await tx.unsafe(statement)
        }
      }

      await recordMigration(filename, content)
      console.log(`✅ Applied migration: ${filename}`)
    })

    return true
  } catch (error) {
    console.error(`❌ Failed to apply migration ${filename}:`, error)
    throw error // Let the main function handle the error
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
  }
}

// Run migrations with error handling
applyMigrations().catch((error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})
