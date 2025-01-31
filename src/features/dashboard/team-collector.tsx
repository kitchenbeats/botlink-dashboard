"use client";

import { useMetadataStore } from "@/lib/stores/metadata-store";
import { useEffect } from "react";

interface TeamCollectorProps {
  /** The team ID from the cookie, if one exists */
  initialTeamId?: string;
}

/**
 * Provider component that manages the selected team state across the application.
 *
 * It handles two scenarios:
 * 1. On initial load, it sets the selected team from the cookie value (initialTeamId)
 * 2. When navigating between teams, it updates the selected team based on the URL param
 *    and syncs this with both the global state and the cookie
 *
 * @param initialTeamId - The team ID from the cookie, used for initial state setup
 */
export default function TeamCollector({ initialTeamId }: TeamCollectorProps) {
  useEffect(() => {
    if (initialTeamId) {
      useMetadataStore.setState({ selectedTeamId: initialTeamId });
    }
  }, [initialTeamId]);

  return null;
}
