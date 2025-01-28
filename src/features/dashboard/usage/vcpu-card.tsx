import { unstable_noStore } from "next/cache";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/ui/primitives/card";
import { Alert, AlertDescription, AlertTitle } from "@/ui/primitives/alert";
import { getUsage } from "@/server/usage/get-usage";
import { VCPUChart } from "./vcpu-chart";
import { Loader } from "@/ui/loader";
import { Suspense } from "react";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <Alert className="w-full text-left" variant="error">
      <AlertTitle>Error loading vCPU data.</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}

export function VCPUCard({ teamId }: { teamId: string }) {
  return (
    <Card className="col-span-6">
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
  unstable_noStore();

  try {
    const res = await getUsage({ teamId });

    if (res.type === "error") {
      throw new Error(res.message);
    }

    const latestVCPU = res.data.vcpuSeries[0].data.at(-1)?.y;

    return (
      <>
        <div className="flex items-baseline gap-2">
          <p className="font-mono text-2xl">
            {latestVCPU?.toFixed(2) ?? "0.00"}
          </p>
          <span className="text-xs text-fg-500">hours used</span>
        </div>
        <VCPUChart data={res.data.vcpuSeries[0].data} />
      </>
    );
  } catch (error) {
    return <ErrorFallback error={error as Error} />;
  }
}
