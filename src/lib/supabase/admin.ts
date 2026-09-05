import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

/**
 * Server-only helper for privileged user administration. Never import this
 * module from a Client Component and never expose its key through NEXT_PUBLIC_.
 */
export function createSupabaseAdminClient() {
  const config = getSupabasePublicConfig();
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!config || !secretKey) {
    return null;
  }

  return createClient<Database>(config.url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

