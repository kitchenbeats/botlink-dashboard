import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/ui/primitives/card";
import { getUsage } from "@/server/usage/get-usage";
import { VCPUChart } from "./vcpu-chart";
import { Loader } from "@/ui/loader";
import { Suspense } from "react";
import { bailOutFromPPR } from "@/lib/utils/server";
import { ErrorIndicator } from "@/ui/error-indicator";

export function VCPUCard({
  teamId,
  className,
}: {
  teamId: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="font-mono">vCPU Hours</CardTitle>
        <CardDescription>
          Virtual CPU time consumed by your sandboxes
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Suspense fallback={<Loader variant="line" />}>
          <VCPUCardContent teamId={teamId} />
        </Suspense>
      </CardContent>
    </Card>
  );
}

export async function VCPUCardContent({ teamId }: { teamId: string }) {
  const res = await getUsage({ teamId });

  if (res.type === "error") {
    return (
      <div className="p-4">
        <ErrorIndicator
          description={"Could not load vCPU usage"}
          message={res.message}
          className="w-full max-w-full bg-bg"
        />
      </div>
    );
  }

  const latestVCPU = res.data.vcpuSeries[0].data.at(-1)?.y;

  return (
    <>
      <div className="flex items-baseline gap-2">
        <p className="font-mono text-2xl">{latestVCPU?.toFixed(2) ?? "0.00"}</p>
        <span className="text-xs text-fg-500">hours used</span>
      </div>
      <VCPUChart data={res.data.vcpuSeries[0].data} />
    </>
  );
}
