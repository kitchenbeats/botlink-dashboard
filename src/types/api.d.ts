interface Sandbox {
  alias: string
  clientID: string
  cpuCount: number
  memoryMB: number
  metadata: Record<string, any>
  sandboxID: string
  startedAt: string
  endAt: string
  templateID: string
}

interface Template {
  aliases: string[]
  buildID: string
  cpuCount: number
  memoryMB: number
  public: boolean
  templateID: string
  createdAt: string
  updatedAt: string
  createdBy: {
    email: string
    id: string
  } | null
}

interface SandboxMetrics {
  cpuCount: number
  cpuUsedPct: number
  memTotalMiB: number
  memUsedMiB: number
  timestamp: string
}

export type { Sandbox, Template, SandboxMetrics }
