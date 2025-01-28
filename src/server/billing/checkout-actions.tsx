"use server";

import { checkAuthenticated, guard } from "@/lib/utils/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const RedirectToCheckoutParamsSchema = z.object({
  teamId: z.string().uuid(),
  tierId: z.string(),
});

export const redirectToCheckoutAction = guard(
  RedirectToCheckoutParamsSchema,
  async (params) => {
    await checkAuthenticated();

    const res = await fetch(`${process.env.BILLING_API_URL}/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teamID: params.teamId,
        tierID: params.tierId,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text ?? "Failed to redirect to checkout");
    }

    const data = (await res.json()) as { url: string; error?: string };

    if (data.error) {
      throw new Error(data.error);
    }

    throw redirect(data.url);
  },
);
