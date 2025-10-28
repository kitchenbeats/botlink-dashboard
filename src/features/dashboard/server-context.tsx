'use client'

import { Team } from '@/lib/db/teams'
import { User } from '@supabase/supabase-js'
import { createContext, ReactNode, useContext } from 'react'

interface ServerContextValue {
  currentTeam: Team | null
  teams: Team[]
  user: User | null
  isAdmin: boolean
}

const ServerContext = createContext<ServerContextValue | undefined>(undefined)

interface ServerContextProviderProps {
  children: ReactNode
  currentTeam: Team | null
  teams: Team[]
  user: User | null
  isAdmin: boolean
}

export function ServerContextProvider({
  children,
  currentTeam,
  teams,
  user,
  isAdmin,
}: ServerContextProviderProps) {
  const value = {
    currentTeam,
    teams,
    user,
    isAdmin,
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
