import type { createClient } from '@/lib/clients/supabase/server'

export async function getUser(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  return await supabase.auth.getUser()
}
