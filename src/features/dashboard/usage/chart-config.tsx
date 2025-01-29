export const chartConfig = {
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

export const commonChartProps = {
  margin: { top: 10, right: 25, bottom: 10, left: 10 },
};

export const commonXAxisProps = {
  axisLine: false,
  tickLine: false,
  tickMargin: 12,
  fontSize: 12,
  interval: 0,
  minTickGap: 30,
  allowDataOverflow: true,
} as const;

export const commonYAxisProps = {
  axisLine: false,
  tickLine: false,
  tickMargin: 12,
  fontSize: 12,
  width: 50,
  allowDataOverflow: true,
} as const;
