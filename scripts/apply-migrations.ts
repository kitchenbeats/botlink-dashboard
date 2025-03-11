import { readFileSync, readdirSync } from 'fs'
import { SQL } from 'bun'
import { join } from 'path'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

// Ensure required environment variables are set
if (!process.env.POSTGRES_CONNECTION_STRING) {
  console.error('❌ POSTGRES_CONNECTION_STRING environment variable is not set')
  process.exit(1)
}

const db = new SQL(process.env.POSTGRES_CONNECTION_STRING)

// Apply a single migration
async function applyMigration(filename: string, content: string) {
  try {
    await db.begin(async (tx) => {
      // First, let's handle the function definitions and other statements separately
      const statements = splitSqlStatements(content)

      // Execute each statement separately
      for (const statement of statements) {
        if (statement.trim()) {
          await tx.unsafe(statement)
        }
      }

      console.log(`✅ Applied migration: ${filename}`)
    })

    return true
  } catch (error) {
    console.error('❌ Migration process failed:', error)
    process.exit(1)
  }
}

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let currentStatement = ''
  let inDollarQuote = false
  let dollarQuoteTag = ''

  // Split the SQL into lines
  const lines = sql.split('\n')

  for (const line of lines) {
    // Check for dollar quote start/end
    if (line.includes('$$')) {
      const matches = line.match(/\$\$|\$[a-zA-Z]*\$/g)
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

    // Only split on semicolon if we're not inside a dollar-quoted string
    if (!inDollarQuote && line.trim().endsWith(';')) {
      statements.push(currentStatement.trim())
      currentStatement = ''
    }
  }

  // Add any remaining statement
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim())
  }

  return statements
}

// Main function to apply all migrations
async function applyMigrations() {
  try {
    // Get all migration files
    const migrationsDir = join(process.cwd(), 'migrations')
    const migrationFiles = readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort() // Sort by filename (which is based on timestamp)

    console.log(`Found ${migrationFiles.length} migration files`)

    // Apply each migration that hasn't been applied yet
    let appliedCount = 0
    let failedCount = 0

    for (const filename of migrationFiles) {
      const filePath = join(migrationsDir, filename)
      const content = readFileSync(filePath, 'utf8')

      const success = await applyMigration(filename, content)

      if (success) {
        appliedCount++
      } else {
        failedCount++
        // Stop on first failure
        break
      }
    }

    console.log(`\n📊 Migration Summary:`)
    console.log(`- Total migrations: ${migrationFiles.length}`)
    console.log(`- Newly applied: ${appliedCount}`)
    console.log(`- Failed: ${failedCount}`)

    if (failedCount > 0) {
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Migration process failed:', error)
    process.exit(1)
  }
}

// Run the migrations
applyMigrations().catch((error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})
