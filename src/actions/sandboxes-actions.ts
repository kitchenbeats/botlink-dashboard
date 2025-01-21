"use server";

import { Sandbox } from "@/types/api";
import { checkAuthenticated, getTeamApiKey, guardAction } from "./utils";
import { z } from "zod";
import { MOCK_SANDBOXES_DATA } from "@/configs/mock-data";

const GetTeamSandboxesParamsSchema = z.object({
  apiUrl: z.string().url(),
  teamId: z.string().uuid(),
});

export const getTeamSandboxesAction = guardAction(
  GetTeamSandboxesParamsSchema,
  async ({ apiUrl, teamId }) => {
    // TODO: Remove this after staging
    if (process.env.NODE_ENV === "development") {
      await new Promise((resolve) => setTimeout(resolve, 200));

      return MOCK_SANDBOXES_DATA();
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
    return data;
  },
);
