'use client'

import { Skeleton } from '@/ui/primitives/skeleton'
import { useSelectedTeam, useTeams } from '@/lib/hooks/use-teams'
import { useTransition, useRef, useState } from 'react'
import { useToast } from '@/lib/hooks/use-toast'
import { Avatar, AvatarImage, AvatarFallback } from '@/ui/primitives/avatar'
import { cn, exponentialSmoothing } from '@/lib/utils'
import { Pencil, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cardVariants } from '@/ui/primitives/card'
import { uploadTeamProfilePictureAction } from '@/server/team/team-actions'
import { useAction } from 'next-safe-action/hooks'

interface ProfilePictureCardProps {
  className?: string
}

export function ProfilePictureCard({ className }: ProfilePictureCardProps) {
  const team = useSelectedTeam()
  const { refetch } = useTeams()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const { execute: uploadProfilePicture, isExecuting: isUploading } = useAction(
    uploadTeamProfilePictureAction,
    {
      onSuccess: () => {
        refetch()

        toast({
          title: 'Your team profile picture has been updated successfully.',
          variant: 'success',
        })
      },
      onError: ({ error }) => {
        if (error.validationErrors?.fieldErrors.image) {
          toast({
            title: error.validationErrors.fieldErrors.image[0],
            variant: 'error',
          })
          return
        }

        toast({
          title: 'Error uploading profile picture',
          description: error.serverError || 'Unknown error. Please try again.',
          variant: 'error',
        })
      },
      onSettled: () => {
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      },
    }
  )

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && team?.id) {
      const file = e.target.files[0]

      const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB (or match your config limit)

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'File too large',
          description: `Profile picture must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
          variant: 'error',
        })
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      const formData = new FormData()
      formData.append('teamId', team.id)
      formData.append('image', file)

      uploadProfilePicture({
        teamId: team.id,
        image: file,
      })
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className="relative cursor-pointer"
      onClick={handleAvatarClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Avatar className={cn('h-24 w-24', className)}>
        <AvatarImage
          src={team?.profile_picture_url || ''}
          alt={`${team?.name}'s profile picture`}
        />
        <AvatarFallback className="relative text-2xl font-semibold">
          {team ? (
            team?.name?.charAt(0).toUpperCase()
          ) : (
            <Skeleton className="absolute inset-0" />
          )}
        </AvatarFallback>
      </Avatar>

      <AnimatePresence>
        {isHovered && !isUploading && (
          <motion.div
            className={cn(
              cardVariants({ variant: 'layer' }),
              'absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full'
            )}
            variants={{
              initial: {
                opacity: 0,
                scale: 0,
                filter: 'blur(8px)',
              },
              animate: {
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
              },
            }}
            initial="initial"
            animate="animate"
            exit="initial"
            transition={{ duration: 0.2, ease: exponentialSmoothing(5) }}
          >
            <Pencil className="h-5 w-5 text-white" />
          </motion.div>
        )}

        {isUploading && (
          <motion.div
            className={cn(
              cardVariants({ variant: 'layer' }),
              'absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full'
            )}
            variants={{
              initial: {
                opacity: 0,
                scale: 0,
                filter: 'blur(8px)',
              },
              animate: {
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
              },
            }}
            initial="initial"
            animate="animate"
            exit="initial"
            transition={{ duration: 0.2, ease: exponentialSmoothing(5) }}
          >
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </motion.div>
        )}
      </AnimatePresence>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg, image/png, image/svg+xml"
        onChange={handleUpload}
        disabled={isUploading}
      />
    </div>
  )
}
