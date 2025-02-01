import { bailOutFromPPR } from "@/lib/utils/server";
import { getUsage } from "@/server/usage/get-usage";
import { ErrorIndicator } from "@/ui/error-indicator";

export default async function BillingCreditsContent({
  teamId,
}: {
  teamId: string;
}) {
  bailOutFromPPR();

  try {
    const res = await getUsage({ teamId });

    if (res.type === "error") {
      throw new Error(res.message);
    }

    const usage = res.data;

    return (
      <span className="ml-2 text-2xl font-bold">
        {usage.credits}
        <span className="text-accent text-sm font-normal"> $</span>
      </span>
    );
  } catch (error) {
    return (
      <div className="p-4 pb-0">
        <ErrorIndicator
          description={"Could not load credits"}
          message={error instanceof Error ? error.message : "Unknown error"}
          className="bg-bg w-full max-w-full"
        />
      </div>
    );
  }
}
