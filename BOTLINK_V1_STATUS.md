# BotLink v1 - Status & Progress

**Last Updated**: January 2025

---

## 🎯 Vision

BotLink is an **AI-powered app builder** platform with two opinionated builders:
1. **HTML Site Builder** - For simple static websites
2. **Next.js App Builder** - For modern web applications

**E2B Integration**: E2B sandboxes run in the background for code execution, but users primarily interact with our app builders.

---

## ✅ What's Complete

### 1. Inngest Agent Orchestration (Backend) ✅
- **Simple Mode**: Single coding agent with E2B sandbox tools
  - File: `src/lib/services/coding-agent.ts`
  - Tools: terminal, files, code execution
  - Uses `createAgent()` from Inngest Agent Kit

- **System Multi-Agent Mode**: Pre-built workflow orchestration
  - File: `src/lib/inngest/workflow-function.ts`
  - Flow: Task Planner → Logic Checker → Orchestrator → Dynamic Agents
  - Uses `createNetwork()` with agent routing

- **Inngest Realtime**: Live streaming to UI
  - Package: `@inngest/realtime@0.4.4`
  - Middleware: `realtimeMiddleware()`
  - Channel: `workspace-{projectId}`

### 2. Workspace Chat UI ✅
- File: `src/features/workspace/chat-panel.tsx`
- Realtime subscription with `useInngestSubscription`
- Two modes: Simple (⚡) and Agents (🤖)
- Plan approval UI with pause/resume
- Live progress updates

### 3. API Routes ✅
- `/api/chat` - Handles chat messages
- `/api/chat/resume` - Workflow approval
- `/api/workspace/subscription` - Realtime tokens

### 4. Database Schema ✅
- `agents` table - Stores system + custom agents
- `workflows` table - Stores workflow definitions
- `executions` table - Tracks execution history
- `tasks` table - Individual task tracking

### 5. Custom Agent Form ✅ (JUST COMPLETED)
- File: `src/features/agents/agent-form.tsx`
- Features:
  - Provider selection (Anthropic/OpenAI)
  - Model selection per provider
  - System prompt editor
  - Tool library checkboxes (terminal, files, code, web)
  - Temperature & max tokens config
  - Saves to database with Inngest-compatible structure

---

## 🚧 What's Next (In Progress)

### 1. Workflow Builder UI (Next Step)
- Visual flow editor using ReactFlow
- Drag agents into flow
- Define routing between agents
- Save workflow definition to DB

**Reference**: `/Users/jeremyhanlon/Documents/2025_Projects/botlink/components/workflow-builder.tsx`

### 2. Dynamic Agent Loading
- Load user's custom agents from database
- Create Inngest agents dynamically:
  ```ts
  const userAgent = createAgent({
    name: dbAgent.name,
    system: dbAgent.system_prompt,
    model: getModel(dbAgent.config.provider, dbAgent.model),
    tools: loadTools(dbAgent.config.tools)
  })
  ```

### 3. Custom Workflow Execution
- Load workflow definition from DB
- Create agent network with custom router
- Execute via Inngest:
  ```ts
  const network = createNetwork({
    agents: loadedAgents,
    defaultRouter: (ctx) => routeByWorkflow(ctx, dbWorkflow)
  })
  ```

### 4. Chat Panel 3rd Mode
- Add "My Custom Flow" button
- Load user's saved workflow
- Execute with their custom agents

---

## 📁 File Structure

### Core Agent System
```
src/lib/
├── inngest/
│   ├── client.ts          - Inngest client with realtime
│   └── workflow-function.ts - System orchestration
├── services/
│   ├── coding-agent.ts     - Simple mode agent
│   └── dynamic-agent-loader.ts - Load agents from DB
└── tools/
    ├── sandbox-tools.ts    - E2B integration
    └── orchestrator-tools.ts - Workflow tools
```

### UI Components
```
src/features/
├── agents/
│   ├── agent-form.tsx      - Create/edit agents ✅
│   ├── delete-button.tsx   - Delete agent
│   └── workflow-builder.tsx - Visual flow (TODO)
└── workspace/
    ├── chat-panel.tsx      - Chat UI with realtime ✅
    ├── code-editor.tsx     - File editor
    └── workspace-layout.tsx - 3-panel layout
```

### Server Actions
```
src/server/actions/
├── agents.ts     - CRUD for custom agents ✅
├── chat.ts       - Chat message handling ✅
└── workspace.ts  - Workspace operations ✅
```

### Database
```
src/lib/db/
├── agents.ts     - Agent queries
├── workflows.ts  - Workflow queries
└── executions.ts - Execution tracking
```

---

## 🎨 UI Hierarchy (v1 Scope)

For v1, all E2B features remain visible. We'll reorganize in v2:

**Current Nav** (E2B-focused):
- Sandboxes (E2B)
- Templates (E2B)
- Usage (E2B)
- Teams (E2B)

**Future Nav** (v2 - BotLink-focused):
- **App Builders** ← Primary
  - HTML Sites
  - Next.js Apps
- **Agents** ← Primary
  - My Custom Agents
  - System Agents
- **Workflows** ← Primary
- **E2B Features** ← Secondary
  - Sandboxes
  - Templates
  - Usage

---

## 🔄 Agent Modes (Complete System)

### Mode 1: Simple ⚡ (Works Now)
- Single Inngest coding agent
- Direct E2B sandbox execution
- Fast, no orchestration overhead

### Mode 2: System Agents 🤖 (Works Now)
- Pre-built multi-agent workflow
- Task Planner → Logic Checker → Orchestrator
- Dynamic specialized agent creation
- Human approval with pause/resume

### Mode 3: My Custom Flow 🎯 (Building Now)
- User creates custom agents via CRUD
- User designs workflow visually
- Inngest executes dynamically
- Full control over agent behavior

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Agent Framework**: Inngest Agent Kit
- **Realtime**: @inngest/realtime
- **Code Execution**: E2B Sandboxes
- **Database**: Supabase (PostgreSQL)
- **Workflow UI**: ReactFlow
- **AI Providers**: Anthropic (Claude), OpenAI (GPT)

---

## 📝 Next Steps

1. ✅ **Agent Form** - Complete
2. 🚧 **Workflow Builder** - Copy from old app, adapt for custom agents
3. 🚧 **Dynamic Loading** - Create agents from DB config
4. 🚧 **Execution Logic** - Run custom workflows with Inngest
5. 🚧 **Chat Integration** - Add 3rd mode button

---

## 🎯 v1 Success Criteria

- [ ] Users can create custom AI agents
- [ ] Users can design visual workflows
- [ ] Custom workflows execute via Inngest
- [ ] All 3 chat modes work (Simple, System, Custom)
- [ ] HTML & Next.js builders functional
- [ ] E2B features accessible but secondary

---

## 📚 Key References

- [Inngest Agent Kit Docs](https://agentkit.inngest.com/)
- [E2B Sandboxes](https://e2b.dev/docs)
- [ReactFlow Docs](https://reactflow.dev/)
- Old BotLink App: `/Users/jeremyhanlon/Documents/2025_Projects/botlink/`

---

**Status**: Agent CRUD complete. Ready for workflow builder next! 🚀
