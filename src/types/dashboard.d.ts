import { Database } from "./supabase";

export type TeamWithDefault = Database["public"]["Tables"]["teams"]["Row"] & {
  is_default?: boolean;
};
