import { nanoid } from "nanoid";
import { Sandbox, SandboxMetrics, Template } from "@/types/api";
import { addHours, subHours } from "date-fns";

const TEMPLATES: Template[] = [
  {
    aliases: ["node-typescript", "node-ts"],
    buildID: "build_001",
    cpuCount: 2,
    memoryMB: 2048,
    public: true,
    templateID: "node-typescript-v1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: {
      email: "admin@example.com",
      id: "user_001",
    },
  },
  {
    aliases: ["react-vite"],
    buildID: "build_002",
    cpuCount: 1,
    memoryMB: 1024,
    public: true,
    templateID: "react-vite-v2",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    createdBy: null,
  },
  {
    aliases: ["postgres", "pg"],
    buildID: "build_003",
    cpuCount: 2,
    memoryMB: 4096,
    public: true,
    templateID: "postgres-v15",
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-03T00:00:00Z",
    createdBy: null,
  },
  {
    aliases: ["redis"],
    buildID: "build_004",
    cpuCount: 1,
    memoryMB: 2048,
    public: true,
    templateID: "redis-v7",
    createdAt: "2024-01-04T00:00:00Z",
    updatedAt: "2024-01-04T00:00:00Z",
    createdBy: null,
  },
  {
    aliases: ["python-ml", "ml"],
    buildID: "build_005",
    cpuCount: 4,
    memoryMB: 8192,
    public: true,
    templateID: "python-ml-v1",
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-01-05T00:00:00Z",
    createdBy: null,
  },
  {
    aliases: ["elastic", "es"],
    buildID: "build_006",
    cpuCount: 2,
    memoryMB: 4096,
    public: true,
    templateID: "elastic-v8",
    createdAt: "2024-01-06T00:00:00Z",
    updatedAt: "2024-01-06T00:00:00Z",
    createdBy: null,
  },
  {
    aliases: ["grafana"],
    buildID: "build_007",
    cpuCount: 1,
    memoryMB: 2048,
    public: true,
    templateID: "grafana-v9",
    createdAt: "2024-01-07T00:00:00Z",
    updatedAt: "2024-01-07T00:00:00Z",
    createdBy: null,
  },
  {
    aliases: ["nginx"],
    buildID: "build_008",
    cpuCount: 1,
    memoryMB: 1024,
    public: true,
    templateID: "nginx-v1",
    createdAt: "2024-01-08T00:00:00Z",
    updatedAt: "2024-01-08T00:00:00Z",
    createdBy: null,
  },
  {
    aliases: ["mongodb", "mongo"],
    buildID: "build_009",
    cpuCount: 2,
    memoryMB: 4096,
    public: true,
    templateID: "mongodb-v6",
    createdAt: "2024-01-09T00:00:00Z",
    updatedAt: "2024-01-09T00:00:00Z",
    createdBy: null,
  },
  {
    aliases: ["mysql"],
    buildID: "build_010",
    cpuCount: 2,
    memoryMB: 4096,
    public: true,
    templateID: "mysql-v8",
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z",
    createdBy: null,
  },
] as const;

const ENVIRONMENTS = ["prod", "staging", "dev", "test"] as const;
const COMPONENTS = [
  "backend",
  "frontend",
  "api",
  "auth",
  "cache",
  "database",
  "queue",
  "search",
  "monitoring",
] as const;

function generateMockSandboxes(count: number): Sandbox[] {
  const sandboxes: Sandbox[] = [];
  const baseDate = new Date();

  for (let i = 0; i < count; i++) {
    const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    const env = ENVIRONMENTS[Math.floor(Math.random() * ENVIRONMENTS.length)];
    const component = COMPONENTS[Math.floor(Math.random() * COMPONENTS.length)];

    // Distribute sandboxes randomly within 24 hours from the base date
    const startDate = subHours(baseDate, Math.floor(Math.random() * 30));
    const endDate = addHours(startDate, 24);

    // Random memory and CPU from template's allowed values
    const memory = template.memoryMB;
    const cpu = template.cpuCount;

    sandboxes.push({
      alias: `${env}-${component}-${nanoid(4)}`,
      clientID: nanoid(8),
      cpuCount: cpu,
      endAt: endDate.toISOString(),
      memoryMB: memory,
      metadata: {
        lastUpdate: new Date(
          startDate.getTime() + 2 * 60 * 60 * 1000,
        ).toISOString(),
      },
      sandboxID: nanoid(8),
      startedAt: startDate.toISOString(),
      templateID: template.templateID,
    });
  }

  return sandboxes;
}

export const MOCK_SANDBOXES_DATA = () => generateMockSandboxes(100);
export const MOCK_TEMPLATES_DATA = TEMPLATES;

