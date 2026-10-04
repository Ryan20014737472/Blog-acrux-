import { createClient } from "npm:@supabase/supabase-js@2.57.0";
import { createHandler, type MailCredentials, type MailNotification, type MailService, type MailSettings } from "./handler.ts";

const url = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const options = { auth: { persistSession: false, autoRefreshToken: false } };

Deno.serve(createHandler((token): MailService => {
  const admin = createClient(url, serviceKey, options);
  const caller = token ? createClient(url, anonKey, { ...options, global: { headers: { Authorization: `Bearer ${token}` } } }) : null;
  async function rpc<T>(name: string, parameters?: Record<string, unknown>): Promise<T> {
    const { data, error } = await admin.rpc(name, parameters);
    if (error || data === null) throw new Error("Notification database operation failed");
    return data as T;
  }
  return {
    async actor(jwt) {
      const { data, error } = await admin.auth.getUser(jwt);
      if (error || !data.user || !caller) return null;
      // Ownership is looked up with the caller JWT. Editable Auth metadata,
      // administrator role and a supplied recipient never grant this access.
      const result = await caller.rpc("content_notification_status");
      if (result.error || !result.data) throw new Error("Notification owner verification failed");
      return { id: data.user.id, is_owner: result.data.is_owner === true };
    },
    verifyDispatchToken: (value) => rpc<boolean>("verify_content_notification_dispatch_token", { p_token: value }),
    settings: () => rpc<MailSettings>("get_content_notification_mail_settings"),
    configure: (apiKey, sender, enabled) => rpc<MailSettings>("configure_content_notification_mail", { p_api_key: apiKey, p_sender: sender, p_enabled: enabled }),
    credentials: () => rpc<MailCredentials>("get_content_notification_mail_credentials"),
    claim: (limit) => rpc<MailNotification[]>("claim_content_notification_emails", { p_limit: limit }),
    finish: (id, claimToken, providerId, error) => rpc<boolean>("finish_content_notification_email", { p_notification_id: id, p_claim_token: claimToken, p_provider_id: providerId, p_error: error }),
  };
}));
