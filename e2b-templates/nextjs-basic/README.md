# ReactWrite Next.js Basic Template

Pre-installed E2B sandbox template with a clean Next.js app created via `create-next-app`.

## Features

**Next.js Setup:**
- Latest Next.js with App Router
- TypeScript configured
- Tailwind CSS pre-installed
- Import alias `@/*` configured
- Clean starting point with example page

**Tech Stack:**
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- npm package manager

**AI Provider SDKs:**
- Anthropic (`@anthropic-ai/sdk`)
- OpenAI (`openai`)
- Google Gemini (`@google/generative-ai`)

**Development Tools:**
- TypeScript, tsx, nodemon, dotenv-cli
- git, curl, vim, nano, jq

## Usage

When users create a "Next.js" project in ReactWrite:

1. Sandbox starts with template pre-installed at `/templates/nextjs-basic`
2. ReactWrite copies template to `/home/user/project`
3. Ready to code immediately - no npm install wait!
4. Run `npm run dev` to start development server

## Build & Deploy

```bash
cd e2b-templates/nextjs-basic
E2B_DOMAIN=ledgai.com E2B_ACCESS_TOKEN=sk_e2b_... e2b template build --name reactwrite-nextjs-basic
```

## Template Location

Inside sandbox: `/templates/nextjs-basic/`
