'use client'

import { PROTECTED_URLS } from '@/configs/urls'
import {
  defaultErrorToast,
  defaultSuccessToast,
  toast,
} from '@/lib/hooks/use-toast'
import { deleteTeamAction } from '@/server/team/team-actions'
import { AlertDialog } from '@/ui/alert-dialog'
import { Button } from '@/ui/primitives/button'
import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'

interface DeleteTeamButtonProps {
  teamId: string
  isDefault: boolean
}

export function DeleteTeamButton({ teamId, isDefault }: DeleteTeamButtonProps) {
  const router = useRouter()

  const { execute, isExecuting } = useAction(deleteTeamAction, {
    onError: ({ error }) => {
      toast(defaultErrorToast(error.serverError || 'Failed to delete team'))
    },
    onSuccess: () => {
      toast(defaultSuccessToast('Team deleted successfully'))
      router.push(PROTECTED_URLS.DASHBOARD)
      router.refresh()
    },
  })

  const handleDelete = () => {
    execute({ teamId })
  }

  return (
    <AlertDialog
      title="Delete Team"
      description="Are you sure you want to delete this team? This action cannot be undone and will permanently delete all data associated with this team."
      confirm="Delete Team"
      onConfirm={handleDelete}
      trigger={
        <Button variant="error" disabled={isDefault || isExecuting} loading={isExecuting}>
          Delete Team
        </Button>
      }
    />
  )
}
