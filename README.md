![Dashboard Preview](/readme-assets/dashboard-preview-light.png)

<p align="center">
  <img width="100" src="/readme-assets/logo-circle.png" alt="e2b logo">
</p>

# E2B Dashboard

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
- Node.js 18+ or Bun 1.2+
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
bun install
# or
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

#### c. Environment Variables
```bash
# Copy the example env file
cp .env.example .env.local

# Pull environment variables from Vercel (recommended)
vercel env pull .env.local

# Or manually configure the environment variables outlined in the .env.example file
```

4. Start the development server
```bash
bun run dev
# or
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Deployment

This application is optimized for deployment on Vercel:

1. Push your changes to GitHub
2. Import your repository in Vercel
3. Deploy!

> **Note**: The application uses Partial Prerendering (PPR) which is currently only supported on Vercel's infrastructure. This can be turned off inside [`next.config.mjs`](./next.config.mjs).

## Development

### Available Scripts
- `bun run dev` - Start development server with Turbo and pretty logging
- `bun run build` - Create optimized production build
- `bun run start` - Start production server with pretty logging
- `bun run preview` - Build and start production server locally
- `bun run lint` - Run ESLint checks
- `bun run lint:fix` - Run ESLint and auto-fix issues
- `bun run dev:scan` - Start dev server with file scanning
- `bun run start:scan` - Start prod server with file scanning
- `bun run storybook` - Launch Storybook for component development
- `bun run db:types` - Generate TypeScript types from Supabase schema
- `bun run db:migration` - Create new database migration

### Environment Variables

Required variables for local development:

See [`src/lib/env.ts`](./src/lib/env.ts) for all required environment variables and their validation schemas.

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
```

## Contributing
We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License
This project is licensed under the terms specified in [LICENSE](LICENSE).

## Support
- Documentation: [E2B Docs](https://e2b.dev/docs)
- Issues: [GitHub Issues](https://github.com/e2b-dev/dashboard/issues)
- Discord: [Join our Community](https://discord.gg/e2b)
