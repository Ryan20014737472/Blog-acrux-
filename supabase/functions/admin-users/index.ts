import { createClient } from "npm:@supabase/supabase-js@2.57.0";
import { createHandler, type UserService, type Role } from "./handler.ts";

const url = Deno.env.get("SUPABASE_URL")!;
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const options = { auth: { persistSession: false, autoRefreshToken: false } };
Deno.serve(createHandler((token): UserService => {
  const admin = createClient(url, key, options);
  // Profile mutations still use the caller JWT and existing database RLS.
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { ...options, global: { headers: { Authorization: `Bearer ${token}` } } });
  return {
    async actor(jwt) {
      const { data, error } = await admin.auth.getUser(jwt);
      if (error || !data.user) return null;
      const result = await caller.from("profiles").select("role").eq("id", data.user.id).single();
      if (result.error) return null;
      return { id: data.user.id, role: result.data.role as Role };
    },
    async users(page) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 50 });
      if (error) throw error;
      return data.users;
    },
    async profiles(ids) {
      const { data, error } = await caller.from("profiles").select("id, display_name, role, updated_at").in("id", ids);
      if (error) throw error;
      return data;
    },
    async invite(email, redirectTo) {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
      if (error || !data.user) throw error ?? new Error("Missing user");
      return data.user;
    },
    async update(id, expected, role, display_name) {
      const { data, error } = await caller.from("profiles").update({ role, display_name }).eq("id", id).eq("updated_at", expected).select("id");
      if (error) throw error;
      return data.length === 1;
    },
    async recover(email, redirectTo) {
      const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
    },
    async delete(id) {
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) throw error;
    },
  };
}));

