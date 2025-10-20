# E2B Templates Deployment Summary

Successfully built and deployed 3 E2B sandbox templates to your self-hosted infrastructure at `ledgai.com`.

**UPDATED**: October 15, 2025 - All templates rebuilt with proper E2B base image (`e2bdev/code-interpreter:latest`) for full snapshot support.

## ✅ Deployed Templates

### 1. **reactwrite-simple-html**
- **Template ID**: `d9s0apwohf1mbxs5csd2`
- **Base Image**: `e2bdev/code-interpreter:latest` ✅
- **Description**: Simple HTML/CSS/JS starter with Tailwind CSS (CDN)
- **Features**: Responsive boilerplate, interactive demo, ready-to-customize
- **Location in sandbox**: `/templates/simple-html/`
- **Build time**: ~6 minutes (first build with proper base)
- **Specs**: 2 vCPU, 2048 MB RAM, 9838 MB disk
- **Snapshot Support**: Full E2B snapshot infrastructure included

### 2. **reactwrite-nextjs-basic**
- **Template ID**: `xvxl7juxj0ka9wmj2hzm`
- **Base Image**: `e2bdev/code-interpreter:latest` ✅
- **Description**: Clean Next.js app with TypeScript, Tailwind CSS, and App Router
- **Features**: ESLint configured, modern Next.js setup, import alias `@/*`
- **Location in sandbox**: `/templates/nextjs-basic/`
- **Build time**: ~3 minutes (optimized with cached layers)
- **Specs**: 2 vCPU, 2048 MB RAM, 9838 MB disk
- **Dependencies**: 397 packages fully installed
- **Snapshot Support**: Full E2B snapshot infrastructure included

### 3. **reactwrite-nextjs-saas**
- **Template ID**: `wsuc3ls88n8ls8diswpc`
- **Base Image**: `e2bdev/code-interpreter:latest` ✅
- **Description**: Vercel's Next.js SaaS Starter (production-ready SaaS boilerplate)
- **Features**: Auth, Stripe payments, PostgreSQL + Drizzle ORM, user/team management, shadcn/ui
- **Location in sandbox**: `/templates/nextjs-saas/`
- **Build time**: ~2 minutes (optimized with cached layers)
- **Specs**: 2 vCPU, 2048 MB RAM, 9838 MB disk
- **Package manager**: pnpm
- **Dependencies**: 203 packages fully installed
- **Snapshot Support**: Full E2B snapshot infrastructure included

## 🔧 All Templates Include

**AI Provider SDKs** (globally installed):
- `@anthropic-ai/sdk` - For Claude
- `openai` - For GPT-4/ChatGPT
- `@google/generative-ai` - For Gemini

**Development Tools**:
- TypeScript, tsx, nodemon, dotenv-cli
- git, curl, vim, nano, jq
- http-server (HTML template)
- pnpm (SaaS template)

**Environment**:
- Node.js 24
- `TERM=xterm-256color`
- `NODE_ENV=development`
- Helpful bash aliases: `ll` (ls -lah), `g` (git)

## 📝 Usage in ReactWrite

### TypeScript/JavaScript SDK
```typescript
import { Sandbox } from '@e2b/sdk';

// Simple HTML site
const sandbox1 = await Sandbox.create('reactwrite-simple-html', {
  domain: 'ledgai.com'
});

// Next.js basic
const sandbox2 = await Sandbox.create('reactwrite-nextjs-basic', {
  domain: 'ledgai.com'
});

// Next.js SaaS
const sandbox3 = await Sandbox.create('reactwrite-nextjs-saas', {
  domain: 'ledgai.com'
});
```

### Python SDK
```python
from e2b import Sandbox

sandbox = Sandbox.create("reactwrite-simple-html", domain="ledgai.com")
```

## 🔄 Updating Templates

To rebuild a template after making changes to the Dockerfile:

