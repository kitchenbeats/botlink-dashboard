'use client'

import { useServerContext } from './use-server-context'

export const useUser = () => {
  const { user } = useServerContext()

  return { user }
}
