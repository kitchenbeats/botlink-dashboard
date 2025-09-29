interface SandboxEvent {
  timestamp: string
  sandboxId: string
  sandboxExecutionId: string
  sandboxTemplateId: string
  sandboxBuildId: string
  sandboxTeamId: string
  eventCategory: string
  eventLabel: string
  eventData?: object | null
}

interface SandboxWebhooksPayloadGet {
  teamID: string
  url: string
  events: string[]
}

interface SandboxWebhooksPayloadPost {
  url: string
  events: string[]
}

interface SandboxWebhooksPayloadPatch {
  url?: string
  events?: string[]
}

export type {
  SandboxEvent,
  SandboxWebhooksPayloadGet,
  SandboxWebhooksPayloadPatch,
  SandboxWebhooksPayloadPost,
}
