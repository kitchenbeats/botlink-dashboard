'use client'

import { useTeam } from '@/lib/hooks/use-team'
import { redirectToCustomerPortal } from '@/server/billing/billing-actions'
import ExternalIcon from '@/ui/external-icon'
import { Button } from '@/ui/primitives/button'
import { Loader } from '@/ui/primitives/loader'
import { useAction } from 'next-safe-action/hooks'

interface CustomerPortalLinkProps {
  className?: string
}

export default function CustomerPortalLink({
  className,
}: CustomerPortalLinkProps) {
  const { team } = useTeam()

  const { isTransitioning, execute } = useAction(redirectToCustomerPortal)

  if (!team) return null

  return (
    <Button
      onClick={() => execute({ teamId: team.id })}
      disabled={isTransitioning}
      variant="outline"
      size="lg"
      className={className}
    >
      Manage Subscription
      {isTransitioning ? (
        <Loader className="text-accent-main-highlight " />
      ) : (
        <ExternalIcon className="translate-x-1" />
      )}
    </Button>
  )
}
