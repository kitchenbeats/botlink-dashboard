import "server-only";

import { checkAuthenticated, getTeamApiKey, guard } from "@/lib/utils/server";
import { Usage, TransformedUsageData } from "@/types/usage";
import { z } from "zod";

const GetUsageParamsSchema = z.object({
  teamId: z.string().uuid(),
});

export const getUsage = guard(GetUsageParamsSchema, async ({ teamId }) => {
  const { user } = await checkAuthenticated();

  const apiKey = await getTeamApiKey(user.id, teamId);

  const response = await fetch(
    `${process.env.BILLING_API_URL}/teams/${teamId}/usage`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Team-API-Key": apiKey,
      },
    },
  );

  if (!response.ok) {
    const text = await response.text();

    throw new Error(text ?? "Failed to fetch usage data");
  }

  const data = await response.json();

  return {
    ...transformUsageData(data.usages),
    credits: data.credits as number,
  };
});

function transformUsageData(usages: Usage[]): TransformedUsageData {
  const ramData = usages.map((usage) => ({
    x: `${String(usage.month).padStart(2, "0")}/${usage.year}`,
    y: usage.template_usage.reduce(
      (acc, template) => acc + template.ram_gb_hours,
      0,
    ),
  }));

  const vcpuData = usages.map((usage) => ({
    x: `${String(usage.month).padStart(2, "0")}/${usage.year}`,
    y: usage.template_usage.reduce(
      (acc, template) => acc + template.sandbox_hours,
      0,
    ),
  }));

  const costData = usages.map((usage) => ({
    x: `${String(usage.month).padStart(2, "0")}/${usage.year}`,
    y: usage.template_usage.reduce(
      (acc, template) => acc + template.total_cost,
      0,
    ),
  }));

  return {
    vcpuSeries: [
      {
        id: "vCPU Hours",
        data: vcpuData,
      },
    ],
    ramSeries: [
      {
        id: "RAM Usage",
        data: ramData,
      },
    ],
    costSeries: [
      {
        id: "Cost",
        data: costData,
      },
    ],
  };
}
