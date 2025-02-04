"use client";

import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  clearLimitAction,
  setLimitAction,
} from "@/server/billing/billing-actions";
import { Button } from "@/ui/primitives/button";
import { NumberInput } from "@/ui/number-input";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Label } from "@/ui/primitives/label";

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
      if (!value) {
        throw new Error("Input cannot be empty");
      }

      const res = await setLimitAction({
        type,
        value: value,
        teamId,
      });

      if (res.type === "error") {
        throw new Error(res.message);
      }

      return res.data;
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
        variant: "error",
      });
    },
  });

  const { mutate: clearLimit, isPending: isClearing } = useMutation({
    mutationFn: async () => {
      const res = await clearLimitAction({
        type,
        teamId,
      });

      if (res.type === "error") {
        throw new Error(res.message);
      }

      return res.data;
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
        variant: "error",
      });
    },
  });

  if (originalValue === null || isEditing) {
    return (
      <form
        className={cn("space-y-2", className)}
        onSubmit={(e) => {
          e.preventDefault();
          saveLimit();
        }}
      >
        <Label>$ (USD)</Label>
        <div className="flex items-center gap-2">
          <NumberInput
            min={0}
            step={10}
            value={value || 0}
            onChange={setValue}
            placeholder={"$"}
          />
          <Button
            type="submit"
            variant="outline"
            className="h-9 px-4"
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
              className="h-9 px-4"
              disabled={isClearing}
              loading={isClearing}
              onClick={() => clearLimit()}
            >
              Clear
            </Button>
          )}
        </div>
      </form>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="mx-2 font-mono text-xs text-fg-300">
        $
        <span className="text-lg font-semibold text-fg">
          {originalValue?.toLocaleString()}
        </span>
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
