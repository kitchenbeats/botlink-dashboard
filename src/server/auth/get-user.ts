import { SupabaseClient } from '@supabase/supabase-js'

export async function getUser(supabase: SupabaseClient) {
  return await supabase.auth.getUser()
}
