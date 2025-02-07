'use client'

import { createContext, useContext, ReactNode } from 'react'

interface ServerContextValue {
  selectedTeamId: string | null
  selectedTeamSlug: string | null
}

const ServerContext = createContext<ServerContextValue | undefined>(undefined)

interface ServerContextProviderProps {
  children: ReactNode
  teamId?: string | null
  teamSlug?: string | null
}

export function ServerContextProvider({
  children,
  teamId = null,
  teamSlug = null,
}: ServerContextProviderProps) {
  const value = {
    selectedTeamId: teamId,
    selectedTeamSlug: teamSlug,
  }

  return (
    <ServerContext.Provider value={value}>{children}</ServerContext.Provider>
  )
}

export function useServerContext() {
  const context = useContext(ServerContext)
  if (context === undefined) {
    throw new Error(
      'useServerContext must be used within a ServerContextProvider'
    )
  }
  return context
}
