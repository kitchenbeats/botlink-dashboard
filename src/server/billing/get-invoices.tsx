import "server-only";

import { Invoice } from "@/types/billing";
import { checkAuthenticated, getTeamApiKey, guard } from "@/lib/utils/server";
import { z } from "zod";

const GetInvoicesParamsSchema = z.object({
  teamId: z.string().uuid(),
});

export const getInvoices = guard(GetInvoicesParamsSchema, async (params) => {
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
});
