"use client";

import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  clearLimitAction,
  setLimitAction,
} from "@/server/billing/billing-actions";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

interface LimitFormProps {
  teamId: string;
  className?: string;
  originalValue: number | null;
  type: "limit" | "alert";
}

export default function LimitForm({
  teamId,
  className,
  originalValue,
  type,
}: LimitFormProps) {
  const [value, setValue] = useState<number | null>(originalValue);
  const [isEditing, setIsEditing] = useState(false);

  const { toast } = useToast();

  const { mutate: saveLimit, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!value) return;
      await setLimitAction({
        type,
        value: value,
        teamId,
      });
    },
    onSuccess: () => {
      toast({
        title:
          type === "limit"
            ? "Limit saved successfully"
            : "Alert saved successfully",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: type === "limit" ? "Error saving limit" : "Error saving alert",
        description: error.message,
      });
    },
  });

  const { mutate: clearLimit, isPending: isClearing } = useMutation({
    mutationFn: async () => {
      await clearLimitAction({
        type,
        teamId,
      });
    },
    onSuccess: () => {
      toast({
        title:
          type === "limit"
            ? "Limit cleared successfully"
            : "Alert cleared successfully",
      });
      setIsEditing(false);
      setValue(null);
    },
    onError: (error: Error) => {
      toast({
        title:
          type === "limit" ? "Error clearing limit" : "Error clearing alert",
        description: error.message,
      });
    },
  });

  if (originalValue === null || isEditing) {
    return (
      <form
        className={cn("flex items-center gap-2", className)}
        onSubmit={(e) => {
          e.preventDefault();
          saveLimit();
        }}
      >
        <div className="relative">
          <Input
            type="number"
            min="0"
            className="w-[10rem] pr-6"
            value={value || ""}
            onChange={(e) => setValue(Number(e.target.value))}
            placeholder={type === "limit" ? "Limit Amount" : "Alert Amount"}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/50">
            $
          </div>
        </div>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={value === originalValue || isSaving}
          loading={isSaving}
        >
          Save
        </Button>
        {originalValue !== null && (
          <Button
            type="button"
            variant="error"
            size="sm"
            disabled={isClearing}
            loading={isClearing}
            onClick={() => clearLimit()}
          >
            Clear
          </Button>
        )}
      </form>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="mx-2 font-mono text-xs text-fg-300">
        $<span className="text-lg font-semibold text-fg">{originalValue}</span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          setIsEditing(true);
        }}
      >
        Edit
      </Button>
      <Button
        type="button"
        variant="error"
        size="sm"
        onClick={() => clearLimit()}
        disabled={isClearing}
        loading={isClearing}
      >
        Clear
      </Button>
    </div>
  );
}
