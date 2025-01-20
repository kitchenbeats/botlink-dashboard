"use client";

import { getUsageAction } from "@/actions/usage-actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { use } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import DashboardPageLayout from "@/components/dashboard/dashboard-page-layout";
import { QUERY_KEYS } from "@/configs/query-keys";
import { useSelectedTeam } from "@/hooks/use-teams";
import useSWR from "swr";

const chartConfig = {
  cost: {
    label: "Cost",
    theme: {
      light: "hsl(var(--accent))",
      dark: "hsl(var(--accent))",
    },
  },
  vcpu: {
    label: "vCPU Hours",
    theme: {
      light: "hsl(var(--fg))",
      dark: "hsl(var(--fg))",
    },
  },
  ram: {
    label: "RAM Hours",
    theme: {
      light: "hsl(var(--fg))",
      dark: "hsl(var(--fg))",
    },
  },
};

const commonChartProps = {
  margin: { top: 10, right: 25, bottom: 10, left: 10 },
};

const commonXAxisProps = {
  axisLine: false,
  tickLine: false,
  tickMargin: 12,
  fontSize: 12,
  interval: 0,
  minTickGap: 30,
  allowDataOverflow: true,
} as const;

const commonYAxisProps = {
  axisLine: false,
  tickLine: false,
  tickMargin: 12,
  fontSize: 12,
  width: 50,
  allowDataOverflow: true,
} as const;

export default function UsagePageClient() {
  const selectedTeam = useSelectedTeam();

  const teamId = selectedTeam?.id;
  const queryEnabled = !!teamId;

  const { data: usageData, isLoading } = useSWR(
    queryEnabled ? QUERY_KEYS.TEAM_USAGE(teamId!) : null,
    async () => {
      const res = await getUsageAction({ teamId: teamId! });

      if (res.type === "error") {
        throw new Error(res.message);
      }

      return res.data;
    },
  );

  const showChartLoader = isLoading || !queryEnabled;

  const latestCost = usageData?.costSeries[0].data.at(-1)?.y;
  const latestVCPU = usageData?.vcpuSeries[0].data.at(-1)?.y;
  const latestRAM = usageData?.ramSeries[0].data.at(-1)?.y;

  return (
    <DashboardPageLayout title="Usage">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Cost Card */}
          <Card className="col-span-12">
            <CardHeader>
              <CardTitle className="font-mono">Cost Usage</CardTitle>
              <CardDescription>
                Total cost of all resources for the current billing period
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {showChartLoader ? (
                <Loader variant="line" />
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <p className="font-mono text-2xl">
                      ${latestCost?.toFixed(2) ?? "0.00"}
                    </p>
                    <span className="text-xs text-fg-500">this period</span>
                  </div>
                  <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-48"
                  >
                    <AreaChart
                      data={usageData?.costSeries[0].data}
                      {...commonChartProps}
                    >
                      <defs>
                        <linearGradient id="cost" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="var(--color-cost)"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--color-cost)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="x" {...commonXAxisProps} />
                      <YAxis
                        {...commonYAxisProps}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload) return null;
                          return (
                            <ChartTooltipContent
                              formatter={(value) => [
                                <span key="value">
                                  ${Number(value).toFixed(2)}
                                </span>,
                                "Cost",
                              ]}
                              payload={payload}
                              active={active}
                            />
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="y"
                        stroke="var(--color-cost)"
                        strokeWidth={2}
                        fill="url(#cost)"
                      />
                    </AreaChart>
                  </ChartContainer>
                </>
              )}
            </CardContent>
          </Card>

          {/* vCPU Card */}
          <Card className="col-span-6">
            <CardHeader>
              <CardTitle className="font-mono">vCPU Hours</CardTitle>
              <CardDescription>
                Virtual CPU time consumed by your sandboxes
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {showChartLoader ? (
                <Loader variant="line" />
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <p className="font-mono text-2xl">
                      {latestVCPU?.toFixed(2) ?? "0.00"}
                    </p>
                    <span className="text-xs text-fg-500">hours used</span>
                  </div>
                  <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-36"
                  >
                    <AreaChart
                      data={usageData?.vcpuSeries[0].data}
                      {...commonChartProps}
                    >
                      <defs>
                        <linearGradient id="vcpu" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="var(--color-vcpu)"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--color-vcpu)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="x" {...commonXAxisProps} />
                      <YAxis {...commonYAxisProps} />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload) return null;
                          return (
                            <ChartTooltipContent
                              formatter={(value) => [
                                <span key="value">
                                  {Number(value).toFixed(2)}
                                </span>,
                                "vCPU Hours",
                              ]}
                              payload={payload}
                              active={active}
                            />
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="y"
                        stroke="var(--color-vcpu)"
                        strokeWidth={2}
                        fill="url(#vcpu)"
                      />
                    </AreaChart>
                  </ChartContainer>
                </>
              )}
            </CardContent>
          </Card>

          {/* RAM Card */}
          <Card className="col-span-6">
            <CardHeader>
              <CardTitle className="font-mono">RAM Hours</CardTitle>
              <CardDescription>
                Memory usage duration across all sandboxes
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {showChartLoader ? (
                <Loader variant="line" />
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <p className="font-mono text-2xl">
                      {latestRAM?.toFixed(2) ?? "0.00"}
                    </p>
                    <span className="text-xs text-fg-500">GB-hours used</span>
                  </div>
                  <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-36"
                  >
                    <AreaChart
                      data={usageData?.ramSeries[0].data}
                      {...commonChartProps}
                    >
                      <defs>
                        <linearGradient id="ram" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="var(--color-ram)"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--color-ram)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="x" {...commonXAxisProps} />
                      <YAxis {...commonYAxisProps} />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload) return null;
                          return (
                            <ChartTooltipContent
                              formatter={(value) => [
                                <span key="value">
                                  {Number(value).toFixed(2)}
                                </span>,
                                "RAM Hours",
                              ]}
                              payload={payload}
                              active={active}
                            />
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="y"
                        stroke="var(--color-ram)"
                        strokeWidth={2}
                        fill="url(#ram)"
                      />
                    </AreaChart>
                  </ChartContainer>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
