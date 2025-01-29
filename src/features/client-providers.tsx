"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useLayoutEffect } from "react";
import { preloadTeams } from "@/lib/hooks/use-teams";

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  useLayoutEffect(() => {
    preloadTeams();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
