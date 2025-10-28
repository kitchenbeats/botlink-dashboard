/**
 * Agent Prompt Configurations
 *
 * Centralized location for all template-specific agent prompts
 */

export * from './types'
export * from './get-template-prompt'

// Export individual templates for direct access if needed
export { simpleSitePrompt } from './templates/simple-site'
export { nextjsPrompt } from './templates/nextjs'
export { nextjsSaasPrompt } from './templates/nextjs-saas'
export { wordpressPrompt } from './templates/wordpress'

// Export modes
export { checkYourWorkMode } from './modes/check-your-work'
