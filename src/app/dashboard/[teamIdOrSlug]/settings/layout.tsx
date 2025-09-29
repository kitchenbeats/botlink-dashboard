import { INCLUDE_ARGUS } from '@/configs/flags'
import { DashboardTab, DashboardTabs } from '@/ui/dashboard-tabs'
import { KeyIcon, SettingsIcon, WebhookIcon } from '@/ui/primitives/icons'

interface SettingsLayoutProps {
  general: React.ReactNode
  keys: React.ReactNode
  webhooks: React.ReactNode
}

export default async function SettingsLayout({
  general,
  keys,
  webhooks,
}: SettingsLayoutProps) {
  return (
    <DashboardTabs
      type="query"
      layoutKey="tabs-indicator-settings"
      className="mt-2 md:mt-3"
    >
      <DashboardTab
        id="general"
        label="General"
        icon={<SettingsIcon className="size-5" />}
      >
        <ContentWrapper>{general}</ContentWrapper>
      </DashboardTab>
      <DashboardTab
        id="keys"
        label="Keys"
        icon={<KeyIcon className="size-5" />}
      >
        <ContentWrapper>{keys}</ContentWrapper>
      </DashboardTab>
      {INCLUDE_ARGUS && (
        <DashboardTab
          id="webhooks"
          label="Webhooks"
          icon={<WebhookIcon className="size-4" />}
        >
          <ContentWrapper>{webhooks}</ContentWrapper>
        </DashboardTab>
      )}
    </DashboardTabs>
  )
}

function ContentWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto h-full min-h-0">
      <div className="container mx-auto p-0 md:p-8 2xl:p-24 h-min w-full">
        {children}
      </div>
    </div>
  )
}
