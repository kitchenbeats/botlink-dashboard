import { getSandboxMetricsAction } from "@/actions/sandboxes-actions";
import { QUERY_KEYS } from "@/configs/query-keys";
import { useSelectedTeam } from "@/lib/hooks/use-teams";
import { Sandbox } from "@/types/api";
import useSWR from "swr";
import { useApiUrl } from "@/features/dashboard/developer-settings/stores/developer-settings-store";

export function useSandboxMetrics(
  sandboxes: Sandbox[] | undefined,
  sandboxesValidating: boolean,
  onMetricsSuccess: (data: Map<string, any>) => void,
) {
  const team = useSelectedTeam();
  const apiUrl = useApiUrl();

  return useSWR(
    team && apiUrl ? QUERY_KEYS.TEAM_SANDBOX_METRICS(team.id, apiUrl) : null,
    async () => {
      if (!team || !apiUrl || !sandboxes || sandboxesValidating) return;

      const res = await getSandboxMetricsAction({
        apiUrl,
        teamId: team.id,
        sandboxes: sandboxes ?? [],
      });

      if (res.type === "error") {
        throw new Error(res.message);
      }

      return res.data;
    },
    {
      refreshInterval: 3 * 1000,
      onSuccess: (data) => {
        if (!data) return;
        onMetricsSuccess(data);
      },
      refreshWhenHidden: false,
      revalidateOnFocus: false,
      revalidateOnMount: false,
    },
  );
}
