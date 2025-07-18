import DashboardPageLayout from '@/features/dashboard/page-layout'
import { NameSettings } from '@/features/dashboard/account/name-settings'
import { EmailSettings } from '@/features/dashboard/account/email-settings'
import { Suspense } from 'react'
import { AccessTokenSettings } from '@/features/dashboard/account/access-token-settings'
import { PasswordSettingsServer } from '@/features/dashboard/account/password-settings-server'

export interface AccountPageSearchParams {
  reauth?: '1'
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<AccountPageSearchParams>
}) {
  return (
    <DashboardPageLayout
      hideFrame
      title="Account"
      className="flex flex-col gap-6"
    >
      <Suspense fallback={null}>
        <NameSettings />
      </Suspense>

      <Suspense fallback={null}>
        <EmailSettings />
      </Suspense>

      <Suspense fallback={null}>
        <AccessTokenSettings />
      </Suspense>

      <Suspense fallback={null}>
        <PasswordSettingsServer searchParams={await searchParams} />
      </Suspense>
    </DashboardPageLayout>
  )
}
