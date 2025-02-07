'use client'

import { useSelectedTeam } from '@/lib/hooks/use-teams'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/primitives/card'
import LimitForm from './limit-form'
import { BillingLimit } from '@/types/billing'

interface AlertCardProps {
  className?: string
  value: BillingLimit['alert_amount_gte']
}

export default function AlertCard({ className, value }: AlertCardProps) {
  const team = useSelectedTeam()

  if (!team) return null

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="font-mono">Set a Budget Alert</CardTitle>
      </CardHeader>
      <CardContent className="max-w-[500px] text-xs text-fg-500">
        <LimitForm
          className="mb-4"
          teamId={team.id}
          originalValue={value}
          type="alert"
        />
        <p>
          If your team exceeds this threshold in a given month, you&apos;ll
          receive an alert notification to <b>ben.fornefeld@gmail.com</b>. This
          will not result in any interruptions to your service.
        </p>
      </CardContent>
    </Card>
  )
}
