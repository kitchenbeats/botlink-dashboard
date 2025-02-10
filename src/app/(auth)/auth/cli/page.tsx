import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { CloudIcon, LaptopIcon, Link2Icon } from 'lucide-react'
import { createClient } from '@/lib/clients/supabase/server'
import { logger } from '@/lib/clients/logger'
import { ERROR_CODES } from '@/configs/logs'
import { AUTH_URLS, PROTECTED_URLS } from '@/configs/urls'
import {
  bailOutFromPPR,
  getTeamApiKey,
  getUserAccessToken,
} from '@/lib/utils/server'
import { encodedRedirect } from '@/lib/utils/auth'
import { Alert, AlertDescription, AlertTitle } from '@/ui/primitives/alert'
import { getDefaultTeamRelation } from '@/server/auth/get-default-team'

// Mark route as dynamic to prevent static optimization
export const dynamic = 'force-dynamic'

// Types
type CLISearchParams = Promise<{
  next?: string
  state?: string
  error?: string
}>

// Server Actions

async function handleCLIAuth(next: string, userId: string, userEmail: string) {
  if (!next?.startsWith('http://localhost')) {
    throw new Error('Invalid redirect URL')
  }

  try {
    const defaultTeam = await getDefaultTeamRelation(userId)
    const [apiKey, accessToken] = await Promise.all([
      getTeamApiKey(userId, defaultTeam.team_id),
      getUserAccessToken(userId),
    ])

    const searchParams = new URLSearchParams({
      email: userEmail,
      defaultTeamApiKey: apiKey,
      accessToken,
      defaultTeamId: defaultTeam.team_id,
    })

    return redirect(`${next}?${searchParams.toString()}`)
  } catch (err) {
    throw err
  }
}

// UI Components
function CLIIcons() {
  return (
    <p className="flex items-center justify-center gap-4 text-3xl font-bold tracking-tight sm:text-4xl">
      <span className="text-fg-500">
        <LaptopIcon size={50} />
      </span>
      <span className="text-fg-300">
        <Link2Icon size={30} />
      </span>
      <span className="text-fg-500">
        <CloudIcon size={50} />
      </span>
    </p>
  )
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="error" border="bottom" className="text-start">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

function SuccessState() {
  return (
    <>
      <h2 className="text-brand-400 font-bold">Successfully linked</h2>
      <div>You can close this page and start using CLI.</div>
    </>
  )
}

// Main Component
export default async function CLIAuthPage({
  searchParams,
}: {
  searchParams: CLISearchParams
}) {
  bailOutFromPPR()

  const { next, state, error } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (state === 'success') {
    return <SuccessState />
  }

  // Validate redirect URL
  if (!next?.startsWith('http://localhost')) {
    logger.error(ERROR_CODES.CLI_AUTH, 'Invalid redirect URL')
    redirect(PROTECTED_URLS.DASHBOARD)
  }

  // If user is not authenticated, redirect to sign in with return URL
  if (!user) {
    const searchParams = new URLSearchParams({
      returnTo: `${AUTH_URLS.CLI}?${new URLSearchParams({ next }).toString()}`,
    })
    redirect(`${AUTH_URLS.SIGN_IN}?${searchParams.toString()}`)
  }

  // Handle CLI callback if authenticated
  if (!error && next && user) {
    try {
      return await handleCLIAuth(next, user.id, user.email!)
    } catch (err) {
      if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
        throw err
      }

      logger.error(ERROR_CODES.CLI_AUTH, err)

      return encodedRedirect('error', '/auth/cli', (err as Error).message, {
        next,
      })
    }
  }

  return (
    <div className="p-6 text-center">
      <CLIIcons />
      <h2 className="mt-6 text-base leading-7">
        Linking CLI with your account
      </h2>
      <div className="mt-12 leading-8 text-fg-500">
        <Suspense fallback={<div>Loading...</div>}>
          {error ? (
            <ErrorAlert message={decodeURIComponent(error)} />
          ) : (
            <div>Authorizing CLI...</div>
          )}
        </Suspense>
      </div>
    </div>
  )
}
