"use client";

import { QUERY_KEYS } from "@/configs/keys";
import { supabase } from "@/lib/clients/supabase/client";
import { User } from "@supabase/supabase-js";
import useSWR from "swr";

export const useUser = () => {
  const { data, error, isLoading, mutate } = useSWR<User | null>(
    QUERY_KEYS.USER(),
    async () => {
      return (await supabase.auth.getUser()).data.user ?? null;
    },
  );

  return {
    user: data,
    error,
    isLoading,
    setUser: (updater: (old: User | null) => User | null) => {
      mutate(
        (old: User | null | undefined) => updater(old ?? null) ?? undefined,
      );
    },
    refetch: () => {
      return mutate();
    },
  };
};
