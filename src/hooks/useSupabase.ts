import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

/** Memoized browser Supabase client — one instance per component lifecycle. */
export function useSupabase() {
  return useMemo(() => createClient(), []);
}
