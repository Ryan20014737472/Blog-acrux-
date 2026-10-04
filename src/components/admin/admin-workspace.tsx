"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import type { AdminSession } from "@/components/admin/admin-gate";
import { AdminNavigation } from "@/components/admin/admin-navigation";
import { useAdminNavigationProtection } from "@/components/admin/admin-draft-protection";
import { useContentNotificationStatus } from "@/components/admin/use-content-notification-status";
import { SiteLogo } from "@/components/layout/site-logo";
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
  const { busy, notice, requestNavigation } = useAdminNavigationProtection();
  const { status: notificationStatus } = useContentNotificationStatus(session.userId);

  async function signOut() {
    if (isSigningOut || busy || !await requestNavigation()) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <main className="admin-workspace section pt-24 sm:pt-28">
      <div className="shell min-w-0">
        <header className="glass-panel rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <SiteLogo className="min-h-11 shrink-0" compact />
              <div className="min-w-0 text-right sm:hidden">
                <p className="truncate text-sm font-bold text-white" title={session.displayName ?? session.email}>{session.displayName ?? session.email}</p>
                <p className="text-xs uppercase tracking-[0.12em] text-acrux-muted">{session.role}</p>
              </div>
            </div>
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-bold text-white" title={session.displayName ?? session.email}>{session.displayName ?? session.email}</p>
              <p className="text-xs uppercase tracking-[0.12em] text-acrux-muted">{session.role}</p>
            </div>
          </div>
          <AdminNavigation busy={isSigningOut || busy} signingOut={isSigningOut} onSignOut={signOut} role={session.role} section={section} canViewNotifications={notificationStatus?.is_owner === true} notificationCount={notificationStatus?.unread_count} />
          {notice ? <p className="mt-3 text-sm leading-6 text-acrux-cyan-bright" role="status">{notice}</p> : null}
        </header>

        <div className="mt-7 min-w-0 sm:mt-10">
          <p className="eyebrow">Administração</p>
          <h1 className="display-heading mt-3 [overflow-wrap:anywhere] sm:mt-5">{title}</h1>
          <p className="body-copy mt-3 sm:mt-5">{description}</p>
        </div>

        {children}
      </div>
    </main>
  );
}
