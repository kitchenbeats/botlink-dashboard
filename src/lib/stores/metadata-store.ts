import { create } from "zustand";

interface MetadataState {
  selectedTeamId: string | null;
  setSelectedTeamId: (teamId: string | null) => void;
  clearSelectedTeamId: () => Promise<void>;
}

export const useMetadataStore = create<MetadataState>()((set) => ({
  selectedTeamId: null,
  setSelectedTeamId: async (teamId) => {
    // no await to have optimistic updates
    fetch("/api/teams/select", {
      method: "POST",
      body: JSON.stringify({ domain: teamId }),
    });

    set({ selectedTeamId: teamId });
  },
  clearSelectedTeamId: async () => {
    await fetch("/api/teams/select", {
      method: "DELETE",
    });

    set({ selectedTeamId: null });
  },
}));
