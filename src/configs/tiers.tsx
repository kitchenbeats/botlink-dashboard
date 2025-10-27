import { Database } from '@/types/database.types'
import { ReactNode } from 'react'

// NOTE: local object of public tiers present in the database
// TODO: add is_public to tiers table and fetch only public tiers instead of hardcoding
export type Tier = Pick<
  Database['public']['Tables']['tiers']['Row'],
  'id' | 'name' | 'concurrent_instances' | 'disk_mb' | 'max_length_hours'
> & {
  prose: ReactNode[]
  max_vcpu?: number
  max_ram_mb?: number
}

export const TIERS: Tier[] = [
  {
    id: 'base_v1',
    name: 'Free',
    concurrent_instances: 1,
    disk_mb: 5120,
    max_length_hours: 1,
    max_vcpu: 1,
    max_ram_mb: 512,
    prose: [
      'Perfect for testing and learning',
      '1 active project',
      'AI-powered code generation',
      'Simple Agent mode',
      'Basic AI models (Haiku, GPT-4o-mini)',
      'Automatic snapshots',
      'Community support',
    ],
  },
  {
    id: 'pro_v1',
    name: 'Pro',
    concurrent_instances: 100,
    disk_mb: 5120,
    max_length_hours: 24,
    max_vcpu: 4,
    max_ram_mb: 8192,
    prose: [
      'Coming Soon',
      'Unlimited active projects',
      'Advanced Agent mode with orchestration',
      'Premium AI models (Sonnet 4.5, GPT-4o)',
      'Custom agent creation',
      'GitHub integration',
      'Priority support',
    ],
  },
]
