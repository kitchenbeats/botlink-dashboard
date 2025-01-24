"use client";

import { STORAGE_KEYS } from "@/configs/storage-keys";
import { useTeams } from "@/lib/hooks/use-teams";
import { useParams } from "next/navigation";
import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useLayoutEffect,
} from "react";
import { useLocalStorage } from "usehooks-ts";

/**
 * Type definition for the metadata context which handles team selection
 */
type MetadataContextType = {
  selectedTeamId: string | undefined;
  setSelectedTeamId: (teamId?: string) => void;
};

/**
 * Context to manage metadata state across the application
 */
const MetadataContext = createContext<MetadataContextType | undefined>(
  undefined,
);

/**
 * Hook to access metadata context values
 * @throws Error if used outside of MetadataProvider
 */
export function useMetadata() {
  const context = useContext(MetadataContext);
  if (!context) {
    throw new Error("useMetadata must be used within a MetadataProvider");
  }
  return context;
}

/**
 * Props for the MetadataProvider component
 */
type MetadataProviderProps = {
  children: ReactNode;
};

/**
 * Provider component that manages team selection state
 * @param children - Child components to be wrapped
 */
export function MetadataProvider({ children }: MetadataProviderProps) {
  // Get teams data from hook
  const { teams } = useTeams();

  // Persist selected team ID in local storage
  const [selectedTeamId, setSelectedTeamId] = useLocalStorage(
    STORAGE_KEYS.SELECTED_TEAM_ID,
    teams.find((team) => team.is_default)?.id,
  );

  const params = useParams();

  /**
   * Helper function to validate and set the selected team ID
   * @param teamId - Team ID to select
   */
  const selectTeamId = async (teamId?: string) => {
    // Only allow selection of existing teams
    if (teamId && !teams.find((team) => team.id === teamId)) {
      return;
    }

    setSelectedTeamId(teamId);
  };

  // Update selected team when URL params change
  useLayoutEffect(() => {
    if (!params.teamId || !teams.find((team) => team.id === params.teamId))
      return;

    selectTeamId(params.teamId as string);
  }, [params, teams]);

  return (
    <MetadataContext.Provider
      value={{ selectedTeamId, setSelectedTeamId: selectTeamId }}
    >
      {children}
    </MetadataContext.Provider>
  );
}
