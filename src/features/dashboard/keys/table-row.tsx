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
import { AnimatePresence, motion } from 'motion/react'
import { exponentialSmoothing } from '@/lib/utils'

interface TableRowProps {
  apiKey: ObscuredApiKey
  index: number
}

export default function ApiKeyTableRow({ apiKey, index }: TableRowProps) {
  const { toast } = useToast()
  const selectedTeam = useSelectedTeam()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hoveredRowIndex, setHoveredRowIndex] = useState(-1)
  const [dropDownOpen, setDropDownOpen] = useState(false)

  const deleteKey = async (apiKeyId: string) => {
    if (!selectedTeam) {
      return
    }

    setIsDeleting(true)
    startTransition(async () => {
      try {
        const res = await deleteApiKeyAction({
          teamId: selectedTeam.id,
          apiKeyId,
        })

        if (res.type === 'error') {
          throw new Error(res.message)
        }

        toast({
          title: 'Success',
          description: 'API key deleted successfully',
          variant: 'success',
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Unknown error',
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
