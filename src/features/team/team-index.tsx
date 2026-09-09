"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { ArrowLink } from "@/components/ui/arrow-link";
import { PlaceholderMedia } from "@/components/ui/placeholder-media";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

type TeamMemberRow = Database["public"]["Tables"]["team_members"]["Row"];

export function TeamIndex() {
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
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

      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_published", true)
        .order("display_order")
        .order("name");

      if (error) {
        setLoadError("Não foi possível carregar os perfis da equipe agora.");
      } else {
        setMembers(data ?? []);
      }
      setIsLoading(false);
    }

    void loadMembers();
  }, []);

  const areas = Array.from(new Set(members.map((member) => member.area).filter((area): area is string => Boolean(area))));

  return (
    <main className="section pt-34">
      <div className="shell">
        <p className="eyebrow">Equipe</p>
        <h1 className="display-heading mt-5">Pessoas que constroem a ACRUX.</h1>
        <p className="body-copy mt-6">Conheça os integrantes que compartilham ideias, técnica e criatividade na equipe.</p>

        {areas.length ? <div className="mt-8 flex flex-wrap gap-2" aria-label="Áreas da equipe">{areas.map((area) => <span className="rounded-full border border-cyan-200/14 bg-cyan-300/5 px-3 py-1.5 text-xs font-bold text-acrux-muted" key={area}>{area}</span>)}</div> : null}
        {isLoading ? <div className="glass-panel mt-10 rounded-3xl p-7 text-acrux-muted" aria-live="polite">Carregando a equipe…</div> : null}
        {loadError ? <div className="mt-10 rounded-3xl border border-red-300/20 bg-red-950/22 p-6 text-red-100" role="alert">{loadError}</div> : null}

        {!isLoading && !loadError && members.length ? <section aria-label="Integrantes da equipe" className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{members.map((member, index) => {
          const photoUrl = browserClient ? getPublicImageUrl(browserClient, "avatars", member.photo_path) : null;
          return <motion.article className="glass-panel card-hover overflow-hidden rounded-2xl" initial={reduceMotion ? false : { opacity: 0, y: 14 }} key={member.id} transition={{ delay: reduceMotion ? 0 : index * 0.05, duration: 0.35 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}>
            {photoUrl ? <img alt={`Retrato de ${member.name}`} className="h-56 w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" src={photoUrl} /> : <PlaceholderMedia className="min-h-56 border-x-0 border-t-0" label={`Foto de ${member.name} pendente`} />}
            <div className="p-5"><p className="text-xs font-bold uppercase tracking-[0.15em] text-acrux-cyan-bright">{member.area ?? "ACRUX"}</p><h2 className="mt-3 text-xl font-bold text-white">{member.name}</h2>{member.role_title ? <p className="mt-2 text-sm font-bold text-white/78">{member.role_title}</p> : null}{member.short_bio ? <p className="mt-3 text-sm leading-6 text-acrux-muted">{member.short_bio}</p> : null}</div>
          </motion.article>;
        })}</section> : null}

        {!isLoading && !loadError && members.length === 0 ? <div className="glass-panel mt-10 rounded-3xl p-7"><p className="text-xl font-bold text-white">Os perfis oficiais serão publicados em breve.</p><p className="mt-3 max-w-xl text-sm leading-6 text-acrux-muted">A equipe ainda não adicionou integrantes públicos a este espaço.</p></div> : null}
        <ArrowLink className="mt-10" href="/" variant="secondary">Voltar para o início</ArrowLink>
      </div>
    </main>
  );
}
