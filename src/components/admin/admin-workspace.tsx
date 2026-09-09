"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import type { AdminSession } from "@/components/admin/admin-gate";
import { SiteLogo } from "@/components/layout/site-logo";
import { adminNavigation } from "@/config/site";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AdminWorkspaceProps {
  children: ReactNode;
  description: string;
  section: string;
  session: AdminSession;
  title: string;
}

export function AdminWorkspace({ children, description, section, session, title }: AdminWorkspaceProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigation = session.role === "admin" ? adminNavigation : adminNavigation.filter((item) => item.label !== "Usuários");

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <main className="section pt-28">
      <div className="shell">
        <header className="glass-panel rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-4">
              <SiteLogo compact />
              <div className="text-right sm:hidden">
                <p className="text-sm font-bold text-white">{session.displayName ?? session.email}</p>
                <p className="text-xs uppercase tracking-[0.12em] text-acrux-muted">{session.role}</p>
              </div>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-white">{session.displayName ?? session.email}</p>
              <p className="text-xs uppercase tracking-[0.12em] text-acrux-muted">{session.role}</p>
            </div>
          </div>
          <nav aria-label="Navegação administrativa" className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {navigation.map((item) => {
              const isCurrent = item.href === `/admin/${section}`;
              return (
                <Link
                  aria-current={isCurrent ? "page" : undefined}
                  className={isCurrent ? "shrink-0 rounded-full border border-cyan-200/30 bg-cyan-300/12 px-3 py-2 text-sm font-bold text-acrux-cyan-bright" : "shrink-0 rounded-full border border-white/10 bg-white/3 px-3 py-2 text-sm font-semibold text-acrux-muted transition-colors hover:border-cyan-200/25 hover:text-white"}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              className="ml-auto shrink-0 rounded-full border border-white/12 px-3 py-2 text-sm font-bold text-acrux-muted transition-colors hover:border-red-200/30 hover:text-red-100"
              disabled={isSigningOut}
              onClick={signOut}
              type="button"
            >
              {isSigningOut ? "Saindo…" : "Sair"}
            </button>
          </nav>
        </header>

        <div className="mt-10">
          <p className="eyebrow">Administração</p>
          <h1 className="display-heading mt-5">{title}</h1>
          <p className="body-copy mt-5">{description}</p>
        </div>

        {children}
      </div>
    </main>
  );
}
