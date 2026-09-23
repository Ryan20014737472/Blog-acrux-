import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

// Invitation links are opened in a new browser/device, so there is no PKCE
// verifier from the administrator's browser to exchange on this page.
export function createActivationClient() {
  const config = getSupabasePublicConfig();

  if (!config) return null;

  return createClient<Database>(config.url, config.publishableKey, {
    auth: {
      flowType: "implicit",
      detectSessionInUrl: true,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

