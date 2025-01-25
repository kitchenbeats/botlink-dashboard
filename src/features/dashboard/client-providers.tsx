"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MetadataProvider } from "./metadata-provider";
import { useState, useLayoutEffect } from "react";
import { DashboardTitleProvider } from "./dashboard-title-provider";
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
    <QueryClientProvider client={queryClient}>
      <MetadataProvider>
        <DashboardTitleProvider />
        {children}
      </MetadataProvider>
    </QueryClientProvider>
  );
}
