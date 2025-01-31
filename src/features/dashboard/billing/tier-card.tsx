"use client";

import { redirectToCheckoutAction } from "@/server/billing/billing-actions";
import { Button } from "@/ui/primitives/button";
import { GradientBorder } from "@/ui/gradient-border";
import { Tier } from "@/configs/tiers";
import { useSelectedTeam } from "@/lib/hooks/use-teams";
import { useToast } from "@/lib/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

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
          "bg-bg-100 flex h-full w-1/2 flex-col border p-5",
          className,
        )}
      >
        <div className="mb-3">
          <h5 className="text-lg font-semibold">
            {tier.name}
            {isSelected === true && (
              <span className="text-accent align-top text-sm font-medium">
                {" *current"}
              </span>
            )}
          </h5>
        </div>
        <ul className="mb-4 space-y-1 pl-4">
          {tier.prose.map((prose, i) => (
            <li
              className="text-fg-500 font-sans text-xs"
              key={`tier-${tier.id}-prose-${i}`}
            >
              {prose}
            </li>
          ))}
        </ul>
        {isSelected === false && (
          <Button
            variant={isHighlighted ? "default" : "muted"}
            className="mt-4 w-full rounded-none"
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
