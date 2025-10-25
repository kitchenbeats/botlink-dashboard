import { LiveSandboxCounterServer } from '@/features/dashboard/sandboxes/live-counter.server'

interface SandboxesHeaderInjectablePageProps {
  params: Promise<{ teamIdOrSlug: string }>
}

export default async function SandboxesHeaderInjectablePage(props: SandboxesHeaderInjectablePageProps) {
  const params = await props.params;
  return (
    <LiveSandboxCounterServer
      params={params}
      className="top-5 absolute right-17 max-md:hidden"
    />
  )
}
