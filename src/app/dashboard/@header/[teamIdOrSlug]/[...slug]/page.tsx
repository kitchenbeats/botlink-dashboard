import { LiveSandboxCounterServer } from '@/features/dashboard/sandboxes/live-counter.server'

interface SandboxesHeaderInjectablePageProps {
  params: Promise<{ teamIdOrSlug: string }>
}

export default async function SandboxesHeaderInjectablePage(props: SandboxesHeaderInjectablePageProps) {
  return (
    <LiveSandboxCounterServer
      params={props.params}
      className="top-5 absolute right-17 max-md:hidden"
    />
  )
}
