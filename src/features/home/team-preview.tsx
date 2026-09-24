"use client";

import { useEffect, useState } from "react";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { ArrowLink } from "@/components/ui/arrow-link";
import { PlaceholderMedia } from "@/components/ui/placeholder-media";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

type Member = Database["public"]["Tables"]["team_members"]["Row"];

export function TeamPreviewCards() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) { setLoaded(true); return; }
    void client.from("team_members").select("*").eq("is_published", true).eq("is_home_featured", true).order("display_order").order("name").limit(3)
      .then(({ data }) => { setMembers(data ?? []); setLoaded(true); });
  }, []);

  const client = createSupabaseBrowserClient();
  return <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {members.map((member, index) => {
      const photo = client ? getPublicImageUrl(client, "avatars", member.photo_path) : null;
      return <ScrollReveal delay={index * 0.06} key={member.id}>
        <article className="glass-panel card-hover group h-full overflow-hidden rounded-2xl">
          {photo ? <img alt={`Retrato de ${member.name}`} className="block aspect-[4/5] w-full object-cover object-[center_25%] transition-transform duration-500 motion-safe:group-hover:scale-105" decoding="async" loading="lazy" src={photo} /> : <PlaceholderMedia className="aspect-[4/5] w-full border-x-0 border-t-0" label={`Foto de ${member.name} pendente`} />}
          <div className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.15em] text-acrux-cyan-bright">{member.area ?? "ACRUX"}</p><h3 className="mt-3 text-xl font-bold tracking-[-0.025em] text-white">{member.name}</h3>{member.role_title ? <p className="mt-2 text-sm font-bold text-white/78">{member.role_title}</p> : null}{member.short_bio ? <p className="mt-3 text-sm leading-6 text-acrux-muted">{member.short_bio}</p> : null}<ArrowLink className="mt-5" href="/equipe">Ver perfil</ArrowLink></div>
        </article>
      </ScrollReveal>;
    })}
    {loaded && !members.length ? [0, 1, 2].map((index) => <ScrollReveal delay={index * 0.06} key={index}><article className="glass-panel card-hover group h-full overflow-hidden rounded-2xl"><PlaceholderMedia className="aspect-[4/5] w-full border-x-0 border-t-0" label="Foto de integrante pendente" /><div className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.15em] text-acrux-cyan-bright">Integrante em breve</p><h3 className="mt-3 text-xl font-bold text-white">Perfil da equipe</h3><p className="mt-3 text-sm leading-6 text-acrux-muted">Conteúdo da equipe será adicionado posteriormente.</p><ArrowLink className="mt-5" href="/equipe">Ver em breve</ArrowLink></div></article></ScrollReveal>) : null}
  </div>;
}

