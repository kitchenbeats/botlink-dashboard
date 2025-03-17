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
import { useState } from 'react'
import { useSelectedTeam } from '@/lib/hooks/use-teams'
import { motion } from 'motion/react'
import { exponentialSmoothing } from '@/lib/utils'
import { useAction } from 'next-safe-action/hooks'
import { defaultSuccessToast, defaultErrorToast } from '@/lib/hooks/use-toast'

interface TableRowProps {
  apiKey: ObscuredApiKey
  index: number
}

export default function ApiKeyTableRow({ apiKey, index }: TableRowProps) {
  const { toast } = useToast()
  const selectedTeam = useSelectedTeam()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [hoveredRowIndex, setHoveredRowIndex] = useState(-1)
  const [dropDownOpen, setDropDownOpen] = useState(false)

  const { execute: executeDeleteKey, isExecuting: isDeleting } = useAction(
    deleteApiKeyAction,
    {
      onSuccess: () => {
        toast(defaultSuccessToast('Api key has been deleted.'))
        setIsDeleteDialogOpen(false)
      },
      onError: (error) => {
        toast(
          defaultErrorToast(
            error.error.serverError || 'Failed to delete api key.'
          )
        )
        setIsDeleteDialogOpen(false)
      },
    }
  )

  const deleteKey = () => {
    if (!selectedTeam) {
      return
    }

    executeDeleteKey({
      teamId: selectedTeam.id,
      apiKeyId: apiKey.id,
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
        onConfirm={deleteKey}
        confirmProps={{
          disabled: isDeleting,
          loading: isDeleting,
        }}
      />

      <TableRow
        key={`${apiKey.name}-${index}`}
        onMouseEnter={() => setHoveredRowIndex(index)}
        onMouseLeave={() => setHoveredRowIndex(-1)}
      >
        <TableCell className="flex flex-col gap-1 text-left font-mono">
          {apiKey.name}
          <span className="text-fg-500 pl-1">{apiKey.maskedKey}</span>
        </TableCell>
        <TableCell className="text-fg-500 max-w-36 truncate overflow-hidden">
          <span className="max-w-full truncate">{apiKey.createdBy}</span>
        </TableCell>
        <TableCell className="text-fg-300 text-right">
          {apiKey.createdAt
            ? new Date(apiKey.createdAt).toLocaleDateString()
            : '-'}
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu onOpenChange={setDropDownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs" asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  animate={{
                    opacity: hoveredRowIndex === index || dropDownOpen ? 1 : 0,
                  }}
                  transition={{
                    duration: 0.2,
                    ease: exponentialSmoothing(5),
                  }}
                >
                  <MoreHorizontal className="size-4" />
                </motion.button>
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
