"use client";

import { useTeams } from "@/lib/hooks/use-teams";
import { useMetadataStore } from "@/lib/stores/metadata-store";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function TeamProvider() {
  const setSelectedTeamId = useMetadataStore(
    (state) => state.setSelectedTeamId,
  );
  const { teamId } = useParams();
  const { teams } = useTeams();

  useEffect(() => {
    if (teamId && teams.findIndex((team) => team.id === teamId) !== -1) {
      setSelectedTeamId(teamId as string);
    }
  }, [teamId, teams, setSelectedTeamId]);

  return <></>;
}
