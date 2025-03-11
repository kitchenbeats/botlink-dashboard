<!-- <p align="center">
  <img width="100" src="/readme-assets/logo-circle.png" alt="e2b logo">
</p> -->
![Dashboard Preview Dark](/readme-assets/dashboard-preview-dark.png#gh-dark-mode-only)
![Dashboard Preview Light](/readme-assets/dashboard-preview-light.png#gh-light-mode-only)

# E2B Dashboard

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Discord](https://img.shields.io/discord/1092455714431180995?color=7289DA&label=Discord&logo=discord&logoColor=white)](https://discord.com/channels/1092455714431180995)
[![GitHub Stars](https://img.shields.io/github/stars/e2b-dev/dashboard?style=social)](https://github.com/e2b-dev/dashboard)

> **Status**: Beta - Ready for early adopters. APIs might change.

## Quick Links
- 📚 [Documentation](https://e2b.dev/docs)
- 💬 [Discord Community](https://discord.gg/e2b)
- 🐛 [Issue Tracker](https://github.com/e2b-dev/dashboard/issues)
- 🤝 [Contributing Guide](CONTRIBUTING.md)

## Overview
Our Dashboard is a modern, feature-rich web application built to manage and monitor E2B services. Built with Next.js 15 and React 19, it provides a seamless user experience for managing sandboxes, API keys, and usage analytics.

## Features
- **Modern Stack**: Built with Next.js 15, React 19, and TypeScript
- **Real-time Analytics**: Monitor your sandbox usage and performance
- **Authentication**: Secure authentication powered by Supabase
- **Documentation**: Integrated MDX documentation support
- **Type Safety**: Full TypeScript support throughout the codebase

## Getting Started

### Prerequisites
- Node.js 18+
- Git
- Vercel account
- Supabase account
- PostHog account (optional for analytics)

### Local Development Setup

1. Clone the repository
```bash
git clone https://github.com/e2b-dev/dashboard.git
cd dashboard
```

2. Install dependencies
```bash
# Using Bun (recommended)
bun install

# Using npm
npm install
```

3. Set up required services:

#### a. Vercel & KV Storage
```bash
# Install Vercel CLI
npm i -g vercel

# Link project to Vercel
vercel link

# Set up Vercel KV
vercel storage add
# Select "KV" and follow the prompts
```

#### b. Supabase Setup
1. Create a new Supabase project
2. Go to Project Settings > API
3. Copy the `anon key` and `service_role key`
4. Copy the project URL

#### c. Database Setup
1. Retrieve the `POSTGRES_CONNECTION_STRING` from the Supabase project settings
2. Run the migrations by running the following command:
```bash
bun run db:migrations:apply
```

#### d. Supabase Storage Setup
1. Go to Storage > Buckets
2. Create a new **public** bucket named `profile-pictures`
3. Apply storage access policies by running the SQL from [migrations/supabase/profile-picture-bucket.sql](migrations/supabase/profile-picture-bucket.sql) in the Supabase SQL Editor:
   - These policies ensure only Supabase admin (service role) can write to and list files in the bucket
   - Public URLs are accessible for downloading files if the exact path is known
   - Regular users cannot browse, upload, update, or delete files in the bucket

#### e. Environment Variables
```bash
# Copy the example env file
cp .env.example .env.local
```

#### f. Cookie Encryption
The dashboard uses encrypted cookies for secure data storage. You'll need to set up a `COOKIE_ENCRYPTION_KEY`:

```bash
# Generate a secure encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Add the generated key to your .env.local file
COOKIE_ENCRYPTION_KEY=your_generated_base64_key
```

This key must be:
- 32 bytes (256 bits) encoded in base64
- Unique per environment (development/staging/production)
- Kept secret and never committed to version control

4. Start the development server
```bash
# Using Bun (recommended)
bun run dev

# Using npm
npm run dev
```

The application will be available at `http://localhost:3000`

## Development

### Available Scripts
```bash
# Using Bun (recommended)
bun run dev         # Start development server
bun run build      # Create production build
bun run start      # Start production server
bun run preview    # Build and preview production
bun run lint       # Run ESLint
bun run lint:fix   # Auto-fix ESLint issues
bun run storybook  # Launch Storybook
bun run db:types   # Generate DB types
bun run db:migration # Create migration

# All commands work with npm as well:
npm run dev
# etc...
```

### Project Structure
```
src/
├── app/          # Next.js app router pages
├── features/     # Feature-specific components
├── ui/           # Reusable UI components
├── lib/          # Utility functions and shared logic
├── styles/       # Global styles and Tailwind config
└── types/        # TypeScript type definitions
└── server/       # Server only logic & actions
└── __test__/     # Test files and utilities
```

### Testing
We use a comprehensive testing strategy with integration tests and plans for E2E tests. For detailed information about our testing approach, environment setup, and best practices, see the [Testing README](src/__test__/README.md).

### Environment Variables
See [`src/lib/env.ts`](./src/lib/env.ts) for all required environment variables and their validation schemas.

## Production Deployment

This application is optimized for deployment on Vercel:

1. Push your changes to GitHub
2. Import your repository in Vercel
3. Deploy!

> **Note**: The application uses Partial Prerendering (PPR) which is currently only supported on Vercel's infrastructure. This can be turned off inside [`next.config.mjs`](./next.config.mjs).

## Contributing
We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Support
If you need help or have questions:

1. Check our [Documentation](https://e2b.dev/docs)
2. Join our [Discord Community](https://discord.gg/e2b)
3. Open an [Issue](https://github.com/e2b-dev/dashboard/issues)

## License
This project is licensed under the Apache License, Version 2.0 - see the [LICENSE](LICENSE) file for details.

Copyright 2025 FoundryLabs, Inc.

## Database Migrations

The dashboard uses a custom migration system to manage database schema changes in a controlled, versioned manner.

### Migration System Overview

- **Timestamp-based**: Migrations are ordered by timestamp prefixes (YYYYMMDDHHMMSS)
- **Idempotent**: Each migration is applied only once
- **Transactional**: Migrations run in transactions for atomic changes
- **Integrity checks**: Checksums verify migrations haven't been modified after application
- **SQL-native**: Write pure SQL migrations with full PostgreSQL feature support

### Creating Migrations

To create a new migration:

```bash
# Create a migration with a description
bun run db:migrations:create "add user profiles"
# Creates: migrations/20250315123045.sql with description comment

# Or create without description
bun run db:migrations:create
# Creates: migrations/20250315123045.sql
```

### Writing Migrations

Migrations are SQL files that can contain multiple statements, including complex PostgreSQL features:

```sql
-- Migration: add user profiles
-- Timestamp: 20250315123045

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set up trigger
CREATE TRIGGER on_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_for_new_user();
```

### Applying Migrations

To apply pending migrations:

```bash
bun run db:migrations:apply
```

This will:
1. Create the migrations tracking table if it doesn't exist
2. Apply any migrations that haven't been run yet
3. Skip already-applied migrations
4. Provide a summary of applied/skipped migrations

### Migration Safety

The system includes several safety features:
- Migrations are applied in a transaction (all-or-nothing)
- Each migration is recorded with a checksum to detect modifications
- Warnings are shown if a previously applied migration file has changed
- Execution stops on the first error to prevent partial migrations

### Best Practices

- **One change per migration**: Keep migrations focused on a single logical change
- **Backward compatibility**: When possible, design migrations to be backward compatible
- **Comments**: Document the purpose of complex migrations
- **Testing**: Test migrations in development before applying to production
- **Avoid modifying applied migrations**: Create a new migration instead of changing an existing one
