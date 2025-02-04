import { getUsage } from "@/server/usage/get-usage";
import { ErrorIndicator } from "@/ui/error-indicator";

export default async function BillingCreditsContent({
  teamId,
}: {
  teamId: string;
}) {
  const res = await getUsage({ teamId });

  if (res.type === "error") {
    return (
      <div className="p-4 pb-0">
        <ErrorIndicator
          description={"Could not load credits"}
          message={res.message}
          className="w-full max-w-full bg-bg"
        />
      </div>
    );
  }

  const usage = res.data;

  return (
    <span className="ml-2 text-2xl font-bold">
      {usage.credits}
      <span className="text-sm font-normal text-accent"> $</span>
    </span>
  );
}