function generateMockMetrics(
  sandboxes: Sandbox[],
  start: Date = subHours(new Date(), 24),
  end: Date = new Date(),
): Record<string, SandboxMetrics[]> {
  const metrics: Record<string, SandboxMetrics[]> = {};
  const INTERVAL = 30 * 1000; // 30 seconds

  // Define characteristics by template type
  const templatePatterns: Record<
    string,
    { memoryProfile: string; cpuIntensity: number }
  > = {
    "node-typescript-v1": { memoryProfile: "web", cpuIntensity: 0.4 },
    "react-vite-v2": { memoryProfile: "web", cpuIntensity: 0.5 },
    "postgres-v15": { memoryProfile: "database", cpuIntensity: 0.6 },
    "redis-v7": { memoryProfile: "cache", cpuIntensity: 0.2 },
    "python-ml-v1": { memoryProfile: "ml", cpuIntensity: 0.9 },
    "elastic-v8": { memoryProfile: "search", cpuIntensity: 0.7 },
    "grafana-v9": { memoryProfile: "visualization", cpuIntensity: 0.3 },
    "nginx-v1": { memoryProfile: "web", cpuIntensity: 0.2 },
    "mongodb-v6": { memoryProfile: "database", cpuIntensity: 0.5 },
    "mysql-v8": { memoryProfile: "database", cpuIntensity: 0.6 },
  };

  // Update memory profiles to match new categories
  const memoryBaselines: Record<string, number> = {
    web: 0.15, // Web servers start very light
    database: 0.4, // Databases need higher baseline
    cache: 0.2, // Cache servers efficient but need headroom
    ml: 0.6, // ML services need substantial baseline
    search: 0.45, // Search engines need memory for indices
    visualization: 0.25, // Visualization tools moderate baseline
  };

  const memoryVolatility: Record<string, number> = {
    web: 0.15, // Web servers vary with traffic
    database: 0.1, // Databases are quite stable
    cache: 0.3, // Cache can grow/shrink quickly
    ml: 0.35, // ML workloads highly variable
    search: 0.2, // Search varies with index updates
    visualization: 0.15, // Visualization stable with query spikes
  };

  for (const sandbox of sandboxes) {
    const timeSeriesData: SandboxMetrics[] = [];
    let currentTime = start.getTime();

    const pattern = templatePatterns[sandbox.templateID] || {
      memoryProfile: "web",
      cpuIntensity: 0.5,
    };

    const memBaseline = memoryBaselines[pattern.memoryProfile];
    const memVolatility = memoryVolatility[pattern.memoryProfile];

    // Generate base load pattern (0-1 range)
    const baseLoadPattern = Array.from({ length: 24 }, (_, hour) => {
      const isBusinessHours = hour >= 8 && hour <= 18;
      return isBusinessHours
        ? 0.5 + Math.random() * 0.3
        : 0.2 + Math.random() * 0.2;
    });

    let memoryTrend = memBaseline;

    while (currentTime <= end.getTime()) {
      const hourOfDay = new Date(currentTime).getHours();
      const baseLoad = baseLoadPattern[hourOfDay];

      // CPU: More spiky, influenced by template type
      const cpuSpike = Math.random() < 0.1 ? Math.random() * 0.5 : 0; // Occasional spikes
      const cpuVariation =
        Math.sin(currentTime / 3600000) * 0.15 + Math.random() * 0.2;
      const cpuLoad = Math.max(
        0,
        Math.min(
          1,
          (baseLoad + cpuVariation + cpuSpike) * pattern.cpuIntensity,
        ),
      );
      const cpuPct = Math.min(100, Math.max(0, cpuLoad * 100));

      // Memory: Smoother transitions with profile-based behavior
      const memoryNoise = (Math.random() - 0.5) * memVolatility;
      memoryTrend = Math.max(
        memBaseline,
        Math.min(0.9, memoryTrend + memoryNoise * 0.1),
      );
      const memPct = memoryTrend + baseLoad * memVolatility;
      const memMiBUsed = Math.floor(sandbox.memoryMB * Math.min(0.95, memPct));

      timeSeriesData.push({
        cpuCount: sandbox.cpuCount,
        cpuPct,
        memMiBTotal: sandbox.memoryMB,
        memMiBUsed,
        timestamp: new Date(currentTime).toISOString(),
      });

      currentTime += INTERVAL;
    }

    metrics[sandbox.sandboxID] = timeSeriesData;
  }

  return metrics;
}

export const MOCK_METRICS_DATA = (
  sandboxes: Sandbox[],
  start: Date = subHours(new Date(), 24),
  end: Date = new Date(),
) => generateMockMetrics(sandboxes, start, end);
