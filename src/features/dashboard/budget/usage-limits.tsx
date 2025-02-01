import { bailOutFromPPR } from "@/lib/utils/server";
import { getBillingLimits } from "@/server/billing/get-billing-limits";
import { Alert, AlertDescription, AlertTitle } from "@/ui/primitives/alert";
import LimitCard from "./limit-card";
import AlertCard from "./alert-card";
import { cn } from "@/lib/utils";
import Dotted from "@/ui/dotted";
import { UnknownError } from "@/types/errors";
import ErrorBoundary from "@/ui/error";
import { ErrorIndicator } from "@/ui/error-indicator";

interface UsageLimitsProps {
  className?: string;
  teamId: string;
}

export default async function UsageLimits({
  className,
  teamId,
}: UsageLimitsProps) {
  bailOutFromPPR();

  try {
    const res = await getBillingLimits({ teamId });

    if (res.type === "error") {
      throw new Error(res.message);
    }

    return (
      <div className={cn("relative flex flex-col pt-2", className)}>
        <Dotted className="-z-10" />
        <div className="bg-bg flex flex-col lg:flex-row">
          <LimitCard value={res.data.limit_amount_gte} className="flex-1" />
          <AlertCard value={res.data.alert_amount_gte} className="flex-1" />
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4">
        <ErrorIndicator
          description={"Could not load usage limits"}
          message={error instanceof Error ? error.message : "Unknown error"}
          className="bg-bg w-full max-w-full"
        />
      </div>
    );
  }
}
