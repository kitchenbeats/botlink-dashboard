# ReactWrite Simple HTML Site Template

Pre-installed E2B sandbox template with a clean HTML/CSS/JS starter.

## Features

**HTML Starter:**
- Modern HTML5 boilerplate
- Responsive layout with Tailwind CSS (CDN)
- Clean example structure
- Interactive demo button
- Ready-to-customize

**Files Included:**
- `index.html` - Main page with semantic HTML
- `style.css` - Custom CSS variables and styles
- `script.js` - JavaScript with example interactivity
- `README.md` - Quick start guide

**Tech Stack:**
- HTML5
- CSS3
- Vanilla JavaScript
- Tailwind CSS (via CDN)
- http-server for local development

**AI Provider SDKs:**
- Anthropic (`@anthropic-ai/sdk`)
- OpenAI (`openai`)
- Google Gemini (`@google/generative-ai`)

**Development Tools:**
- TypeScript, tsx, nodemon, dotenv-cli, http-server
- git, curl, vim, nano, jq

## Usage

When users create a "Simple HTML Site" project in ReactWrite:

1. Sandbox starts with template pre-installed at `/templates/simple-html`
2. ReactWrite copies template to `/home/user/project`
3. User can immediately start editing and previewing
4. Run `npx http-server . -p 3000` to serve locally

## Build & Deploy

```bash
cd e2b-templates/simple-html
E2B_DOMAIN=ledgai.com E2B_ACCESS_TOKEN=sk_e2b_... e2b template build --name reactwrite-simple-html
```

## Template Location

Inside sandbox: `/templates/simple-html/`
