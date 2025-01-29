"use client";

import { PROTECTED_URLS } from "@/configs/urls";
import { useTeams } from "@/lib/hooks/use-teams";
import { useMetadataStore } from "@/lib/stores/metadata-store";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

interface TeamProviderProps {
  /** The team ID from the cookie, if one exists */
  initialTeamId?: string;
}

/**
 * Provider component that manages the selected team state across the application.
 *
 * It handles two scenarios:
 * 1. On initial load, it sets the selected team from the cookie value (initialTeamId)
 * 2. When navigating between teams, it updates the selected team based on the URL param
 *    and syncs this with both the global state and the cookie
 *
 * @param initialTeamId - The team ID from the cookie, used for initial state setup
 */
export default function TeamProvider({ initialTeamId }: TeamProviderProps) {
  const setSelectedTeamId = useMetadataStore(
    (state) => state.setSelectedTeamId,
  );

  const { teamId } = useParams();
  const { teams } = useTeams();

  useEffect(() => {
    if (initialTeamId) {
      useMetadataStore.setState({ selectedTeamId: initialTeamId });
    }
  }, [initialTeamId]);

  useEffect(() => {
    if (!teamId || !teams || !teams.length) {
      return;
    }

    if (teams.findIndex((team) => team.id === teamId) !== -1) {
      setSelectedTeamId(teamId as string);
    }
  }, [teamId, teams, setSelectedTeamId]);

  return <></>;
}
