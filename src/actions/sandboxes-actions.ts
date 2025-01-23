"use server";

import { Sandbox, SandboxMetrics } from "@/types/api";
import { checkAuthenticated, getTeamApiKey, guardAction } from "./utils";
import { z } from "zod";
import { MOCK_METRICS_DATA, MOCK_SANDBOXES_DATA } from "@/configs/mock-data";

const GetTeamSandboxesParamsSchema = z.object({
  apiUrl: z.string().url(),
  teamId: z.string().uuid(),
});

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

      return sandboxes.map((sandbox) => ({
        ...sandbox,
        lastMetrics: metrics.get(sandbox.sandboxID),
      }));
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

    return data.map((sandbox) => ({
      ...sandbox,
      lastMetrics: metrics.get(sandbox.sandboxID),
    }));
  },
);

// TODO: Refactor after API is ready
const GetSandboxMetricsParamsSchema = z.object({
  apiUrl: z.string().url(),
  teamId: z.string().uuid(),
  sandboxes: z.array(z.any()),
});

export const getSandboxMetricsAction = guardAction(
  GetSandboxMetricsParamsSchema,
  async ({ apiUrl, teamId, sandboxes }) => {
    if (
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "production"
    ) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return MOCK_METRICS_DATA(sandboxes);
    }

    // TODO: Implement real metrics fetching when API is ready
    return MOCK_METRICS_DATA(sandboxes);
  },
);
