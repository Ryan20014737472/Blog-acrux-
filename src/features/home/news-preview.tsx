"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { ArrowLink } from "@/components/ui/arrow-link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

type Post = Pick<Database["public"]["Tables"]["posts"]["Row"], "id" | "title" | "excerpt" | "cover_path" | "published_at">;

export function NewsPreviewCards() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) { setLoaded(true); return; }

    void client.from("posts")
      .select("id,title,excerpt,cover_path,published_at")
      .eq("status", "published")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(3)
      .then(({ data, error }) => {
        setPosts(data ?? []);
        setFailed(Boolean(error));
        setLoaded(true);
      });
  }, []);

  const client = createSupabaseBrowserClient();

  if (!loaded) return <p aria-live="polite" className="mt-10 text-sm text-acrux-muted">Carregando notícias…</p>;

  if (!posts.length) {
    return <div className="glass-panel mt-10 rounded-2xl border-l-2 border-l-acrux-cyan p-6 sm:p-8">
      <p className="text-lg font-bold text-white">{failed ? "Notícias indisponíveis no momento" : "A primeira história está a caminho"}</p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-acrux-muted">{failed ? "Não foi possível carregar o blog agora. Você pode tentar pela página completa." : "As publicações oficiais da equipe aparecerão aqui assim que forem lançadas."}</p>
      <ArrowLink className="mt-5" href="/blog">Ir para o blog</ArrowLink>
    </div>;
  }

  return <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
    {posts.map((post, index) => {
      const cover = client ? getPublicImageUrl(client, "blog", post.cover_path) : null;
      const date = post.published_at ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(post.published_at)) : null;
      return <article className={`glass-panel card-hover overflow-hidden rounded-2xl ${index === 0 ? posts.length === 1 ? "lg:col-span-2" : "lg:row-span-2" : ""}`} key={post.id}>
        {index === 0 && cover ? <Image alt="" className="h-52 w-full object-cover sm:h-64" height={400} loading="lazy" src={cover} unoptimized width={800} /> : null}
        <div className={index === 0 ? "p-6 sm:p-8" : "p-5 sm:p-6"}>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-acrux-cyan-bright">{index === 0 ? "Em destaque no blog" : "Últimas notícias"}{date ? ` · ${date}` : ""}</p>
          <h3 className={`mt-3 font-bold tracking-[-0.035em] text-white ${index === 0 ? "text-2xl sm:text-3xl" : "text-xl"}`}>{post.title}</h3>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-acrux-muted">{post.excerpt}</p>
          <ArrowLink className="mt-5" href="/blog">Ver no blog</ArrowLink>
        </div>
      </article>;
    })}
  </div>;
}
