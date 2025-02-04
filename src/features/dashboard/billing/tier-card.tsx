"use client";

import { Button } from "@/ui/primitives/button";
import { Tier } from "@/configs/tiers";
import { useSelectedTeam } from "@/lib/hooks/use-teams";
import { useToast } from "@/lib/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { redirectToCheckoutAction } from "@/server/billing/billing-actions";
import { Badge } from "@/ui/primitives/badge";

interface BillingTierCardProps {
  tier: Tier;
  isHighlighted?: boolean;
  className?: string;
}

const BillingTierCard = forwardRef<HTMLDivElement, BillingTierCardProps>(
  ({ tier, isHighlighted = false, className }, ref) => {
    const team = useSelectedTeam();

    const { toast } = useToast();

    const { isPending, mutate: redirectToCheckout } = useMutation({
      mutationFn: async () => {
        if (!team) {
          return;
        }

        const res = await redirectToCheckoutAction({
          teamId: team.id,
          tierId: tier.id,
        });

        if (res?.type === "error") {
          throw new Error(res.message);
        }
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "error",
        });
      },
    });

    const isSelected = team?.tier === tier.id;

    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full flex-col border bg-gradient-to-b from-bg p-5",
          className,
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <h5 className="text-lg font-semibold">{tier.name}</h5>
          {isSelected && <Badge variant="accent"> Current Plan {"<<"} </Badge>}
        </div>
        <ul className="mb-4 space-y-1 pl-4">
          {tier.prose.map((prose, i) => (
            <li
              className="font-sans text-xs text-fg-500"
              key={`tier-${tier.id}-prose-${i}`}
            >
              {prose}
            </li>
          ))}
        </ul>
        {isSelected === false && isHighlighted && (
          <Button
            variant={isHighlighted ? "default" : "outline"}
            className="mt-4 w-full rounded-none"
            size="lg"
            loading={isPending}
            onClick={() => redirectToCheckout()}
          >
            Select
          </Button>
        )}
      </div>
    );
  },
);

BillingTierCard.displayName = "BillingTierCard";

export default BillingTierCard;
