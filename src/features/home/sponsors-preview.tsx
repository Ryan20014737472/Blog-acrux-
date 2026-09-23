"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { compareSponsors, normalizedSponsorTier, sponsorTiers, type SponsorTier } from "@/config/sponsor-tiers";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

type Sponsor = Database["public"]["Tables"]["sponsors"]["Row"];

const tierStyles: Record<SponsorTier, { dot: string; title: string; border: string }> = {
  Ouro: { dot: "bg-acrux-yellow", title: "text-yellow-100", border: "border-yellow-200/25" },
  Prata: { dot: "bg-slate-200", title: "text-slate-100", border: "border-slate-200/25" },
  Bronze: { dot: "bg-orange-300", title: "text-orange-100", border: "border-orange-200/25" },
};

export function SponsorsPreview() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setLoaded(true); return; }
    void supabase.from("sponsors").select("*").eq("is_published", true).order("display_order").order("name")
      .then(({ data }) => { setSponsors([...(data ?? [])].sort(compareSponsors)); setLoaded(true); });
  }, []);

  const supabase = createSupabaseBrowserClient();
  const groups = sponsorTiers.map((tier) => ({ tier, items: sponsors.filter((sponsor) => normalizedSponsorTier(sponsor.tier) === tier) }))
    .filter((group) => group.items.length > 0);
  const unclassified = sponsors.filter((sponsor) => !normalizedSponsorTier(sponsor.tier));

  function sponsorCards(items: Sponsor[], border: string) {
    return <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((sponsor) => {
      const logo = supabase ? getPublicImageUrl(supabase, "sponsors", sponsor.logo_path) : null;
      const content = <><div className="flex h-28 items-center justify-center rounded-xl border border-white/10 bg-acrux-navy p-4">{logo ? <Image alt={`Logo de ${sponsor.name}`} className="max-h-full max-w-full object-contain" height={96} loading="lazy" src={logo} unoptimized width={240} /> : <span className="text-center text-lg font-bold text-white">{sponsor.name}</span>}</div><span className="mt-3 block text-sm font-bold text-white">{sponsor.name}</span></>;
      const className = `block h-full rounded-2xl border ${border} bg-white/2 p-3 transition-colors hover:border-cyan-200/45 focus-visible:outline-2 focus-visible:outline-acrux-cyan-bright`;
      return <li key={sponsor.id}>{sponsor.website_url ? <a className={className} href={sponsor.website_url} rel="noopener noreferrer" target="_blank">{content}<span className="sr-only"> (abre em nova aba)</span></a> : <div className={className}>{content}</div>}</li>;
    })}</ul>;
  }

  return <div className="glass-panel mt-14 rounded-3xl p-6 sm:p-8">
    <p className="eyebrow">Patrocinadores e parceiros</p>
    <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-white">Quem apoia a jornada da ACRUX</h2>
    {groups.map(({ tier, items }) => <section aria-label={`Patrocinadores ${tier}`} className="mt-8" key={tier}>
      <div className="flex items-center gap-3"><span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${tierStyles[tier].dot}`} /><h3 className={`text-lg font-bold ${tierStyles[tier].title}`}>Nível {tier}</h3><span className="text-xs text-acrux-muted">{items.length}</span></div>
      {sponsorCards(items, tierStyles[tier].border)}
    </section>)}
    {unclassified.length > 0 && <section aria-label="Parceiros sem nível definido" className="mt-8"><h3 className="text-sm font-semibold text-acrux-muted">Parceiros sem nível definido</h3>{sponsorCards(unclassified, "border-white/10")}</section>}
    {loaded && !sponsors.length && <p className="mt-3 max-w-2xl text-sm leading-6 text-acrux-muted">As marcas dos parceiros confirmados serão exibidas aqui após publicação pela equipe.</p>}
  </div>;
}

