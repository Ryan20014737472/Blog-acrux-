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
    <main className="admin-workspace section pt-24 sm:pt-34" aria-busy="true" aria-live="polite">
      <div className="shell max-w-3xl">
        <p className="eyebrow">Área administrativa</p>
        <div className="glass-panel mt-6 rounded-2xl p-4 sm:rounded-3xl sm:p-8">
          <p className="text-base leading-7 text-acrux-muted">Verificando o acesso autorizado…</p>
        </div>
      </div>
    </main>
  );
}

export function AdminGate({ children }: AdminGateProps) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "unconfigured" | AdminSession | { error: string }>("checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function verifyAccess() {
      setState("checking");
      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        if (isCurrent) setState("unconfigured");
        return;
      }

      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!isCurrent) return;
        if (userError) {
          if (userError.name === "AuthSessionMissingError" || userError.status === 401 || userError.status === 403) {
            router.replace("/admin/login");
            return;
          }
          throw userError;
        }
        if (!user) {
          router.replace("/admin/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("display_name, role")
          .eq("id", user.id)
          .maybeSingle();
        if (!isCurrent) return;
        if (profileError) throw profileError;
        if (!profile || !isAdminRole(profile.role)) {
          await supabase.auth.signOut();
          if (isCurrent) router.replace("/admin/login?error=unauthorized");
          return;
        }
        setState({ email: user.email ?? "Conta autorizada", displayName: profile.display_name, role: profile.role });
      } catch {
        if (isCurrent) setState({ error: "Não foi possível verificar seu acesso agora. Confira sua conexão e tente novamente." });
      }
    }

    void verifyAccess();

    return () => {
      isCurrent = false;
    };
  }, [router, attempt]);

  if (state === "unconfigured") {
    return <AdminSetupNotice />;
  }

  if (state === "checking") {
    return <AdminLoadingState />;
  }

  if ("error" in state) {
    return <main className="admin-workspace section pt-24 sm:pt-34">
      <div className="shell max-w-3xl">
        <p className="eyebrow">Área administrativa</p>
        <div className="glass-panel mt-6 rounded-2xl p-4 sm:rounded-3xl sm:p-8">
          <h1 className="text-xl font-bold text-white">Verificação de acesso indisponível</h1>
          <p className="mt-3 text-base leading-7 text-acrux-muted" role="alert">{state.error}</p>
          <button className="button-primary mt-5 w-full sm:w-auto" onClick={() => setAttempt((value) => value + 1)} type="button">Tentar novamente</button>
        </div>
      </div>
    </main>;
  }

  return <>{children(state)}</>;
}
