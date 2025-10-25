/**
 * Chat V2 Types
 * Professional structured chat system
 */

export interface FileChange {
  path: string
  action: 'created' | 'updated' | 'deleted'
  language?: string
}

export interface CommandExecution {
  command: string
  output: string
  success: boolean
}

export interface StructuredResponse {
  summary: string
  fileChanges: FileChange[]
  commandsRun: CommandExecution[]
  toolsUsed: string[]
  thinkingProcess?: string
  errors: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  structured?: StructuredResponse
  isStreaming?: boolean
}

export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
}

export type ReviewMode = 'off' | 'limited' | 'loop'
export type ExecutionMode = 'simple' | 'agents' | 'custom'
