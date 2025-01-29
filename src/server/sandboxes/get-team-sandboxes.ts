import "server-only";

import { Sandbox } from "@/types/api";
import {
  checkAuthenticated,
  getApiUrl,
  getTeamApiKey,
  guard,
} from "@/lib/utils/server";
import { z } from "zod";
import { MOCK_METRICS_DATA, MOCK_SANDBOXES_DATA } from "@/configs/mock-data";

const GetTeamSandboxesParamsSchema = z.object({
  teamId: z.string().uuid(),
});

export const getTeamSandboxes = guard(
  GetTeamSandboxesParamsSchema,
  async ({ teamId }) => {
    // TODO: Remove this after staging
    if (
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "production"
    ) {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const sandboxes = MOCK_SANDBOXES_DATA();
      const metrics = MOCK_METRICS_DATA(sandboxes);

      return sandboxes.map((sandbox) => ({
        ...sandbox,
        lastMetrics: metrics.get(sandbox.sandboxID)!,
      }));
    }

    const { user } = await checkAuthenticated();
    const apiKey = await getTeamApiKey(user.id, teamId);
    const { url } = await getApiUrl();

    const res = await fetch(`${url}/sandboxes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text ?? `Failed to fetch api endpoint: /sandboxes`);
    }

    const data = (await res.json()) as Sandbox[];
    const metrics = MOCK_METRICS_DATA(data);

    return data.map((sandbox) => ({
      ...sandbox,
      lastMetrics: metrics.get(sandbox.sandboxID)!,
    }));
  },
);
