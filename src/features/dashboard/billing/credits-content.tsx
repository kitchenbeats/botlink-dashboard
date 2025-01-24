"use client";

import { getUsageAction } from "@/actions/usage-actions";
import { Loader } from "@/ui/loader";
import { QUERY_KEYS } from "@/configs/query-keys";
import useSWR from "swr";
import { useParams } from "next/navigation";

export default function BillingCreditsContent() {
  const { teamId } = useParams();

  const { data: usageData, isLoading } = useSWR(
    teamId ? QUERY_KEYS.TEAM_USAGE(teamId as string) : null,
    async () => {
      const res = await getUsageAction({ teamId: teamId as string });

      if (res.type === "error") {
        throw new Error(res.message);
      }

      return res.data;
    },
  );

  if (isLoading) return <Loader className="text-2xl" variant="square" />;

  return (
    <span className="ml-2 text-2xl font-bold">
      {usageData?.credits}
      <span className="text-sm font-normal text-accent"> $</span>
    </span>
  );
}
