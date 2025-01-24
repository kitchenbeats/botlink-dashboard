import { getUserTeamsAction } from "@/actions/team-actions";
import { useMetadata } from "@/features/dashboard/metadata-provider";
import { QUERY_KEYS } from "@/configs/query-keys";
import { useMemo } from "react";
import useSWR from "swr";

export const useTeams = () => {
  const { data, error, isLoading, mutate } = useSWR(
    QUERY_KEYS.TEAMS(),
    async () => {
      const response = await getUserTeamsAction();

      if (response.type === "error") {
        throw new Error(response.message);
      }

      return response.data;
    },
    {
      dedupingInterval: 60000,
    },
  );

  return {
    data: data ?? [],
    error,
    isLoading,
    mutate,
    teams: data ?? [],
    refetch: () => {
      return mutate();
    },
  };
};

export const useSelectedTeam = () => {
  const { teams } = useTeams();
  const { selectedTeamId } = useMetadata();

  const team = useMemo(
    () => teams?.find((team) => team.id === selectedTeamId),
    [teams, selectedTeamId],
  );

  return team;
};
