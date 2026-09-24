"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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

  if (!loaded) return <p aria-live="polite" className="mt-10 text-sm text-acrux-muted">Carregando galeria…</p>;

  if (!galleries.length) {
    return <div className="glass-panel mt-10 flex min-h-32 items-center rounded-2xl border-l-2 border-l-acrux-cyan p-6 sm:p-8">
      <div>
        <p className="text-lg font-bold text-white">A galeria está sendo preparada</p>
        <p className="mt-2 text-sm leading-6 text-acrux-muted">Fotos publicadas e destacadas pela equipe aparecerão aqui.</p>
      </div>
    </div>;
  }

  return <div className="mt-10 grid auto-rows-[8rem] grid-cols-2 gap-3 sm:grid-cols-4 sm:auto-rows-[10rem]">
    {galleries.map((gallery, index) => {
      const cover = client ? getPublicImageUrl(client, "gallery", gallery.cover_path) : null;
      return <Link aria-label={`Abrir galeria: ${gallery.title}`} className={`${shapes[index] ?? ""} block h-full focus-visible:rounded-xl`} href="/galeria" key={gallery.id}>
        <div className="group relative h-full overflow-hidden rounded-xl">
          {cover ? <Image alt="" className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" fill loading="lazy" sizes="(min-width: 640px) 50vw, 100vw" src={cover} unoptimized /> : <PlaceholderMedia className="h-full min-h-0" label={`Capa de ${gallery.title} pendente`} />}
          <span className="absolute bottom-3 left-3 rounded-full bg-acrux-navy/85 px-3 py-1 text-xs font-bold text-white">{gallery.title}</span>
        </div>
      </Link>;
    })}
  </div>;
}
