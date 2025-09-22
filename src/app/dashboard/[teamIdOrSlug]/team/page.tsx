import { InfoCard } from '@/features/dashboard/team/info-card'
import { MemberCard } from '@/features/dashboard/team/member-card'
import { NameCard } from '@/features/dashboard/team/name-card'
import { ProfilePictureCard } from '@/features/dashboard/team/profile-picture-card'
import Frame from '@/ui/frame'
import Scanline from '@/ui/scanline'
import { Suspense } from 'react'

interface GeneralPageProps {
  params: Promise<{
    teamIdOrSlug: string
  }>
}

export default async function GeneralPage({ params }: GeneralPageProps) {
  return (
    <Frame
      classNames={{
        wrapper: 'w-full max-md:p-0',
        frame: 'max-md:border-none',
      }}
    >
      <div className="grid w-full grid-cols-12">
        <>
          <div className="col-span-12 flex gap-2 border-b h-full min-h-0">
            <ProfilePictureCard className="size-32" />
            <Suspense>
              <NameCard />
            </Suspense>
          </div>
          <InfoCard className="col-span-12 flex flex-col justify-between xl:col-span-6" />
        </>

        <section className="col-span-full border-t">
          <div className="relative h-2 border-b">
            <Scanline />
          </div>
          <Suspense fallback={<MemberCardSkeleton />}>
            <MemberCard params={params} />
          </Suspense>
        </section>
      </div>
    </Frame >
  )
}

function TeamProfileSkeleton() {
  return (
    <>
      <div className="col-span-12 flex gap-2 max-xl:border-b md:gap-3 xl:col-span-6 xl:border-r">
        <div className="size-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
        </div>
      </div>
      <div className="col-span-12 xl:col-span-6 p-4">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    </>
  )
}

function MemberCardSkeleton() {
  return (
    <div className="p-6">
      <div className="h-6 bg-gray-200 rounded mb-4 w-32 animate-pulse"></div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
}
