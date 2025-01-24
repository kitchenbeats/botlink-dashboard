"use client";

import { useEffect } from "react";
import { Button } from "../ui/primitives/button";

// TODO: log error to sentry

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h2 className="mb-4 text-2xl font-semibold">Something went wrong!</h2>
      <p className="mb-4 text-fg-300">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
