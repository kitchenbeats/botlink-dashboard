import { create } from "zustand";

interface MetadataState {
  selectedTeamId: string | null;
}

export const useMetadataStore = create<MetadataState>()((set) => ({
  selectedTeamId: null,
}));
