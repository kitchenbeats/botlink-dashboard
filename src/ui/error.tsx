"use client";

import { useEffect, useTransition } from "react";
import { ErrorIndicator } from "./error-indicator";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/clients/logger";
import Frame from "./frame";

// TODO: log error to sentry

export default function ErrorBoundary({
  error,
  description,
}: {
  error: Error & { digest?: string };
  description?: string;
}) {
  useEffect(() => {
    logger.error("Error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center">
      <Frame classNames={{ frame: "scale-[1.03]", wrapper: "pb-2.5" }}>
        <ErrorIndicator description={description} message={error.message} />
      </Frame>
    </div>
  );
}
