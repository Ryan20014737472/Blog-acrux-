"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminGate, type AdminSession } from "@/components/admin/admin-gate";
import { adminNavigation } from "@/config/site";
import { SiteLogo } from "@/components/layout/site-logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const dashboardCards = [
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
  const navigation = session.role === "admin" ? adminNavigation : adminNavigation.filter((item) => item.label !== "Usuários");

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <main className="section pt-30">
      <div className="shell grid gap-6 lg:grid-cols-[15.5rem_1fr]">
        <aside className="glass-panel h-fit rounded-2xl p-4 lg:sticky lg:top-24">
          <SiteLogo className="px-3" compact />
          <p className="px-3 text-xs font-bold uppercase tracking-[0.15em] text-acrux-cyan-bright">Administração</p>
          <p className="mt-3 px-3 text-sm font-bold text-white">{session.displayName ?? session.email}</p>
          <p className="mt-1 px-3 text-xs uppercase tracking-[0.12em] text-acrux-muted">{session.role}</p>
          <nav aria-label="Navegação administrativa" className="mt-5 grid gap-1">
            {navigation.map((item) => (
              <Link className="rounded-xl px-3 py-2.5 text-sm font-semibold text-acrux-muted transition-colors hover:bg-white/6 hover:text-white" href={item.href} key={item.href}>{item.label}</Link>
            ))}
          </nav>
          <button className="mt-4 w-full rounded-xl border border-white/12 px-3 py-2.5 text-sm font-bold text-acrux-muted transition-colors hover:border-red-200/30 hover:text-red-100" disabled={isSigningOut} onClick={signOut} type="button">
            {isSigningOut ? "Saindo…" : "Sair"}
          </button>
        </aside>

        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-white sm:text-5xl">Olá, {session.displayName ?? "equipe"}.</h1>
          <p className="body-copy mt-5">Painel inicial para administrar o conteúdo público. As telas de gestão detalhada serão conectadas ao Supabase na próxima etapa.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {dashboardCards.map((card) => (
              <Link className="glass-panel card-hover rounded-2xl p-5" href={`/admin/${card.label.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} key={card.label}>
                <p className="text-sm font-bold text-white">{card.label}</p>
                <p className="mt-2 text-sm leading-6 text-acrux-muted">{card.description}</p>
              </Link>
            ))}
          </div>
          {session.role === "admin" ? <Link className="glass-panel card-hover mt-4 block rounded-2xl p-5" href="/admin/usuarios"><p className="text-sm font-bold text-white">Usuários</p><p className="mt-2 text-sm leading-6 text-acrux-muted">Contas autorizadas e permissões administrativas.</p></Link> : null}
        </div>
      </div>
    </main>
  );
}
