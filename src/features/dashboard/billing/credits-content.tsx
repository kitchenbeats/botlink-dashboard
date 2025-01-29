import { bailOutFromPPR } from "@/lib/utils/server";
import { getUsage } from "@/server/usage/get-usage";
import { Alert, AlertDescription, AlertTitle } from "@/ui/primitives/alert";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <Alert className="w-full text-left" variant="error">
      <AlertTitle>Error loading credits.</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}

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
        <span className="text-sm font-normal text-accent"> $</span>
      </span>
    );
  } catch (error) {
    return <ErrorFallback error={error as Error} />;
  }
}
