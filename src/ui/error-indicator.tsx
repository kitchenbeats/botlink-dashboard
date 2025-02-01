"use client";

import { cn } from "@/lib/utils";
import Frame from "./frame";
import { Button } from "./primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./primitives/card";
import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface ErrorIndicatorProps {
  title?: string;
  description?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  isActing?: boolean;
  className?: string;
}

export function ErrorIndicator({
  title = "Error",
  description = "Something went wrong!",
  message,
  className,
}: ErrorIndicatorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Card
      className={cn(
        "from-bg-100/40 to-bg-100/20 w-full max-w-md border bg-gradient-to-b backdrop-blur-lg",
        className,
      )}
    >
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-light">{title}</CardTitle>
        <CardDescription className="text-md mt-2 font-thin">
          {description}
        </CardDescription>
      </CardHeader>
      {message && (
        <CardContent className="text-fg-500 mx-auto max-w-md pb-0 text-center">
          <p>{message}</p>
        </CardContent>
      )}
      <CardFooter className="px-auto flex flex-col gap-4 py-4">
        <Button
          variant="outline"
          onClick={() => startTransition(() => router.refresh())}
          className="w-full max-w-md gap-2"
        >
          <RefreshCcw
            className={`text-fg-500 h-4 w-4 duration-500 ease-in-out ${isPending ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}
