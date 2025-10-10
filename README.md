# BotLink Dashboard

AI-powered code generation platform with intelligent agents and live workspace environments.

## Overview

BotLink Dashboard combines [E2B's](https://e2b.dev) powerful sandbox infrastructure with AI agent orchestration to create a complete development environment. Built on top of E2B Dashboard (fork maintained upstream for continuous improvements).

### What's BotLink?

- **Projects**: Template-based workspaces (Next.js or simple HTML/CSS/JS)
- **Workspace**: 3-panel code editor with AI chat assistant and live preview
- **Agents**: Custom AI personas with specialized prompts and capabilities
- **Workflows**: Visual agent orchestration with node-based editing
- **E2B Integration**: Secure sandbox environments for code execution

### What's from E2B?

- **Templates**: Manage and build Docker-based sandbox templates
- **Sandboxes**: Monitor and control active sandbox instances
- **API Keys**: Team API key management with usage tracking
- **Usage Analytics**: Resource consumption and cost breakdowns
- **Billing**: Stripe integration for subscriptions and payments
- **Team Management**: Multi-tenant organization support

## Tech Stack

- **Next.js 15** with React 19
- **TypeScript** for type safety
- **Supabase** for auth and database
- **E2B** for sandbox infrastructure
- **OpenAI/Anthropic** for AI agents
- **shadcn/ui** for components
- **Vitest** for testing
- **Bun** for package management

## Quick Start

### Prerequisites

- Bun 1.2.0+
- Supabase account
- Self-hosted E2B infrastructure (or use E2B cloud)
- OpenAI/Anthropic API keys

### Installation

```bash
# Clone the repo
git clone git@github.com:kitchenbeats/botlink-dashboard.git
cd botlink-dashboard

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run database migrations
bun run db:migrations:apply

# Start development server
bun dev
```

Visit `http://localhost:3000`

## Project Structure

```
src/
├── app/
│   └── dashboard/[teamIdOrSlug]/
│       ├── billing/         # E2B - Stripe billing
│       ├── keys/            # E2B - API key management
│       ├── sandboxes/       # E2B - Sandbox controls
│       ├── templates/       # E2B - Template builder
│       ├── usage/           # E2B - Analytics
│       ├── projects/        # BOTLINK - Project list
│       ├── workspace/[id]/  # BOTLINK - Code editor
│       ├── agents/          # BOTLINK - AI agents
│       ├── workflows/       # BOTLINK - Workflow editor
│       └── executions/      # BOTLINK - Run history
├── features/
│   ├── dashboard/           # E2B - Core dashboard
│   ├── projects/            # BOTLINK - Project features
│   ├── workspace/           # BOTLINK - Workspace UI
│   └── agents/              # BOTLINK - Agent system
└── server/
    ├── actions/             # Server actions
    ├── db/                  # Database layer
    └── services/            # Business logic
```

## Database Schema

### E2B Tables
- `teams` - Team/organization management
- `team_members` - Membership and roles
- `envs` - E2B sandbox templates
- `env_builds` - Template build history
- `api_keys` - Team API keys
- `access_tokens` - Personal access tokens

### BotLink Tables
- `projects` - User projects with templates
- `files` - File tree per project
- `messages` - Chat messages
- `tasks` - AI-generated tasks
- `agents` - Custom AI agents
- `workflows` - Agent workflows
- `executions` - Workflow run history
- `sandbox_sessions` - E2B sandbox instances

## Development

### Running Tests

```bash
# All tests
bun test:run

# Unit tests only
bun test:unit

# Integration tests
bun test:integration

# E2E tests
bun test:e2e

# Watch mode
bun test:watch
```

### Database Migrations

```bash
# Create new migration
bun db:migrations:create

# Apply migrations
bun db:migrations:apply
```

### Updating from E2B Upstream

```bash
# Fetch latest E2B changes
git fetch upstream

# Merge E2B updates
git merge upstream/main

# Resolve conflicts in BotLink-specific files
```

## Environment Variables

Required variables in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# E2B Infrastructure
INFRA_API_URL=https://api.ledgai.com
NEXT_PUBLIC_E2B_DOMAIN=ledgai.com

# AI Providers
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# Encryption (for API keys)
ENCRYPTION_KEY=xxx
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

Apache 2.0 - See [LICENSE](LICENSE)

## Links

- [E2B Upstream](https://github.com/e2b-dev/dashboard)
- [E2B Documentation](https://e2b.dev/docs)
- [Discord Community](https://discord.gg/e2b)
