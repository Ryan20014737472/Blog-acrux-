import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/content";

export type AdminAccess =
  | { kind: "unconfigured" }
  | { kind: "unauthenticated" }
  | { kind: "unauthorized" }
  | {
      kind: "authorized";
      email: string;
      displayName: string | null;
      role: Extract<UserRole, "admin" | "editor">;
    };

export async function getAdminAccess(): Promise<AdminAccess> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { kind: "unconfigured" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { kind: "unauthenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    return { kind: "unauthorized" };
  }

  return {
    kind: "authorized",
    email: user.email ?? "Conta autorizada",
    displayName: profile.display_name,
    role: profile.role,
  };
}

export async function requireAdminAccess() {
  const access = await getAdminAccess();

  if (access.kind === "unauthenticated") {
    redirect("/admin/login");
  }

  if (access.kind === "unauthorized") {
    redirect("/admin/login?error=unauthorized");
  }

  return access;
}

