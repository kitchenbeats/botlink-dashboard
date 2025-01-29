import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/ui/primitives/card";
import { Alert, AlertDescription, AlertTitle } from "@/ui/primitives/alert";
import { getUsage } from "@/server/usage/get-usage";
import { CostChart } from "./cost-chart";
import { Loader } from "@/ui/loader";
import { Suspense } from "react";
import { bailOutFromPPR } from "@/lib/utils/server";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <Alert className="w-full text-left" variant="error">
      <AlertTitle>Error loading cost data.</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}

export function CostCard({
  teamId,
  className,
}: {
  teamId: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="font-mono">Cost Usage</CardTitle>
        <CardDescription>
          Total cost of all resources for the current billing period
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Suspense fallback={<Loader variant="line" />}>
          <CostCardContent teamId={teamId} />
        </Suspense>
      </CardContent>
    </Card>
  );
}

export async function CostCardContent({ teamId }: { teamId: string }) {
  bailOutFromPPR();

  try {
    const res = await getUsage({ teamId });

    if (res.type === "error") {
      throw new Error(res.message);
    }

    const latestCost = res.data.costSeries[0].data.at(-1)?.y;

    return (
      <>
        <div className="flex items-baseline gap-2">
          <p className="font-mono text-2xl">
            ${latestCost?.toFixed(2) ?? "0.00"}
          </p>
          <span className="text-xs text-fg-500">this period</span>
        </div>
        <CostChart data={res.data.costSeries[0].data} />
      </>
    );
  } catch (error) {
    return <ErrorFallback error={error as Error} />;
  }
}
