"use server";

import { ActionResponse } from "@/types/actions";
import { Invoice } from "@/types/billing";
import {
  checkAuthenticated,
  getTeamApiKey,
  guardAction,
} from "@/lib/utils/actions";
import { redirect } from "next/navigation";
import { z } from "zod";

const GetTeamInvoicesParamsSchema = z.object({
  teamId: z.string().uuid(),
});

export const getTeamInvoicesAction = guardAction(
  GetTeamInvoicesParamsSchema,
  async (params) => {
    const { user } = await checkAuthenticated();

    const apiKey = await getTeamApiKey(user.id, params.teamId);

    const res = await fetch(
      `${process.env.BILLING_API_URL}/teams/${params.teamId}/invoices`,
      {
        headers: {
          "X-Team-API-Key": apiKey,
        },
      },
    );

    if (!res.ok) {
      const text = await res.text();

      throw new Error(
        text ??
          `Failed to fetch billing endpoint: /teams/${params.teamId}/invoices`,
      );
    }

    const invoices = (await res.json()) as Invoice[];

    return invoices;
  },
);

const RedirectToCheckoutParamsSchema = z.object({
  teamId: z.string().uuid(),
  tierId: z.string(),
});

export const redirectToCheckoutAction = guardAction(
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
