import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface MetadataState {
  selectedTeamId: string | null;
  setSelectedTeamId: (teamId: string | null) => void;
}

export const useMetadataStore = create<MetadataState>()(
  persist(
    (set) => ({
      selectedTeamId: null,
      setSelectedTeamId: (teamId) => set({ selectedTeamId: teamId }),
    }),
    {
      name: "metadata-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedTeamId: state.selectedTeamId }),
    },
  ),
);
