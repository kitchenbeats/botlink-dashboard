/**
 * Types for project template-specific agent prompts
 */

export interface ProjectTemplatePrompt {
  name: string
  description: string
  systemPrompt: (
    projectContext: string,
    conversationHistory?: string,
    workDir?: string
  ) => string
}

export type ProjectTemplate = 'simple_site' | 'nextjs' | 'nextjs_saas' | 'wordpress'
