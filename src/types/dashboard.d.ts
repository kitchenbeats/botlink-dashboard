import { Database } from "./supabase";

export type TeamWithDefault = Database["public"]["Tables"]["teams"]["Row"] & {
  is_default?: boolean;
};

export type PollingInterval = 0 | 15 | 30 | 60; // seconds
