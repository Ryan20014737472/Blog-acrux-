"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { AdminSetupNotice } from "@/components/admin/admin-setup-notice";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/content";

export type AdminRole = Extract<UserRole, "admin" | "editor">;

export interface AdminSession {
  email: string;
  displayName: string | null;
  role: AdminRole;
}

interface AdminGateProps {
  children: (session: AdminSession) => ReactNode;
}

function isAdminRole(role: UserRole | null): role is AdminRole {
  return role === "admin" || role === "editor";
}

function AdminLoadingState() {
  return (
    <main className="section pt-34" aria-busy="true" aria-live="polite">
      <div className="shell max-w-3xl">
        <p className="eyebrow">Área administrativa</p>
        <div className="glass-panel mt-6 rounded-3xl p-6 sm:p-8">
          <p className="text-base leading-7 text-acrux-muted">Verificando o acesso autorizado…</p>
        </div>
      </div>
    </main>
  );
}

export function AdminGate({ children }: AdminGateProps) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "unconfigured" | AdminSession>("checking");

  useEffect(() => {
    let isCurrent = true;

    async function verifyAccess() {
      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        if (isCurrent) setState("unconfigured");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || !isAdminRole(profile.role)) {
        await supabase.auth.signOut();
        router.replace("/admin/login?error=unauthorized");
        return;
      }

      if (isCurrent) {
        setState({
          email: user.email ?? "Conta autorizada",
          displayName: profile.display_name,
          role: profile.role,
        });
      }
    }

    void verifyAccess();

    return () => {
      isCurrent = false;
    };
  }, [router]);

  if (state === "unconfigured") {
    return <AdminSetupNotice />;
  }

  if (state === "checking") {
    return <AdminLoadingState />;
  }

  return <>{children(state)}</>;
}
