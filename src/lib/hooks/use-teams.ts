import { QUERY_KEYS } from "@/configs/query-keys";
import { useMemo } from "react";
import useSWR, { preload } from "swr";
import { TeamWithDefault } from "@/types/dashboard";
import { useMetadataStore } from "../stores/metadata-store";

// Fetcher function extracted so we can use it for preloading
const teamsFetcher = async () => {
  const response = await fetch("/api/teams/user");

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error);
  }

  return json as TeamWithDefault[];
};

// Preload teams data - call this as early as possible (e.g., in your root layout)
export const preloadTeams = () => {
  preload(QUERY_KEYS.TEAMS(), teamsFetcher);
};

export const useTeams = () => {
  const { data, error, isLoading, mutate } = useSWR(
    QUERY_KEYS.TEAMS(),
    teamsFetcher,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
      revalidateIfStale: true,
      errorRetryCount: 3,
      ttl: 24 * 60 * 60 * 1000,
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
  const { selectedTeamId } = useMetadataStore();

  const team = useMemo(
    () => teams?.find((team) => team.id === selectedTeamId),
    [teams, selectedTeamId],
  );

  return team;
};
