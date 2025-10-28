/**
 * Dynamic Template Prompt Loader
 *
 * Selects the appropriate agent configuration based on project template type
 */

import { simpleSitePrompt } from './templates/simple-site'
import { nextjsPrompt } from './templates/nextjs'
import { nextjsSaasPrompt } from './templates/nextjs-saas'
import { wordpressPrompt } from './templates/wordpress'
import { checkYourWorkMode } from './modes/check-your-work'
import type { ProjectTemplate, ProjectTemplatePrompt } from './types'

/**
 * Get template-specific agent configuration
 *
 * @param template - Project template type
 * @returns Template-specific prompt configuration
 */
export function getTemplatePrompt(template: ProjectTemplate): ProjectTemplatePrompt {
  switch (template) {
    case 'simple_site':
      return simpleSitePrompt
    case 'nextjs':
      return nextjsPrompt
    case 'nextjs_saas':
      return nextjsSaasPrompt
    case 'wordpress':
      return wordpressPrompt
    default:
      // Fallback to Next.js for unknown templates
      return nextjsPrompt
  }
}

/**
 * Generate system prompt for a project
 *
 * @param template - Project template type
 * @param projectContext - Project-specific context (file tree, dependencies, etc.)
 * @param conversationHistory - Optional conversation history
 * @param workDir - Working directory path
 * @param checkYourWork - Enable rigorous documentation checking mode
 * @returns Complete system prompt string
 */
export function generateSystemPrompt(
  template: ProjectTemplate,
  projectContext: string,
  conversationHistory?: string,
  workDir?: string,
  checkYourWork?: boolean
): string {
  const config = getTemplatePrompt(template)
  let prompt = config.systemPrompt(projectContext, conversationHistory, workDir)

  // Wrap with check-your-work mode if enabled
  if (checkYourWork) {
    prompt = checkYourWorkMode.wrapPrompt(prompt)
  }

  return prompt
}
