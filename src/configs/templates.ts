/**
 * Centralized E2B template configuration for ReactWrite
 * Update this file to change template mappings across the entire app
 */

export interface TemplateConfig {
  id: string
  name: string
  description: string
  workDir: string
  icon?: string
  features?: readonly string[]
}

// Map project template type -> E2B template ID (key = E2B template ID)
export const TEMPLATES = {
  'reactwrite-simple-html': {
    id: 'simple_site',
    name: 'Simple HTML Site',
    description: 'Basic HTML, CSS, and JavaScript website with live preview',
    workDir: '/templates/simple-html',
    icon: '🌐',
    features: ['HTML5', 'CSS3', 'JavaScript', 'Live Server'],
  },
  'reactwrite-nextjs-basic': {
    id: 'nextjs',
    name: 'Next.js Basic',
    description: 'Next.js 15 App Router with TypeScript and Tailwind CSS',
    workDir: '/templates/nextjs-basic',
    icon: '⚡',
    features: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'App Router'],
  },
  'reactwrite-nextjs-saas': {
    id: 'nextjs_saas',
    name: 'Next.js SaaS Starter',
    description: 'Full-featured SaaS template with authentication, database, and more',
    workDir: '/templates/nextjs-saas',
    icon: '🚀',
    features: ['Next.js 15', 'Supabase Auth', 'Prisma', 'Stripe Ready', 'Dashboard UI'],
  },
} as const

export type E2BTemplateId = keyof typeof TEMPLATES
export type ProjectTemplate = typeof TEMPLATES[E2BTemplateId]['id']

/**
 * Get E2B template ID for a project template type
 */
export function getE2BTemplateId(projectTemplate: string): string {
  const entry = Object.entries(TEMPLATES).find(([_, config]) => config.id === projectTemplate)
  return entry?.[0] || 'reactwrite-simple-html'
}

/**
 * Get template config by project template type
 */
export function getTemplateConfig(projectTemplate: string): TemplateConfig & { e2bTemplateId: string } {
  const e2bTemplateId = getE2BTemplateId(projectTemplate)
  return {
    e2bTemplateId,
    ...TEMPLATES[e2bTemplateId as E2BTemplateId],
  }
}

/**
 * Get working directory for a template
 */
export function getTemplateWorkDir(projectTemplate: string): string {
  return getTemplateConfig(projectTemplate).workDir
}

/**
 * Get all templates as an array
 */
export function getAllTemplates(): Array<TemplateConfig & { e2bTemplateId: string }> {
  return Object.entries(TEMPLATES).map(([e2bTemplateId, config]) => ({
    e2bTemplateId,
    ...config,
  }))
}
