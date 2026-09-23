"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

type Sponsor = Database["public"]["Tables"]["sponsors"]["Row"];

export function SponsorsPreview() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setLoaded(true); return; }
    void supabase.from("sponsors").select("*").eq("is_published", true).order("display_order").order("name")
      .then(({ data }) => { setSponsors(data ?? []); setLoaded(true); });
  }, []);

  const supabase = createSupabaseBrowserClient();
  return <div className="glass-panel mt-14 rounded-3xl p-6 sm:p-8">
    <p className="eyebrow">Patrocinadores e parceiros</p>
    <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-white">Quem apoia a jornada da ACRUX</h2>
    {sponsors.length ? <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{sponsors.map((sponsor) => {
      const logo = supabase ? getPublicImageUrl(supabase, "sponsors", sponsor.logo_path) : null;
      const content = <><div className="flex h-28 items-center justify-center rounded-xl bg-white/95 p-4">{logo ? <Image alt={`Logo de ${sponsor.name}`} className="max-h-full max-w-full object-contain" height={96} loading="lazy" src={logo} unoptimized width={240} /> : <span className="text-center text-lg font-bold text-[#0b214b]">{sponsor.name}</span>}</div><span className="mt-3 block text-sm font-bold text-white">{sponsor.name}</span>{sponsor.tier && <span className="mt-1 block text-xs text-acrux-muted">{sponsor.tier}</span>}</>;
      return <li key={sponsor.id}>{sponsor.website_url ? <a className="block h-full rounded-2xl border border-white/10 p-3 transition-colors hover:border-cyan-200/35 focus-visible:outline-2 focus-visible:outline-acrux-cyan-bright" href={sponsor.website_url} rel="noopener noreferrer" target="_blank">{content}<span className="sr-only"> (abre em nova aba)</span></a> : <div className="h-full rounded-2xl border border-white/10 p-3">{content}</div>}</li>;
    })}</ul> : loaded && <p className="mt-3 max-w-2xl text-sm leading-6 text-acrux-muted">As marcas dos parceiros confirmados serão exibidas aqui após publicação pela equipe.</p>}
  </div>;
}

