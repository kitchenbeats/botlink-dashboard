"use server";

import { Sandbox, SandboxMetrics } from "@/types/api";
import { checkAuthenticated, getTeamApiKey, guardAction } from "./utils";
import { z } from "zod";
import { MOCK_METRICS_DATA, MOCK_SANDBOXES_DATA } from "@/configs/mock-data";
import { subHours } from "date-fns";

const GetTeamSandboxesParamsSchema = z.object({
  apiUrl: z.string().url(),
  teamId: z.string().uuid(),
});

type EnhancedSandbox = Sandbox & {
  lastCpuPercentage: number;
  lastRamUsage: number;
};

function enrichSandboxesWithMetrics(
  sandboxes: Sandbox[],
  metrics: Record<string, SandboxMetrics[]>,
): EnhancedSandbox[] {
  return sandboxes.map((sandbox) => {
    const sandboxMetrics = metrics[sandbox.sandboxID] || [];
    const latestMetrics = sandboxMetrics[sandboxMetrics.length - 1] || {
      cpuPct: 0,
      memMiBUsed: 0,
    };

    return {
      ...sandbox,
      lastCpuPercentage: latestMetrics.cpuPct,
      lastRamUsage: latestMetrics.memMiBUsed,
    };
  });
}

export const getTeamSandboxesAction = guardAction(
  GetTeamSandboxesParamsSchema,
  async ({ apiUrl, teamId }) => {
    // TODO: Remove this after staging
    if (
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "production"
    ) {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const sandboxes = MOCK_SANDBOXES_DATA();
      const metrics = MOCK_METRICS_DATA(sandboxes);

      return {
        sandboxes: enrichSandboxesWithMetrics(sandboxes, metrics),
        metrics,
      };
    }

    const { user } = await checkAuthenticated();
    const apiKey = await getTeamApiKey(user.id, teamId);

    const res = await fetch(`${apiUrl}/sandboxes`, {
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

    return {
      sandboxes: enrichSandboxesWithMetrics(data, metrics),
      metrics,
    };
  },
);
