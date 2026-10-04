"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminGate, type AdminSession } from "@/components/admin/admin-gate";
import { AdminNavigation } from "@/components/admin/admin-navigation";
import { useContentNotificationStatus } from "@/components/admin/use-content-notification-status";
import { SiteLogo } from "@/components/layout/site-logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const dashboardCards = [
  { label: "Sobre", description: "Editar a apresentação institucional e a trajetória." },
  { label: "Blog", description: "Criar, editar e publicar postagens." },
  { label: "Equipe", description: "Cadastrar integrantes e perfis públicos." },
  { label: "Robôs", description: "Organizar robôs e temporadas." },
  { label: "Projetos", description: "Registrar projetos e categorias." },
  { label: "Competições", description: "Registrar participações e relatos." },
  { label: "Galeria", description: "Enviar e organizar conteúdos visuais." },
  { label: "Temporadas", description: "Preservar o arquivo histórico." },
  { label: "Patrocinadores", description: "Gerenciar parceiros confirmados." },
] as const;

export function AdminDashboard() {
  return <AdminGate>{(session) => <AdminDashboardContent session={session} />}</AdminGate>;
}

function AdminDashboardContent({ session }: { session: AdminSession }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { status: notificationStatus } = useContentNotificationStatus(session.userId);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <main className="admin-workspace section pt-24 sm:pt-28">
      <div className="shell grid min-w-0 gap-6 lg:grid-cols-[15.5rem_minmax(0,1fr)]">
        <aside className="glass-panel min-w-0 h-fit rounded-2xl p-4 lg:sticky lg:top-24">
          <div className="flex min-w-0 items-center justify-between gap-3 lg:block">
            <SiteLogo className="min-h-11 shrink-0 lg:px-3" compact />
            <div className="min-w-0 text-right lg:mt-3 lg:px-3 lg:text-left">
              <p className="truncate text-sm font-bold text-white" title={session.displayName ?? session.email}>{session.displayName ?? session.email}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-acrux-muted">{session.role}</p>
            </div>
          </div>
          <AdminNavigation busy={isSigningOut} onSignOut={signOut} role={session.role} variant="sidebar" canViewNotifications={notificationStatus?.is_owner === true} notificationCount={notificationStatus?.unread_count} />
        </aside>

        <div className="min-w-0">
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-4 line-clamp-2 text-3xl font-black tracking-[-0.06em] text-white [overflow-wrap:anywhere] sm:text-5xl" title={`Olá, ${session.displayName ?? "equipe"}.`}>Olá, {session.displayName ?? "equipe"}.</h1>
          <p className="body-copy mt-5">Gerencie as páginas e os conteúdos públicos da ACRUX. As alterações publicadas aparecem no site após serem salvas.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {dashboardCards.filter((card) => session.role === "admin" || card.label !== "Sobre").map((card) => (
              <Link className="glass-panel card-hover min-w-0 rounded-2xl p-4 sm:p-5" href={`/admin/${card.label.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} key={card.label}>
                <p className="text-sm font-bold text-white">{card.label}</p>
                <p className="mt-2 text-sm leading-6 text-acrux-muted">{card.description}</p>
              </Link>
            ))}
          </div>
          {session.role === "admin" ? <Link className="glass-panel card-hover mt-4 block rounded-2xl p-5" href="/admin/usuarios"><p className="text-sm font-bold text-white">Usuários</p><p className="mt-2 text-sm leading-6 text-acrux-muted">Contas autorizadas e permissões administrativas.</p></Link> : null}
          {notificationStatus?.is_owner ? <Link className="glass-panel card-hover mt-4 block min-w-0 rounded-2xl p-5" href="/admin/notificacoes"><p className="text-sm font-bold text-white">Suas notificações{notificationStatus.unread_count > 0 ? ` · ${notificationStatus.unread_count} não lidas` : ""}</p><p className="mt-2 text-sm leading-6 text-acrux-muted">Veja quem alterou cada conteúdo e o que mudou. Histórico exclusivo da sua conta.</p></Link> : null}
        </div>
      </div>
    </main>
  );
}
