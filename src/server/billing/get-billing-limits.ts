import "server-only";

import {
  checkAuthenticated,
  getUserAccessToken,
  guard,
} from "@/lib/utils/server";
import { z } from "zod";
import { BillingLimit } from "@/types/billing";
import { USER_ACCESS_TOKEN_HEADER } from "@/configs/constants";

const GetBillingLimitsParamsSchema = z.object({
  teamId: z.string().uuid(),
});

export const getBillingLimits = guard(
  GetBillingLimitsParamsSchema,
  async (params) => {
    const { user } = await checkAuthenticated();

    const accessToken = await getUserAccessToken(user.id);

    const res = await fetch(
      `${process.env.BILLING_API_URL}/teams/${params.teamId}/billing-limits`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          [USER_ACCESS_TOKEN_HEADER]: accessToken,
        },
      },
    );

    if (!res.ok) {
      const text = await res.text();

      throw new Error(
        text ??
          `Failed to fetch billing endpoint: /teams/${params.teamId}/billing-limits`,
      );
    }

    const limit = (await res.json()) as BillingLimit;

    return limit;
  },
);
