# ReactWrite Architecture

## Overview

ReactWrite is a multi-agent orchestration platform where AI agents dynamically collaborate to solve complex tasks. The system uses a human-in-the-loop approach, pausing for user review before executing the orchestrated workflow.

## Workflow Execution Flow

```
User Input
    ↓
Task Planner Agent
    ↓
Logic Checker Agent (validates plan)
    ↓ (loop until valid)
Orchestrator Agent
    ↓
Creates Specialized Generic Agents (frontend expert, backend expert, integration expert, etc.)
    ↓
[PAUSE] Human Review & Approval
    ↓
Execute Tasks with Coding Agents with tools
    ↓
Code feeback agent (this is the expert lead dev checking code and giving feedback or clearing it for production)
    ↓
Logic Checker Agent (validates each task is complete)
    ↓ (loop until valid per task)
Completion & User Feedback
```

#### Agent Executor (`agent-executor.ts`)

- Uses **Anthropic Claude Agent SDK** for execution
- Built-in streaming message generation
- Type-safe with SDK's query() function
- Implements retry logic (max 3 attempts)
- Updates task status throughout execution
- Supports all Claude models via SDK

#### Orchestrator (`orchestrator.ts`)

**Phase 1: Planning (run)**

1. Get Task Planner agent
2. Create planning task
3. Execute planner
4. Validate plan with Logic Checker (loop)
5. Get Orchestrator agent
6. Execute orchestrator to generate specialized agents
7. Create specialized agents in database
8. PAUSE execution (status: 'paused')

**Phase 2: Execution (resume)**

1. Load specialized agents from database
2. Create tasks for each agent
3. Execute tasks with logic checking
4. Mark execution complete

### 3. Agent Types

#### Task Planner

- **Type:** `planner`
- **Purpose:** Break down user requests into tasks
- **Output:** JSON with tasks array and strategy

#### Orchestrator

- **Type:** `orchestrator`
- **Purpose:** Create specialized agents for each task
- **Output:** JSON with agents array and assignments

#### Logic Checker

- **Type:** `logic_checker`
- **Purpose:** Validate work completion
- **Output:** JSON with passed boolean and feedback

#### Generic Agent

- **Type:** `generic`
- **Purpose:** User-configurable for any task
- **Configuration:** Full control over prompts, model, params

### 4. Server Actions (`/actions`)

- `createAgentAction` - Create new agent
- `updateAgentAction` - Update agent config
- `deleteAgentAction` - Remove agent
- `createWorkflowAction` - Create workflow
- `updateWorkflowAction` - Update workflow
- `deleteWorkflowAction` - Remove workflow
- `startExecutionAction` - Start workflow (Phase 1)
- `resumeExecutionAction` - Resume workflow (Phase 2)

### 5. UI Layer (`/app`)

#### Route Structure

```
/(dashboard)
  /page.tsx              - Dashboard with stats
  /agents
    /page.tsx            - Agent list
  /workflows
    /page.tsx            - Workflow list
  /executions
    /page.tsx            - Execution history
  /setup
    /page.tsx            - Initialize default agents
```

All pages are Server Components that:

1. Check authentication
2. Fetch user's organization
3. Query relevant data
4. Render UI

## Data Flow

### Creating an Execution

1. User submits prompt via UI
2. `startExecutionAction` called
3. Creates execution record (status: 'pending')
4. `startWorkflowExecution` runs orchestration Phase 1
5. Execution paused (status: 'paused')
6. UI displays plan + generated agents for review
7. User approves and clicks "Run"
8. `resumeExecutionAction` called
9. `resumeWorkflowExecution` runs orchestration Phase 2
10. Execution completes (status: 'completed')

### Agent Execution Loop

```typescript
for each task:
  attempt = 0
  while attempt < maxAttempts:
    execute agent
    send output to logic checker
    if logic checker passes:
      mark task complete
      break
    else:
      increment attempt
      retry with feedback
```

## Type System

### Database Types (`/lib/types/database.ts`)

- Full TypeScript types for all tables
- Insert types (without id, timestamps)
- Update types (partial, without id/team_id)

### Agent Types (`/lib/types/agents.ts`)

- Message interface
- AgentResponse interface
- Structured output types (TaskPlannerOutput, etc.)

## Security

### Authentication

- Supabase Auth with email/password
- Session stored in cookies via @supabase/ssr

### Authorization

- Row Level Security (RLS) on all tables
- team_id check: `WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())`
- Enforced at database level, not application

### API Security

- API keys stored in environment variables
- Never exposed to client
- Server-side only via Server Actions and API routes

## Scalability Considerations

### Current Implementation

- Synchronous task execution
- Single execution at a time per workflow
- In-memory message history

### Future Improvements

- Queue-based task execution (BullMQ, Inngest)
- Parallel task execution where possible
- Persistent message/log storage
- Streaming responses for real-time updates
- Webhook notifications on completion

## Error Handling

1. **Database Errors** - Thrown and caught by Server Actions
2. **LLM Errors** - Retry logic (3 attempts)
3. **Validation Errors** - Logic Checker provides feedback
4. **Auth Errors** - Redirect to login

All errors surface to UI via Server Action return values:

```typescript
{ success: false, error: string }
```

## Performance Optimizations

1. **Database Indexes** - On team_id, status, timestamps
2. **Server Components** - No client-side JS for data fetching
3. **Streaming** - Server Actions for mutations
4. **Caching** - Next.js automatic caching with revalidatePath

## Development Workflow

1. Make schema changes → Create migration
2. Update types in `/lib/types`
3. Add/update DB functions in `/lib/db`
4. Implement business logic in `/lib/services`
5. Create Server Actions in `/actions`
6. Build UI in `/app` (Server Components)

## Testing Strategy (Future)

- **Unit Tests** - Service layer logic
- **Integration Tests** - Database queries
- **E2E Tests** - Full workflow execution
- **LLM Tests** - Prompt validation with test cases

---

This architecture prioritizes:

- **Type Safety** - Strict TypeScript
- **Security** - RLS + Server-side API calls
- **Simplicity** - Clear separation of concerns
- **Performance** - Server Components + caching
- **Scalability** - Service layer ready for queues/workers
