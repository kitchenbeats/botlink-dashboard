import { Card } from "@/ui/primitives/card";
import { Loader } from "@/ui/loader";
import { Suspense } from "react";
import { CostCard } from "./cost-card";
import { VCPUCard } from "./vcpu-card";
import { RAMCard } from "./ram-card";

interface UsageChartsProps {
  teamId: string;
}

export default function UsageCharts({ teamId }: UsageChartsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-12 gap-6">
        <CostCard teamId={teamId} />

        <VCPUCard teamId={teamId} />

        <RAMCard teamId={teamId} />
      </div>
    </div>
  );
}
