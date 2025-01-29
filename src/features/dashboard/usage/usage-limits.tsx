import { bailOutFromPPR } from "@/lib/utils/server";
import { getBillingLimits } from "@/server/billing/get-billing-limits";
import { Alert, AlertDescription, AlertTitle } from "@/ui/primitives/alert";
import LimitCard from "./limit-card";
import AlertCard from "./alert-card";
import { cn } from "@/lib/utils";

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
      <div className={cn("flex", className)}>
        <LimitCard
          className="flex-1 border-r"
          value={res.data.limit_amount_gte}
        />
        <AlertCard className="flex-1" value={res.data.alert_amount_gte} />
      </div>
    );
  } catch (error) {
    return (
      <Alert variant="error">
        <AlertTitle>Unable to fetch usage limits</AlertTitle>
        <AlertDescription>
          {error instanceof Error
            ? error.message
            : "An unexpected error occurred"}
        </AlertDescription>
      </Alert>
    );
  }
}
