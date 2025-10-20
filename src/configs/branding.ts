/**
 * Centralized branding configuration for ReactWrite
 * Update this file to change all branding across the app
 */

export const BRANDING = {
  // Product name
  name: 'ReactWrite',
  shortName: 'RW',

  // Tagline/Description
  tagline: 'AI-Powered Code Generation Platform',
  description: 'ReactWrite enables developers to build applications faster with intelligent AI agents and live workspace environments.',

  // Social
  twitter: '@reactwrite',

  // Legal
  companyName: 'ReactWrite',

  // URLs
  website: 'https://reactwrite.com',
  domain: 'reactwrite.com',
} as const

export type Branding = typeof BRANDING
