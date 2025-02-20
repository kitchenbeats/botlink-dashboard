import { create } from 'zustand'

interface MetadataState {
  selectedTeamId: string | null
  setSelectedTeamId: (teamId: string) => void
}

export const useMetadataStore = create<MetadataState>()((set) => ({
  selectedTeamId: null,
  setSelectedTeamId: async (teamId: string) => {
    fetch(`/api/teams/select`, {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    })

    set({ selectedTeamId: teamId })
  },
}))
