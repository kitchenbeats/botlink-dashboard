import { createClient } from '@/lib/clients/supabase/server'
import { encodedRedirect } from '@/lib/utils/auth'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const message = requestUrl.searchParams.get('message')
  const newEmail = requestUrl.searchParams.get('new_email')
  const code = requestUrl.searchParams.get('code')

  const next = '/dashboard/account'

  if (!code && !message) {
    encodedRedirect('error', next, 'Invalid email verification link', {
      type: 'update_email',
    })
  }

  if (message) {
    redirect(`${next}?message=${message}&type=update_email`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code!)

  if (error) {
    encodedRedirect('error', next, 'Failed to update E-Mail', {
      type: 'update_email',
    })
  }

  encodedRedirect('success', next, 'E-Mail changed successfully', {
    new_email: newEmail || '',
    type: 'update_email',
  })
}
