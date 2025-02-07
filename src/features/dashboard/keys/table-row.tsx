'use client'

import { useToast } from '@/lib/hooks/use-toast'
import { TableCell, TableRow } from '@/ui/primitives/table'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/ui/primitives/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/ui/primitives/dropdown-menu'
import { ObscuredApiKey } from '@/server/keys/types'
import { deleteApiKeyAction } from '@/server/keys/key-actions'
import { AlertDialog } from '@/ui/alert-dialog'
import { useState, startTransition } from 'react'
import { useSelectedTeam } from '@/lib/hooks/use-teams'

interface TableRowProps {
  apiKey: ObscuredApiKey
  index: number
}

export default function ApiKeyTableRow({ apiKey, index }: TableRowProps) {
  const { toast } = useToast()
  const selectedTeam = useSelectedTeam()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const deleteKey = async (apiKeyId: string) => {
    if (!selectedTeam) {
      return
    }

    setIsDeleting(true)
    startTransition(async () => {
      try {
        await deleteApiKeyAction({
          teamId: selectedTeam.id,
          apiKeyId,
        })

        toast({
          title: 'Success',
          description: 'API key deleted successfully',
          variant: 'success',
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete API key',
          variant: 'error',
        })
      } finally {
        setIsDeleting(false)
        setIsDeleteDialogOpen(false)
      }
    })
  }

  return (
    <>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete API Key"
        description="Are you sure you want to delete this API key? This action cannot be undone."
        confirm="Delete"
        onConfirm={() => deleteKey(apiKey.id)}
        confirmProps={{
          disabled: isDeleting,
          loading: isDeleting,
        }}
      />

      <TableRow key={`${apiKey.name}-${index}`}>
        <TableCell className="flex flex-col gap-1 text-left font-mono">
          {apiKey.name}
          <span className="pl-1 text-fg-500">{apiKey.maskedKey}</span>
        </TableCell>
        <TableCell className="max-w-36 overflow-hidden truncate text-fg-500">
          <span className="max-w-full truncate">{apiKey.createdBy}</span>
        </TableCell>
        <TableCell className="text-right text-fg-300">
          {apiKey.createdAt
            ? new Date(apiKey.createdAt).toLocaleDateString()
            : '-'}
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Danger Zone</DropdownMenuLabel>
                <DropdownMenuItem
                  inset
                  variant="error"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeleting}
                >
                  X Delete
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    </>
  )
}
