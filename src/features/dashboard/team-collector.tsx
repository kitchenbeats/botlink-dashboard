"use client";

import { useTeams } from "@/lib/hooks/use-teams";
import { useMetadataStore } from "@/lib/stores/metadata-store";
import { useParams } from "next/navigation";
import { useEffect } from "react";

interface TeamCollectorProps {
  /** The team ID from the cookie, if one exists */
  initialTeamId?: string;
}

/**
 * Provider component that manages the selected team state across the application.
 *
 * This component synchronizes the team selection between the URL parameters and global state.
 * When a team ID is present in the URL, it updates the global metadata store with that ID.
 * If no team ID is in the URL, it falls back to the initial team ID from cookies.
 *
 * The component renders nothing visually - it only handles state management.
 *
 * @param props - Component props
 * @param props.initialTeamId - The team ID loaded from cookies on initial page load
 * @returns null - This component has no visual output
 */
export default function TeamCollector({ initialTeamId }: TeamCollectorProps) {
  const { teamId } = useParams();
  const selectedTeamId = useMetadataStore((state) => state.selectedTeamId);
  const { teams } = useTeams();

  useEffect(() => {
    if (teamId) {
      useMetadataStore.setState({
        selectedTeamId: (teamId as string) ?? initialTeamId,
      });
    }
  }, [teamId, initialTeamId]);

  useEffect(() => {
    if (teams && teams.length > 0 && !selectedTeamId) {
      useMetadataStore.setState({
        selectedTeamId:
          teams.find((team) => team.is_default)?.id || teams[0]?.id,
      });
    }
  }, [teams, selectedTeamId]);

  return null;
}
