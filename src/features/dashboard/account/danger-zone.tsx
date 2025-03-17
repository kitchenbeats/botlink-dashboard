'use client'

import { signOutAction } from '@/server/auth/auth-actions'
import { deleteAccountAction } from '@/server/user/user-actions'
import { AlertDialog } from '@/ui/alert-dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/primitives/card'
import { Button } from '@/ui/primitives/button'
import { Input } from '@/ui/primitives/input'
import { useToast } from '@/lib/hooks/use-toast'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAction } from 'next-safe-action/hooks'
import { defaultErrorToast } from '@/lib/hooks/use-toast'

interface DangerZoneProps {
  className?: string
}

export function DangerZone({ className }: DangerZoneProps) {
  const { toast } = useToast()
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>('')

  const { execute: deleteAccount, isPending: isDeleting } = useAction(
    deleteAccountAction,
    {
      onSuccess: () => {
        toast({
          title: 'Account deleted',
          description: 'You have been signed out.',
          variant: 'success',
        })

        signOutAction()
      },
      onError: (error) => {
        toast(
          defaultErrorToast(
            error.error.serverError || 'Failed to delete account.'
          )
        )
      },
    }
  )

  return (
    <Card variant="slate" className={cn(className)}>
      <CardHeader>
        <CardTitle>Danger Zone</CardTitle>
        <CardDescription>
          Delete your account and all associated data.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <AlertDialog
          trigger={<Button variant="error">Delete Account</Button>}
          title="Delete Account"
          description={
            <>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </>
          }
          confirm="Delete Account"
          onConfirm={() => deleteAccount()}
          confirmProps={{
            disabled: deleteConfirmation !== 'delete my account',
            loading: isDeleting,
          }}
        >
          <>
            <p className="text-fg-500 mb-4">
              Please type{' '}
              <span className="text-fg font-medium">delete my account</span> to
              confirm:
            </p>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type 'delete my account' to confirm"
            />
          </>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
