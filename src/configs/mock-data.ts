import { nanoid } from "nanoid";
import { Sandbox, Template } from "@/types/api";

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
  const baseDate = new Date("2024-03-19T00:00:00Z");

  for (let i = 0; i < count; i++) {
    const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    const env = ENVIRONMENTS[Math.floor(Math.random() * ENVIRONMENTS.length)];
    const component = COMPONENTS[Math.floor(Math.random() * COMPONENTS.length)];

    // Each sandbox starts 24 hours after the previous one
    const startDate = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

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

export const MOCK_SANDBOXES_DATA = generateMockSandboxes(50);
export const MOCK_TEMPLATES_DATA = TEMPLATES;
