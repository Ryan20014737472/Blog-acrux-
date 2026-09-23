"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { PlaceholderMedia } from "@/components/ui/placeholder-media";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

type Gallery = Database["public"]["Tables"]["galleries"]["Row"];
const shapes = ["col-span-2 row-span-2", "", "", "col-span-2", "", ""];

export function GalleryPreviewCards() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) { setLoaded(true); return; }
    void client.from("galleries").select("*").eq("is_published", true).eq("is_home_featured", true).order("created_at", { ascending: false }).limit(6)
      .then(({ data }) => { setGalleries(data ?? []); setLoaded(true); });
  }, []);
  const client = createSupabaseBrowserClient();
  const fallback = ["Foto em destaque", "Bastidores", "Robô", "Evento", "Projeto", "Competição"];
  return <div className="mt-10 grid auto-rows-[8rem] grid-cols-2 gap-3 sm:grid-cols-4 sm:auto-rows-[10rem]">
    {galleries.map((gallery, index) => { const cover = client ? getPublicImageUrl(client, "gallery", gallery.cover_path) : null; return <ScrollReveal className={shapes[index] ?? ""} delay={index * 0.04} key={gallery.id}><Link className="block h-full" href="/galeria"><div className="relative h-full overflow-hidden rounded-xl">{cover ? <img alt={`Capa do álbum ${gallery.title}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 motion-safe:hover:scale-105" src={cover} /> : <PlaceholderMedia className="h-full min-h-0" label={`Capa de ${gallery.title} pendente`} />}<span className="absolute bottom-3 left-3 rounded-full bg-[#020817]/80 px-3 py-1 text-xs font-bold text-white">{gallery.title}</span></div></Link></ScrollReveal>; })}
    {loaded && !galleries.length ? fallback.map((label, index) => <ScrollReveal className={shapes[index] ?? ""} delay={index * 0.04} key={label}><div className="placeholder-media h-full min-h-0 rounded-xl"><span>{label} — em breve</span></div></ScrollReveal>) : null}
  </div>;
}

