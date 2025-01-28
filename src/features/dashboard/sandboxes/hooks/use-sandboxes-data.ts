import { getTeamSandboxesAction } from "@/server/sandboxes-actions";
import { QUERY_KEYS } from "@/configs/query-keys";
import { useSelectedTeam } from "@/lib/hooks/use-teams";
import useSWR from "swr";
import { useApiUrl } from "@/features/dashboard/developer-settings/stores/developer-settings-store";
import { useSandboxTableStore } from "../stores/table-store";

export function useSandboxData() {
  const team = useSelectedTeam();
  const apiUrl = useApiUrl();
  const pollingInterval = useSandboxTableStore(
    (state) => state.pollingInterval,
  );

  const {
    data: sandboxes,
    isLoading: sandboxesLoading,
    isValidating: sandboxesValidating,
    error: sandboxesError,
    mutate: refetchSandboxes,
  } = useSWR(
    team && apiUrl ? QUERY_KEYS.TEAM_SANDBOXES(team.id, apiUrl) : null,
    async () => {
      if (!team || !apiUrl) return;

      const res = await getTeamSandboxesAction({
        apiUrl,
        teamId: team.id,
      });

      if (res.type === "error") {
        throw new Error(res.message);
      }

      return res.data;
    },
    {
      refreshInterval: pollingInterval * 1000,
      refreshWhenHidden: false,
      revalidateOnFocus: false,
    },
  );

  return {
    sandboxes,
    sandboxesLoading,
    sandboxesValidating,
    sandboxesError,
    refetchSandboxes,
  };
}
