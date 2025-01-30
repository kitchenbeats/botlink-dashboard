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
      <GradientBorder
        ref={ref}
        gradientVia="via-transparent"
        {...(isHighlighted
          ? {
              gradientFrom: "from-accent",
              gradientTo: "to-transparent",
            }
          : {})}
        wrapperClassName="h-min"
        className={cn("p-6", className)}
      >
        <div className="mb-3 flex justify-between gap-2">
          <h5 className="text-lg font-semibold">
            {tier.name}
            {isSelected === true && (
              <span className="align-top text-sm font-medium text-accent">
                {" *current"}
              </span>
            )}
          </h5>
          {isSelected === false && (
            <Button
              variant={isHighlighted ? "accent" : "muted"}
              className="h-7 text-xs"
              size="sm"
              loading={isPending}
              onClick={() => redirectToCheckout()}
            >
              Select
            </Button>
          )}
        </div>
        <ul className="space-y-1 pl-4">
          {tier.prose.map((prose, i) => (
            <li className="font-sans" key={`tier-${tier.id}-prose-${i}`}>
              {prose}
            </li>
          ))}
        </ul>
      </GradientBorder>
    );
  },
);

BillingTierCard.displayName = "BillingTierCard";

export default BillingTierCard;
