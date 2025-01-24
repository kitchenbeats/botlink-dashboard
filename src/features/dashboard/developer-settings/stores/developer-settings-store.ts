import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createComputed } from "zustand-computed";
import { STORAGE_KEYS } from "@/configs/storage-keys";

interface ComputedDeveloperSettingsState {
  apiUrl: string;
}

interface DeveloperSettingsState {
  apiDomain: string;
  setApiDomain: (domain: string) => void;
}

// TODO: compute the infrastructure url in a more sophisticated way
const computedInfrastructureUrl = createComputed<
  DeveloperSettingsState,
  ComputedDeveloperSettingsState
>((state) => ({
  apiUrl: `https://api.${state.apiDomain}`,
}));

export const useDeveloperSettings = create<DeveloperSettingsState>()(
  computedInfrastructureUrl(
    persist(
      (set) => ({
        apiDomain: process.env.NEXT_PUBLIC_DEFAULT_API_DOMAIN,
        setApiDomain: (domain) => set({ apiDomain: domain }),
      }),
      {
        name: STORAGE_KEYS.DEVELOPER_SETTINGS,
        partialize: (state) => ({
          apiDomain: state.apiDomain,
        }),
      },
    ),
  ),
);

export function useApiUrl() {
  const apiUrl = useDeveloperSettings((state) => state.apiUrl);

  return apiUrl;
}
