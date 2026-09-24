"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { ArrowLink } from "@/components/ui/arrow-link";
import { PlaceholderMedia } from "@/components/ui/placeholder-media";
import { groupTeamMembers } from "@/lib/team/group-members";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

type TeamMemberRow = Database["public"]["Tables"]["team_members"]["Row"];
type TeamAreaRow = Database["public"]["Tables"]["team_areas"]["Row"];

export function TeamIndex() {
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [areas, setAreas] = useState<TeamAreaRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const browserClient = createSupabaseBrowserClient();

  useEffect(() => {
    async function loadMembers() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setLoadError("A equipe ainda não está conectada ao acervo de perfis.");
        setIsLoading(false);
        return;
      }

      const [{ data, error }, { data: areaData }] = await Promise.all([
        supabase.from("team_members").select("*").eq("is_published", true).order("display_order").order("name"),
        supabase.from("team_areas").select("*").order("display_order").order("name"),
      ]);

      if (error) {
        setLoadError("Não foi possível carregar os perfis da equipe agora.");
      } else {
        setMembers(data ?? []);
        setAreas(areaData ?? []);
      }
      setIsLoading(false);
    }

    void loadMembers();
  }, []);

  const groups = groupTeamMembers(members, areas);

  return (
    <main className="section pt-34">
      <div className="shell">
        <p className="eyebrow">Equipe</p>
        <h1 className="display-heading mt-5">Pessoas que constroem a ACRUX.</h1>
        <p className="body-copy mt-6">Conheça os integrantes que compartilham ideias, técnica e criatividade na equipe.</p>

        {isLoading ? <div className="glass-panel mt-10 rounded-3xl p-7 text-acrux-muted" aria-live="polite">Carregando a equipe…</div> : null}
        {loadError ? <div className="mt-10 rounded-3xl border border-red-300/20 bg-red-950/22 p-6 text-red-100" role="alert">{loadError}</div> : null}

        {!isLoading && !loadError && groups.length ? <div className="mt-12 space-y-14">{groups.map((group) => <section aria-label={`Integrantes de ${group.name}`} key={group.name}>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-l-2 border-acrux-cyan-bright pl-4 sm:pl-5"><h2 className="text-2xl font-bold tracking-[-0.035em] text-white">{group.name}</h2><p className="text-sm text-acrux-muted">{group.members.length} {group.members.length === 1 ? "integrante" : "integrantes"}</p></div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{group.members.map((member, index) => {
          const photoUrl = browserClient ? getPublicImageUrl(browserClient, "avatars", member.photo_path) : null;
          return <motion.article className="glass-panel card-hover group overflow-hidden rounded-2xl" initial={reduceMotion ? false : { opacity: 0, y: 14 }} key={member.id} transition={{ delay: reduceMotion ? 0 : index * 0.05, duration: 0.35 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}>
            {photoUrl ? <img alt={`Retrato de ${member.name}`} className="block aspect-[4/5] w-full object-cover object-[center_25%] transition-transform duration-500 motion-safe:group-hover:scale-105" decoding="async" loading="lazy" src={photoUrl} /> : <PlaceholderMedia className="aspect-[4/5] w-full border-x-0 border-t-0" label={`Foto de ${member.name} pendente`} />}
            <div className="p-5"><h3 className="text-xl font-bold text-white">{member.name}</h3>{member.role_title ? <p className="mt-2 text-sm font-bold text-white/78">{member.role_title}</p> : null}{member.short_bio ? <p className="mt-3 text-sm leading-6 text-acrux-muted">{member.short_bio}</p> : null}</div>
          </motion.article>;
        })}</div></section>)}</div> : null}

        {!isLoading && !loadError && members.length === 0 ? <div className="glass-panel mt-10 rounded-3xl p-7"><p className="text-xl font-bold text-white">Os perfis oficiais serão publicados em breve.</p><p className="mt-3 max-w-xl text-sm leading-6 text-acrux-muted">A equipe ainda não adicionou integrantes públicos a este espaço.</p></div> : null}
        <ArrowLink className="mt-10" href="/" variant="secondary">Voltar para o início</ArrowLink>
      </div>
    </main>
  );
}

