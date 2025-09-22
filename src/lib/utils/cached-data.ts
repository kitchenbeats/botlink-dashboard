import 'server-only'

import { unstable_cacheLife, unstable_cacheTag } from 'next/cache'

export async function getCachedTeamData<T>(
  teamId: string,
  dataType: string,
  fetcher: () => Promise<T>
): Promise<T> {
  'use cache'
  unstable_cacheLife({
    stale: 300, // 5 minutes
    revalidate: 1800, // 30 minutes
    expire: 3600, // 1 hour
  })
  unstable_cacheTag(`${dataType}-${teamId}`)

  return await fetcher()
}

export async function getCachedSandboxData<T>(
  teamId: string,
  fetcher: () => Promise<T>
): Promise<T> {
  'use cache'
  unstable_cacheLife({
    stale: 30, // 30 seconds
    revalidate: 60, // 1 minute
    expire: 300, // 5 minutes
  })
  unstable_cacheTag(`sandboxes-${teamId}`)

  return await fetcher()
}

export async function getCachedTemplateData<T>(
  teamId: string | null,
  isDefault: boolean,
  fetcher: () => Promise<T>
): Promise<T> {
  'use cache'
  unstable_cacheLife({
    stale: 3600, // 1 hour
    revalidate: 86400, // 1 day
    expire: 604800, // 1 week
  })

  if (isDefault) {
    unstable_cacheTag('default-templates')
  } else if (teamId) {
    unstable_cacheTag(`templates-${teamId}`)
  }

  return await fetcher()
}

export async function getCachedUserData<T>(
  userId: string,
  fetcher: () => Promise<T>
): Promise<T> {
  'use cache'
  unstable_cacheLife({
    stale: 300, // 5 minutes
    revalidate: 900, // 15 minutes
    expire: 1800, // 30 minutes
  })
  unstable_cacheTag(`user-${userId}`)

  return await fetcher()
}