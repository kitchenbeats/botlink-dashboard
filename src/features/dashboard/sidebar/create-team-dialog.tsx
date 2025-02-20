'use client'

import * as React from 'react'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/primitives/dialog'
import { Button } from '@/ui/primitives/button'
import { Input } from '@/ui/primitives/input'
import { Label } from '@/ui/primitives/label'
import { createTeamAction } from '@/server/team/team-actions'
import { toast } from '@/lib/hooks/use-toast'
import { useTeams } from '@/lib/hooks/use-teams'
import { useRouter } from 'next/navigation'
import { PROTECTED_URLS } from '@/configs/urls'

interface CreateTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTeamDialog({
  open,
  onOpenChange,
}: CreateTeamDialogProps) {
  const [teamName, setTeamName] = useState('')

  const { mutate: refetchTeams } = useTeams()
  const router = useRouter()

  const {
    mutate: createTeam,
    isPending: isMutatingTeamCreation,
    reset: resetCreateTeamMutation,
  } = useMutation({
    mutationFn: async (name: string) => {
      const response = await createTeamAction({ name })

      if (response.type === 'error') {
        throw new Error(response.message)
      }

      await refetchTeams()

      return response
    },
    onSuccess: (data) => {
      onOpenChange(false)

      toast({
        title: 'Team created',
        description: 'Team created successfully',
        variant: 'success',
      })

      router.push(PROTECTED_URLS.SANDBOXES(data.data.slug ?? data.data.id))
    },
    onError: (error) => {
      toast({
        title: error.message,
        description: error.message,
        variant: 'error',
      })
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (value) return

        setTeamName('')
        resetCreateTeamMutation()
        onOpenChange(value)
      }}
    >
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>
            Create a new team to collaborate with others.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            createTeam(teamName)
          }}
        >
          <div className="flex flex-col gap-3 px-2 py-6">
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              name="team-name"
              placeholder="Enter team name"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={isMutatingTeamCreation}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isMutatingTeamCreation}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isMutatingTeamCreation}
              loading={isMutatingTeamCreation}
            >
              Create Team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
