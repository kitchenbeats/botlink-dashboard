'use client'

import { useSelectedTeam } from '@/lib/hooks/use-teams'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/primitives/card'
import LimitForm from './limit-form'
import { BillingLimit } from '@/types/billing'

interface LimitCardProps {
  className?: string
  value: BillingLimit['limit_amount_gte']
}

export default function LimitCard({ className, value }: LimitCardProps) {
  const team = useSelectedTeam()

  if (!team) return null

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="font-mono">Enable Budget Limit</CardTitle>
      </CardHeader>
      <CardContent className="max-w-[500px] text-xs text-fg-500">
        <LimitForm
          className="mb-4"
          teamId={team.id}
          originalValue={value}
          type="limit"
        />
        <div className="pl-2">
          <p>
            If your team exceeds this threshold in a given billing period,
            subsequent API requests will be blocked.
          </p>
          <p>
            You will automatically receive email notifications when your usage
            reaches <b>50%</b>, <b>80%</b>, <b>90%</b>, and <b>100%</b> of this
            limit.
          </p>
          <br />
          <p className="text-error">
            <b>Caution:</b> Enabling a budget limit may cause interruptions to
            your service. Once your Budget Limit is reached, your team will not
            be able to create new sandboxes in the given billing period unless
            the limit is increased.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
