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

interface ProfilePictureCardProps {
  className?: string
}

export function ProfilePictureCard({ className }: ProfilePictureCardProps) {
  const team = useSelectedTeam()
  const { refetch } = useTeams()
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isHovered, setIsHovered] = useState(false)

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

      startTransition(async () => {
        try {
          const res = await uploadTeamProfilePictureAction(formData)

          if (res.type === 'error') {
            throw new Error(res.message)
          }

          await refetch()

          toast({
            title: 'Profile picture updated',
            description:
              'Your team profile picture has been updated successfully.',
            variant: 'default',
          })
        } catch (error) {
          console.error('Error uploading profile picture:', error)

          let errorMessage = 'Please try again.'

          if (error instanceof Error) {
            if (
              error.message.includes('Body exceeded') ||
              error.message.includes('413')
            ) {
              errorMessage =
                'The image file is too large. Please select a smaller image (under 5MB).'
            } else {
              errorMessage = error.message
            }
          }

          toast({
            title: 'Upload failed',
            description: errorMessage,
            variant: 'error',
          })
        } finally {
          // Reset the file input
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
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
        {isHovered && !isPending && (
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

        {isPending && (
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
        disabled={isPending}
      />
    </div>
  )
}
