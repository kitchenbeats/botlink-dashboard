"use server";

import { Template } from "@/types/api";
import { z } from "zod";
import {
  checkAuthenticated,
  getUserAccessToken,
  guard,
} from "@/lib/utils/server";
import { MOCK_TEMPLATES_DATA } from "@/configs/mock-data";
import { E2BError } from "@/types/errors";

const GetTeamTemplatesParamsSchema = z.object({
  apiUrl: z.string().url(),
  teamId: z.string().uuid(),
});

export const getTeamTemplatesAction = guard(
  GetTeamTemplatesParamsSchema,
  async ({ apiUrl, teamId }) => {
    // TODO: Remove this after staging
    if (
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "production"
    ) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_TEMPLATES_DATA;
    }

    const { user } = await checkAuthenticated();
    const accessToken = await getUserAccessToken(user.id);

    const res = await fetch(`${apiUrl}/templates?teamID=${teamId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        text ?? `Failed to fetch api endpoint: /templates?teamID=${teamId}`,
      );
    }

    const data = (await res.json()) as Template[];

    return data;
  },
);

const DeleteTemplateParamsSchema = z.object({
  apiUrl: z.string().url(),
  templateId: z.string(),
});

export const deleteTemplateAction = guard(
  DeleteTemplateParamsSchema,
  async ({ apiUrl, templateId }) => {
    const { user } = await checkAuthenticated();
    const accessToken = await getUserAccessToken(user.id);

    const res = await fetch(`${apiUrl}/templates/${templateId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new E2BError("INVALID_PARAMETERS", `Template not found`);
      }

      const text = await res.text();

      throw new Error(text ?? `Failed to update template: ${templateId}`);
    }
  },
);

const UpdateTemplateParamsSchema = z.object({
  apiUrl: z.string().url(),
  templateId: z.string(),
  props: z
    .object({
      isPublic: z.boolean(),
    })
    .partial(),
});

export const updateTemplateAction = guard(
  UpdateTemplateParamsSchema,
  async ({ apiUrl, templateId, props }) => {
    const { user } = await checkAuthenticated();
    const accessToken = await getUserAccessToken(user.id);

    const res = await fetch(`${apiUrl}/templates/${templateId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(props),
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new E2BError("INVALID_PARAMETERS", `Template not found`);
      }

      const text = await res.text();

      throw new Error(text ?? `Failed to update template: ${templateId}`);
    }
  },
);
