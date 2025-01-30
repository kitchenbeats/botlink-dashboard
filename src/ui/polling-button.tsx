import { Button } from "@/ui/primitives/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/primitives/select";
import { RefreshCw } from "lucide-react";
import { Separator } from "./primitives/separator";
import { PollingInterval } from "@/types/dashboard";
import { useRouter } from "next/navigation";

interface PollingButtonProps {
  pollingInterval: PollingInterval;
  onIntervalChange: (interval: PollingInterval) => void;
  isLoading?: boolean;
  onRefresh: () => void;
}

const intervals = [
  { value: 0, label: "Off" },
  { value: 15, label: "15s" },
  { value: 30, label: "30s" },
  { value: 60, label: "1m" },
];

export function PollingButton({
  pollingInterval,
  onIntervalChange,
  isLoading,
  onRefresh,
}: PollingButtonProps) {
  return (
    <div className="flex h-6 items-center gap-1 px-0">
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        className="h-6 text-fg-500"
        disabled={isLoading}
      >
        <RefreshCw
          className={`size-3.5 ${isLoading ? "animate-spin duration-500 ease-in-out" : ""}`}
        />
      </Button>

      <Separator orientation="vertical" className="h-5" />

      <Select
        defaultValue={pollingInterval.toString()}
        onValueChange={(value) =>
          onIntervalChange(Number(value) as PollingInterval)
        }
      >
        <SelectTrigger className="h-6 w-fit gap-1 whitespace-nowrap border-none bg-transparent pl-2 text-fg-300">
          Auto-refresh
          <span className="ml-1 text-accent">
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          {intervals.map((interval) => (
            <SelectItem key={interval.value} value={interval.value.toString()}>
              {interval.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
