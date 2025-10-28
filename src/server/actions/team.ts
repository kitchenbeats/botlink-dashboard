'use server'

import { createClient } from '@/lib/clients/supabase/server'
import { getCurrentTeam, setCurrentTeam } from '@/lib/db/teams'
import { revalidatePath } from 'next/cache'

/**
 * Get the user's current team
 */
export async function getUserCurrentTeam() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  return await getCurrentTeam(user.id)
}

/**
 * Switch the user's current team
 */
export async function switchUserTeam(teamId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  await setCurrentTeam(user.id, teamId)

  // Revalidate all dashboard pages
  revalidatePath('/dashboard', 'layout')

  return { success: true }
}
