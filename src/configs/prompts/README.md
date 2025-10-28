# Agent Prompts Configuration

This directory contains centralized system prompts for all AI agents in the application.

## Structure

### Simple Framework (Inngest Agent-Kit)
- **simple-agent.ts**: Chat assistant for conversational AI
- **coding-agent.ts**: Coding agent with E2B sandbox tools and Code Reviewer

### Full Agent Framework (Multi-Agent Workflow)
- Located in `../agents/*.json`: System agents (Planner, Orchestrator, Logic Checker, Clarifier, etc.)

## Usage

### Simple Framework
```typescript
import { simpleAgentPrompt } from '@/configs/prompts/simple-agent'
import { codingAgentPrompt, codeReviewerPrompt } from '@/configs/prompts/coding-agent'

// Use in agent creation
const agent = createAgent({
  name: simpleAgentPrompt.name,
  description: simpleAgentPrompt.description,
  system: simpleAgentPrompt.systemPrompt,
  // ... other config
})
```

### Full Agent Framework
```typescript
import { getSystemAgents, getSystemAgentById } from '@/lib/services/system-agents'

// Loads all agents from ../agents/*.json
const agents = getSystemAgents()
const planner = getSystemAgentById('system-task-planner')
```

## Adding New Prompts

### For Simple Framework
1. Create a new file in `src/configs/prompts/`
2. Export a config object with `name`, `description`, and `systemPrompt`
3. Import and use in your agent service

### For Full Agent Framework
1. Create a new JSON file in `src/configs/agents/`
2. Follow the existing format with `id`, `name`, `type`, `model`, `system_prompt`, etc.
3. The system will automatically load it via `getSystemAgents()`

## Best Practices

- Keep prompts focused and specific to the agent's purpose
- Use template literals for dynamic content (project context, conversation history)
- Document any special instructions or constraints
- Test prompt changes in development before deploying
