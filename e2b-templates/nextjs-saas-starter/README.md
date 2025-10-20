# ReactWrite Next.js SaaS Starter Template

Pre-installed E2B sandbox template with Vercel's [Next.js SaaS Starter](https://github.com/nextjs/saas-starter).

## Features

**Pre-installed SaaS Template:**
- Marketing landing page
- Pricing page with Stripe integration
- Dashboard with user/team management
- Role-based access control
- Authentication system
- Activity logging

**Tech Stack:**
- Next.js (App Router)
- PostgreSQL + Drizzle ORM
- Stripe for payments
- shadcn/ui components
- pnpm package manager

**AI Provider SDKs:**
- Anthropic (`@anthropic-ai/sdk`)
- OpenAI (`openai`)
- Google Gemini (`@google/generative-ai`)

**Development Tools:**
- TypeScript, tsx, nodemon, dotenv-cli
- git, curl, vim, nano, jq

## Usage

When users create a "Next.js SaaS" project in ReactWrite:

1. Sandbox starts with template pre-installed at `/templates/nextjs-saas`
2. ReactWrite copies template to `/home/user/project`
3. User provides environment variables (Stripe keys, DB connection, etc.)
4. Ready to code immediately - no npm install wait!

## Build & Deploy

```bash
cd e2b-templates/nextjs-saas-starter
E2B_DOMAIN=ledgai.com E2B_ACCESS_TOKEN=sk_e2b_... e2b template build --name reactwrite-nextjs-saas
```

## Template Location

Inside sandbox: `/templates/nextjs-saas/`
