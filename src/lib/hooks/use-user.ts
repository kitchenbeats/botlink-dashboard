"use client";

import { QUERY_KEYS } from "@/configs/query-keys";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import useSWR from "swr";

export const useUser = () => {
  const { data, error, isLoading, mutate } = useSWR<User | null>(
    QUERY_KEYS.USER(),
    async () => {
      return (await supabase.auth.getSession()).data.session?.user ?? null;
    },
    {
      suspense: true,
      fallbackData: null,
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