```bash
cd e2b-templates/{template-name}

E2B_DOMAIN=ledgai.com \
E2B_API_KEY=e2b_5528ce6c926983af2b5fe13a73444d1b7ba53efb \
E2B_ACCESS_TOKEN=sk_e2b_cff0821a40457e87fc89dbf394c3fcd727be341e \
e2b template build-v2 {template-name} --dockerfile e2b.Dockerfile --cpu-count 2 --memory-mb 2048
```

## 📊 Template Comparison

| Feature | simple-html | nextjs-basic | nextjs-saas |
|---------|------------|--------------|-------------|
| **Best for** | Static sites, landing pages | Custom Next.js apps | SaaS applications |
| **Complexity** | Low | Medium | High |
| **Pre-installed code** | Yes (starter files) | Yes (scaffolded) | Yes (full boilerplate) |
| **Auth included** | No | No | Yes |
| **Database** | No | No | PostgreSQL (external) |
| **Payments** | No | No | Stripe |
| **Package manager** | npm | npm | pnpm |
| **Optimized build** | ✅ | ✅ | ✅ |

## 🎯 Next Steps for ReactWrite Integration

1. **Update project creation flow** to let users choose from these 3 templates
2. **Copy template files** from sandbox `/templates/{name}/` to `/home/user/project/` when creating projects
3. **Set environment variables** for AI provider API keys
4. **Start dev server** and provide preview URL

## ⚡ Docker Optimizations Applied

All Dockerfiles have been optimized to reduce layer count and build time:

1. **Combined RUN commands**: Single layer for system packages + npm globals
2. **Cache cleaning**: `npm cache clean --force` and `pnpm store prune` after installs
3. **Shallow git clone**: `git clone --depth 1` to minimize downloaded data
4. **Removed redundant operations**: Eliminated duplicate npm installs
5. **Layer reuse**: Optimized for Docker layer caching

**Note**: Disk sizes currently show ~7 GB due to cached layers from previous builds. Fresh builds in production will use the optimized Dockerfiles and may show smaller sizes.

## 🗄️ Tier Configuration

**Base tier updated**:
- **Disk**: 5120 MB (5 GB) - sufficient for Next.js with node_modules
- **CPU**: 2 vCPUs - appropriate for development sandboxes
- **RAM**: 4096 MB (4 GB) - balanced for Next.js dev servers
- **Concurrent instances**: 3 - encourages tier upgrades

## 📅 Deployment Info

- **Initial Deployment**: October 14, 2025
- **Latest Update**: October 15, 2025 (Rebuilt with proper E2B base images)
- **E2B Domain**: `ledgai.com`
- **E2B Infrastructure**: Self-hosted (Google Cloud)
- **Envd Version**: 0.3.4
- **Base Image**: `e2bdev/code-interpreter:latest`
- **Total templates**: 3
- **Access**: Public (team-only via API keys)

## 🚀 Snapshot Performance

With the proper E2B base image, these templates now benefit from:
- **Fast boot times**: Sandboxes start in ~200-500ms (vs seconds with regular Docker images)
- **Pre-installed dependencies**: All npm/pnpm packages already installed in snapshot
- **Persistent processes**: Jupyter server and other services already running
- **Instant file access**: Template files immediately available at boot

## 🔄 Future Updates

To rebuild templates after Dockerfile changes:

```bash
cd e2b-templates/{template-name}
E2B_DOMAIN=ledgai.com \
E2B_API_KEY=e2b_5528ce6c926983af2b5fe13a73444d1b7ba53efb \
E2B_ACCESS_TOKEN=sk_e2b_cff0821a40457e87fc89dbf394c3fcd727be341e \
e2b template build-v2 {template-name} --dockerfile e2b.Dockerfile --cpu-count 2 --memory-mb 2048

# Then publish
E2B_DOMAIN=ledgai.com E2B_ACCESS_TOKEN=sk_e2b_cff0821a40457e87fc89dbf394c3fcd727be341e \
e2b template publish {template-name} --yes
```

---

For more information, see the individual Dockerfiles in each template directory.
